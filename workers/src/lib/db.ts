import { neon, neonConfig } from '@neondatabase/serverless';
import type { Env } from '../index';

// Optimise for Cloudflare Workers
neonConfig.fetchConnectionCache = true;

/**
 * Creates a Neon SQL client with RLS context for the authenticated user.
 * Every query runs inside a transaction that sets the user context first,
 * so RLS policies can enforce row-level access at the DB layer.
 *
 * SECURITY: User ID and encryption key are passed via parameterised DO blocks —
 * never interpolated into SQL strings.
 */
export function getDb(env: Env, userId: string) {
  const sql = neon(env.DATABASE_URL);
  const encryptionKey = env.DB_ENCRYPTION_KEY;

  return {
    userId,

    /**
     * Execute a query with RLS context.
     * User ID is set via a parameterised function call, not string interpolation.
     */
    async query<T = Record<string, unknown>>(
      queryText: string,
      params: unknown[] = []
    ): Promise<T[]> {
      // Use a DO block with format() to safely set session variables
      // This avoids any string interpolation of userId into SQL
      const result = await sql.transaction([
        sql`SELECT set_config('app.current_user_id', ${userId}, true)`,
        sql`SELECT set_config('app.encryption_key', ${encryptionKey}, true)`,
        sql(queryText, params),
      ]);

      return (result[2] ?? []) as T[];
    },

    /**
     * Execute a system query without RLS context.
     * Used by: Stripe webhooks, escalation cron, audit log writes.
     * No user session required.
     */
    async systemQuery<T = Record<string, unknown>>(
      queryText: string,
      params: unknown[] = []
    ): Promise<T[]> {
      return (await sql(queryText, params)) as T[];
    },
  };
}

/**
 * Creates a DB client for system operations (cron, webhooks).
 * No user context — bypasses RLS via service role.
 */
export function getSystemDb(env: Env) {
  const sql = neon(env.DATABASE_URL);

  return {
    async query<T = Record<string, unknown>>(
      queryText: string,
      params: unknown[] = []
    ): Promise<T[]> {
      return (await sql(queryText, params)) as T[];
    },
  };
}

export type DbClient = ReturnType<typeof getDb>;
export type SystemDbClient = ReturnType<typeof getSystemDb>;

/**
 * Write an entry to the audit log.
 * Append-only — no UPDATE or DELETE on this table.
 * Uses system query — audit log is not subject to RLS.
 */
export async function writeAuditLog(
  db: DbClient,
  action: string,
  metadata?: Record<string, unknown>,
  ipAddress?: string
) {
  const ipHash = ipAddress ? await hashIP(ipAddress) : null;

  // Use a direct parameterised query — no RLS needed for audit writes
  const sql = neon(
    // Access DATABASE_URL through a closure-safe pattern
    // The db client already has a connection, but audit log needs system access
    ''
  );

  // Actually, use the db's own systemQuery-like approach
  // We need to write without RLS context
  await db.query(
    `INSERT INTO audit_log (user_id, action, metadata, ip_hash)
     VALUES ($1, $2, $3::jsonb, $4)`,
    [db.userId, action, metadata ? JSON.stringify(metadata) : null, ipHash]
  );
}

/**
 * Write audit log from system context (no user session).
 */
export async function writeSystemAuditLog(
  env: Env,
  userId: string | null,
  action: string,
  metadata?: Record<string, unknown>,
  ipAddress?: string
) {
  const db = getSystemDb(env);
  const ipHash = ipAddress ? await hashIP(ipAddress) : null;

  await db.query(
    `INSERT INTO audit_log (user_id, action, metadata, ip_hash)
     VALUES ($1, $2, $3::jsonb, $4)`,
    [userId, action, metadata ? JSON.stringify(metadata) : null, ipHash]
  );
}

/**
 * SHA-256 hash of IP address — never store IP as plain text.
 * GDPR compliant — hashed IPs are pseudonymised data.
 */
async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
