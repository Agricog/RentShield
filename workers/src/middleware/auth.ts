import type { Context, Next } from 'hono';
import type { Env } from '../index';

// ── Types ───────────────────────────────────────────────────

interface JWTHeader {
  alg: string;
  kid: string;
  typ: string;
}

interface JWTPayload {
  sub: string;
  exp: number;
  iat: number;
  iss: string;
  nbf?: number;
}

interface JWK {
  kty: string;
  kid: string;
  use: string;
  alg: string;
  n: string;
  e: string;
}

interface JWKS {
  keys: JWK[];
}

// ── JWKS Cache ──────────────────────────────────────────────
// Cached in module scope — persists across requests within the same isolate.
// CF Workers reuse isolates for ~30s, so this avoids hitting Clerk on every request.

let cachedJWKS: JWKS | null = null;
let jwksCachedAt = 0;
const JWKS_CACHE_TTL = 3600000; // 1 hour

// Imported CryptoKey cache — avoids re-importing the same key
const importedKeys = new Map<string, CryptoKey>();

// ── UUID validation ─────────────────────────────────────────
// Prevents SQL injection via malformed user IDs in RLS context

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CLERK_USER_ID_REGEX = /^user_[a-zA-Z0-9]{20,40}$/;

function isValidUserId(id: string): boolean {
  return UUID_REGEX.test(id) || CLERK_USER_ID_REGEX.test(id);
}

// ── Auth Middleware ──────────────────────────────────────────

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyJWT(token, c.env.CLERK_JWKS_URL);

    // Validate user ID format — prevents injection when setting RLS context
    if (!payload.sub || !isValidUserId(payload.sub)) {
      return c.json({ error: 'Invalid token: malformed subject' }, 401);
    }

    // Check expiry
    if (payload.exp * 1000 < Date.now()) {
      return c.json({ error: 'Token expired' }, 401);
    }

    // Check not-before if present
    if (payload.nbf && payload.nbf * 1000 > Date.now()) {
      return c.json({ error: 'Token not yet valid' }, 401);
    }

    c.set('userId', payload.sub);

    // Auto-provision: ensure user exists in database
    // Webhook is primary, but this catches race conditions and webhook failures
    await ensureUserExists(payload.sub, c.env);

    await next();
  } catch (err) {
    console.error('Auth error:', err instanceof Error ? err.message : err);
    return c.json({ error: 'Invalid authentication token' }, 401);
  }
}

// ── JWT Verification ────────────────────────────────────────

async function verifyJWT(token: string, jwksUrl: string): Promise<JWTPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed JWT: expected 3 parts');
  }

  const [headerB64, payloadB64, signatureB64] = parts as [string, string, string];

  // Decode header to get kid
  const header = JSON.parse(base64UrlDecode(headerB64)) as JWTHeader;

  if (header.alg !== 'RS256') {
    throw new Error(`Unsupported algorithm: ${header.alg}`);
  }

  if (!header.kid) {
    throw new Error('Missing kid in JWT header');
  }

  // Get the signing key
  const cryptoKey = await getSigningKey(header.kid, jwksUrl);

  // Verify signature using Web Crypto API
  const signedContent = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64UrlToArrayBuffer(signatureB64);

  const isValid = await crypto.subtle.verify(
    { name: 'RSASSA-PKCS1-v1_5' },
    cryptoKey,
    signature,
    signedContent
  );

  if (!isValid) {
    throw new Error('Invalid JWT signature');
  }

  // Decode and return payload
  return JSON.parse(base64UrlDecode(payloadB64)) as JWTPayload;
}

// ── JWKS Key Resolution ─────────────────────────────────────

async function getSigningKey(kid: string, jwksUrl: string): Promise<CryptoKey> {
  // Check imported key cache first
  const cached = importedKeys.get(kid);
  if (cached) return cached;

  // Fetch JWKS (with caching)
  const jwks = await fetchJWKS(jwksUrl);

  const jwk = jwks.keys.find((k) => k.kid === kid);
  if (!jwk) {
    // Key not found — might have rotated. Force refresh once.
    cachedJWKS = null;
    jwksCachedAt = 0;
    const refreshed = await fetchJWKS(jwksUrl);
    const retryJwk = refreshed.keys.find((k) => k.kid === kid);
    if (!retryJwk) {
      throw new Error(`Signing key not found: ${kid}`);
    }
    return importJWK(retryJwk);
  }

  return importJWK(jwk);
}

async function fetchJWKS(jwksUrl: string): Promise<JWKS> {
  // Return cached if fresh
  if (cachedJWKS && Date.now() - jwksCachedAt < JWKS_CACHE_TTL) {
    return cachedJWKS;
  }

  const res = await fetch(jwksUrl, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`JWKS fetch failed: ${res.status}`);
  }

  cachedJWKS = (await res.json()) as JWKS;
  jwksCachedAt = Date.now();

  return cachedJWKS;
}

async function importJWK(jwk: JWK): Promise<CryptoKey> {
  const key = await crypto.subtle.importKey(
    'jwk',
    {
      kty: jwk.kty,
      n: jwk.n,
      e: jwk.e,
      alg: 'RS256',
      use: 'sig',
    },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  // Cache the imported key
  importedKeys.set(jwk.kid, key);

  return key;
}

// ── Auto-Provisioning ───────────────────────────────────────
// Safety net: if the Clerk webhook failed or hasn't fired yet,
// create the user on first authenticated API call.

const provisionedUsers = new Set<string>();

async function ensureUserExists(userId: string, env: Env): Promise<void> {
  // In-memory cache — avoid DB check on every request within the same isolate
  if (provisionedUsers.has(userId)) return;

  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(env.DATABASE_URL);

    const rows = await sql`SELECT id FROM users WHERE id = ${userId}`;

    if (rows.length === 0) {
      // User authenticated via Clerk but doesn't exist in DB — create them
      // Email will be empty until webhook fires with full data, but the row
      // exists so foreign key constraints won't fail
      await sql`
        INSERT INTO users (id, email_encrypted)
        VALUES (${userId}, encrypt_value('pending@repairletter.co.uk', ${env.DB_ENCRYPTION_KEY}))
        ON CONFLICT (id) DO NOTHING
      `;
      console.log('Auto-provisioned user:', userId);
    }

    provisionedUsers.add(userId);
  } catch (err) {
    // Non-fatal — log but don't block the request
    console.error('Auto-provision check failed:', err);
  }
}

// ── Base64URL Helpers ───────────────────────────────────────

function base64UrlDecode(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const paddedWithEquals = padded + '='.repeat((4 - (padded.length % 4)) % 4);
  return atob(paddedWithEquals);
}

function base64UrlToArrayBuffer(str: string): ArrayBuffer {
  const binary = base64UrlDecode(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
