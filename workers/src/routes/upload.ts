import { Hono } from 'hono';
import type { Env } from '../index';
import { getDb, writeAuditLog } from '../lib/db';

export const uploadRoutes = new Hono<{ Bindings: Env }>();

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'audio/webm'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB

// ── POST /api/upload-url — generate upload endpoint ─────────

uploadRoutes.post('/upload-url', async (c) => {
  const body = await c.req.json<{ contentType: string; caseId?: string }>();

  if (!ALLOWED_TYPES.includes(body.contentType)) {
    return c.json({ error: 'Unsupported file type. Only JPEG, PNG, and WebM accepted.' }, 400);
  }

  const userId = c.get('userId') as string;
  const ext = body.contentType === 'image/jpeg' ? 'jpg'
    : body.contentType === 'image/png' ? 'png'
    : 'webm';

  // User-scoped R2 key — enforced on download too
  const r2Key = `users/${userId}/evidence/${crypto.randomUUID()}.${ext}`;
  const expiresAt = new Date(Date.now() + 3600000).toISOString();

  const db = getDb(c.env, userId);
  await writeAuditLog(db, 'upload.url_generated', {
    r2Key,
    contentType: body.contentType,
    caseId: body.caseId ?? null,
  });

  return c.json({
    uploadUrl: `/api/upload/${encodeURIComponent(r2Key)}`,
    r2Key,
    expiresAt,
  });
});

// ── PUT /api/upload/:key — proxy upload to R2 ───────────────

uploadRoutes.put('/upload/:key{.+}', async (c) => {
  const r2Key = decodeURIComponent(c.req.param('key'));
  const userId = c.get('userId') as string;

  // Security: key must belong to this user
  if (!r2Key.startsWith(`users/${userId}/`)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const contentType = c.req.header('Content-Type');
  if (!contentType || !ALLOWED_TYPES.includes(contentType)) {
    return c.json({ error: 'Invalid content type' }, 400);
  }

  // Size limit based on type
  const maxSize = contentType.startsWith('audio/') ? MAX_AUDIO_SIZE : MAX_IMAGE_SIZE;
  const contentLength = parseInt(c.req.header('Content-Length') ?? '0', 10);
  if (contentLength > maxSize) {
    return c.json({ error: `File too large. Max ${maxSize / (1024 * 1024)}MB.` }, 413);
  }

  const body = await c.req.arrayBuffer();

  // Double-check actual size against declared
  if (body.byteLength > maxSize) {
    return c.json({ error: 'File too large' }, 413);
  }

  // Magic byte validation — prevents disguised files
  if (!validateMagicBytes(new Uint8Array(body), contentType)) {
    return c.json({ error: 'File content does not match declared type' }, 400);
  }

  // Upload to R2
  await c.env.EVIDENCE_BUCKET.put(r2Key, body, {
    httpMetadata: { contentType },
    customMetadata: {
      userId,
      uploadedAt: new Date().toISOString(),
    },
  });

  const db = getDb(c.env, userId);
  await writeAuditLog(db, 'upload.completed', {
    r2Key,
    contentType,
    size: body.byteLength,
  });

  return c.json({ success: true, r2Key });
});

// ── GET /api/evidence-url/:key — serve file via signed access ─

uploadRoutes.get('/evidence-url/:key{.+}', async (c) => {
  const r2Key = decodeURIComponent(c.req.param('key'));
  const userId = c.get('userId') as string;

  // Security: only own files
  if (!r2Key.startsWith(`users/${userId}/`)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const file = await c.env.EVIDENCE_BUCKET.get(r2Key);
  if (!file) {
    return c.json({ error: 'File not found' }, 404);
  }

  return new Response(file.body, {
    headers: {
      'Content-Type': file.httpMetadata?.contentType ?? 'application/octet-stream',
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': 'inline',
    },
  });
});

/**
 * Validates magic bytes match the declared content type.
 * Prevents uploading executable or script files disguised as images.
 */
function validateMagicBytes(bytes: Uint8Array, contentType: string): boolean {
  if (bytes.length < 4) return false;

  switch (contentType) {
    case 'image/jpeg':
      // JPEG: FF D8 FF
      return bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;

    case 'image/png':
      // PNG: 89 50 4E 47
      return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;

    case 'audio/webm':
      // WebM/EBML: 1A 45 DF A3
      return bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3;

    default:
      return false;
  }
}
