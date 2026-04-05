import { neon, neonConfig } from '@neondatabase/serverless';
import type { Env } from '../index';

neonConfig.fetchConnectionCache = true;

export function getDb(env: Env, userId: string) {
  const sql = neon(env.DATABASE_URL);
  const encryptionKey = env.DB_ENCRYPTION_KEY;

  return {
    userId,
    async query<T = Record<string, unknown>>(
      queryText: string,
      params: unknown[] = []
    ): Promise<T[]> {
      const result = await sql.transaction([
        sql`SELECT set_config('app.current_user_id', ${userId}, true)`,
        sql`SELECT set_config('app.encryption_key', ${encryptionKey}, true)`,
        sql(queryText, params),
      ]);
      return (result[2] ?? []) as T[];
    },
    async systemQuery<T = Record<string, unknown>>(
      queryText: string,
      params: unknown[] = []
    ): Promise<T[]> {
      return (await sql(queryText, params)) as T[];
    },
  };
}

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

export async function writeAuditLog(
  db: DbClient,
  action: string,
  metadata?: Record<string, unknown>,
  ipAddress?: string
) {
  const ipHash = ipAddress ? await hashIP(ipAddress) : null;
  await db.query(
    `INSERT INTO audit_log (user_id, action, metadata, ip_hash)
     VALUES ($1, $2, $3::jsonb, $4)`,
    [db.userId, action, metadata ? JSON.stringify(metadata) : null, ipHash]
  );
}

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

async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
