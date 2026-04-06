import { Hono } from 'hono';
import type { Env } from '../index';
import { getDb, getSystemDb, writeSystemAuditLog } from '../lib/db';

export const stripeRoutes = new Hono<{ Bindings: Env }>();

const LETTER_PRICE = 499; // £4.99 in pence

// ── POST /api/stripe/create-payment ─────────────────────────

stripeRoutes.post('/create-payment', async (c) => {
  const body = await c.req.json<{ caseId: string }>();
  const userId = c.get('userId') as string;

  // Validate caseId
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.caseId)) {
    return c.json({ error: 'Invalid case ID' }, 400);
  }

  const db = getDb(c.env, userId);

  // Verify case belongs to user and is in draft
  const cases = await db.query<{ id: string; status: string }>(
    `SELECT id, status FROM cases WHERE id = $1`,
    [body.caseId]
  );

  if (cases.length === 0) {
    return c.json({ error: 'Case not found' }, 404);
  }

  const caseData = cases[0] as Record<string, string>;
  if (caseData.status !== 'draft') {
    return c.json({ error: 'Letter already sent for this case' }, 400);
  }

  // Get or create Stripe customer
  let stripeCustomerId: string;

  const userRows = await db.query<{ stripe_customer_id: string | null }>(
    `SELECT decrypt_value(stripe_customer_id, current_setting('app.encryption_key')) as stripe_customer_id
     FROM users WHERE id = $1`,
    [userId]
  );

  const existing = (userRows[0] as Record<string, string | null> | undefined)?.stripe_customer_id;

  if (existing) {
    stripeCustomerId = existing;
  } else {
    const customerRes = await stripeRequest(c.env.STRIPE_SECRET_KEY, 'customers', {
      metadata: { userId },
    });
    stripeCustomerId = customerRes.id as string;

    await db.query(
      `UPDATE users SET stripe_customer_id = encrypt_value($1, current_setting('app.encryption_key')) WHERE id = $2`,
      [stripeCustomerId, userId]
    );
  }

  // Create Payment Intent
  const paymentIntent = await stripeRequest(c.env.STRIPE_SECRET_KEY, 'payment_intents', {
    amount: String(LETTER_PRICE),
    currency: 'gbp',
    customer: stripeCustomerId,
    metadata: {
      caseId: body.caseId,
      userId,
      type: 'letter_send',
    },
    automatic_payment_methods: { enabled: 'true' },
  });

  return c.json({
    clientSecret: paymentIntent.client_secret,
    amount: LETTER_PRICE,
    currency: 'gbp',
  });
});

// ── POST /api/stripe/webhook ────────────────────────────────
// No auth middleware — uses Stripe signature verification instead.
// No user session — uses getSystemDb.

stripeRoutes.post('/webhook', async (c) => {
  const signature = c.req.header('stripe-signature');
  if (!signature) {
    return c.json({ error: 'Missing stripe-signature header' }, 400);
  }

  const rawBody = await c.req.text();

  // Verify webhook signature
  const isValid = await verifyStripeSignature(
    rawBody,
    signature,
    c.env.STRIPE_WEBHOOK_SECRET
  );

  if (!isValid) {
    return c.json({ error: 'Invalid signature' }, 400);
  }

  const event = JSON.parse(rawBody) as {
    id: string;
    type: string;
    data: {
      object: {
        id: string;
        metadata: { caseId?: string; userId?: string };
        status: string;
      };
    };
  };

  if (event.type === 'payment_intent.succeeded') {
    const { caseId, userId } = event.data.object.metadata;

    if (!caseId || !userId) {
      console.error('Missing metadata in payment intent:', event.data.object.id);
      return c.json({ received: true });
    }

    // Validate formats
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(caseId)) {
      console.error('Invalid caseId in webhook metadata:', caseId);
      return c.json({ received: true });
    }

    const systemDb = getSystemDb(c.env);

    // Idempotency: check if letter already sent
    const existingLetters = await systemDb.query(
      `SELECT id FROM letters WHERE case_id = $1 AND letter_type = 'initial_demand'`,
      [caseId]
    );

    if (existingLetters.length > 0) {
      console.log('Letter already sent for case (idempotent):', caseId);
      return c.json({ received: true });
    }

    // Record payment success only — do NOT update case status here.
    // Case status is updated by /api/send-letter after the letter
    // is actually generated, PDF created, and email delivered.
    // Updating status here causes a race condition where the webhook
    // marks the case as 'sent' before the letter exists.

    await writeSystemAuditLog(c.env, userId, 'payment.succeeded', {
      caseId,
      paymentIntentId: event.data.object.id,
      eventId: event.id,
    });
  }

  // Always return 200 to Stripe — even for unhandled event types
  return c.json({ received: true });
});

// ── Stripe API helper ───────────────────────────────────────

async function stripeRequest(
  secretKey: string,
  endpoint: string,
  params: Record<string, string | Record<string, string>>
): Promise<Record<string, unknown>> {
  const formBody = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'object') {
      for (const [subKey, subValue] of Object.entries(value)) {
        formBody.append(`${key}[${subKey}]`, subValue);
      }
    } else {
      formBody.append(key, value);
    }
  }

  const res = await fetch(`https://api.stripe.com/v1/${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${secretKey}:`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stripe API error ${res.status}: ${err}`);
  }

  return res.json() as Promise<Record<string, unknown>>;
}

// ── Stripe signature verification ───────────────────────────

async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = signature.split(',');
    const timestamp = parts.find((p) => p.startsWith('t='))?.slice(2);
    const sig = parts.find((p) => p.startsWith('v1='))?.slice(3);

    if (!timestamp || !sig) return false;

    // Reject if timestamp is older than 5 minutes — prevents replay attacks
    const age = Math.abs(Date.now() / 1000 - parseInt(timestamp, 10));
    if (age > 300) return false;

    // Compute expected signature via HMAC-SHA256
    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBytes = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(signedPayload)
    );

    const expectedSig = Array.from(new Uint8Array(signatureBytes))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // Constant-time comparison to prevent timing attacks
    if (expectedSig.length !== sig.length) return false;

    let mismatch = 0;
    for (let i = 0; i < expectedSig.length; i++) {
      mismatch |= expectedSig.charCodeAt(i) ^ sig.charCodeAt(i);
    }

    return mismatch === 0;
  } catch {
    return false;
  }
}
