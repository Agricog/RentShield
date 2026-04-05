import type { Context } from 'hono';
import type { Env } from '../index';

interface RateLimitConfig {
  /** Max requests in the window */
  max: number;
  /** Window duration in seconds */
  windowSeconds: number;
  /** Key prefix for namespacing */
  prefix: string;
}

/**
 * Sliding window rate limiter using Upstash Redis REST API.
 * Returns whether the request is allowed plus remaining quota.
 * Fails open — if Redis is down, requests are allowed to prevent lockout.
 */
export async function checkRateLimit(
  c: Context<{ Bindings: Env }>,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const userId = c.get('userId') as string;
  const key = `${config.prefix}:${userId}`;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const windowStart = now - windowMs;

  try {
    // Upstash Redis REST API — pipeline: ZREMRANGEBYSCORE, ZADD, ZCARD, EXPIRE
    const pipeline = [
      ['ZREMRANGEBYSCORE', key, '0', String(windowStart)],
      ['ZADD', key, String(now), `${now}:${crypto.randomUUID().slice(0, 8)}`],
      ['ZCARD', key],
      ['EXPIRE', key, String(config.windowSeconds)],
    ];

    const res = await fetch(`${c.env.UPSTASH_REDIS_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${c.env.UPSTASH_REDIS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pipeline),
    });

    if (!res.ok) {
      console.error('Rate limiter Redis error:', res.status);
      return { allowed: true, remaining: config.max, resetAt: now + windowMs };
    }

    const results = (await res.json()) as Array<{ result: number }>;
    const count = results[2]?.result ?? 0;
    const remaining = Math.max(0, config.max - count);
    const allowed = count <= config.max;

    return { allowed, remaining, resetAt: now + windowMs };
  } catch (err) {
    // Fail open — never block users because Redis is unavailable
    console.error('Rate limiter error:', err);
    return { allowed: true, remaining: config.max, resetAt: now + windowMs };
  }
}

// ── Pre-configured limiters ─────────────────────────────────

/** Max 5 voice transcriptions per user per hour */
export const VOICE_RATE_LIMIT: RateLimitConfig = {
  max: 5,
  prefix: 'rl:voice',
  windowSeconds: 3600,
};

/** Max 3 letter generations per user per day */
export const LETTER_RATE_LIMIT: RateLimitConfig = {
  max: 3,
  prefix: 'rl:letter',
  windowSeconds: 86400,
};

/** Max 10 photo analyses per user per hour */
export const PHOTO_RATE_LIMIT: RateLimitConfig = {
  max: 10,
  prefix: 'rl:photo',
  windowSeconds: 3600,
};

/** Max 20 general API calls per user per minute */
export const GENERAL_RATE_LIMIT: RateLimitConfig = {
  max: 20,
  prefix: 'rl:general',
  windowSeconds: 60,
};
