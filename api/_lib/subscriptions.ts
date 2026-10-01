import crypto from 'node:crypto';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth, adminDb } from './firebaseAdmin.js';

export type SubscriptionPlan = 'monthly' | 'annual';
export type EventAction = 'grant' | 'revoke' | 'cancel_end' | 'past_due' | 'ignore';
export type TargetIdentity =
  | { kind: 'user'; uid: string; email: string }
  | { kind: 'pending'; email: string };

const DEFAULT_ADMIN_EMAILS = [
  'luiz.honorato@lcmconstrucao.com.br',
  'luizeduardo85187995@gmail.com',
];

const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS.join(','))
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
);

const MONTHLY_CHECKOUT_CODES = new Set(
  (process.env.KIWIFY_MONTHLY_CHECKOUT_CODES || 'DCGRpFb')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
);

const ANNUAL_CHECKOUT_CODES = new Set(
  (process.env.KIWIFY_ANNUAL_CHECKOUT_CODES || '09lfPE1')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
);

export function normalizeEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

export function safeString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

export function sha256(value: string | Buffer): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function timingSafeHexEqual(received: string, expected: string): boolean {
  const cleanReceived = received.trim().toLowerCase().replace(/^sha1=/, '');
  const cleanExpected = expected.trim().toLowerCase();
  if (!/^[a-f0-9]+$/.test(cleanReceived) || cleanReceived.length !== cleanExpected.length) {
    return false;
  }
  const receivedBuffer = Buffer.from(cleanReceived, 'hex');
  const expectedBuffer = Buffer.from(cleanExpected, 'hex');
  return receivedBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

export function verifyKiwifySignature(rawBody: string, parsedBody: unknown, requestUrl: string, headers: Headers) {
  const secret = (process.env.KIWIFY_WEBHOOK_SECRET || '').trim();
  if (!secret) return { ok: false, reason: 'KIWIFY_WEBHOOK_SECRET não configurado.' };

  const url = new URL(requestUrl);
  const signature = safeString(
    url.searchParams.get('signature') || headers.get('x-kiwify-signature') || headers.get('X-Kiwify-Signature')
  );
  if (!signature) return { ok: false, reason: 'Assinatura da Kiwify ausente.' };

  const candidates = [rawBody, JSON.stringify(parsedBody ?? {})];
  for (const payload of candidates) {
    const expected = crypto.createHmac('sha1', secret).update(payload).digest('hex');
    if (timingSafeHexEqual(signature, expected)) return { ok: true };
  }
  return { ok: false, reason: 'Assinatura da Kiwify inválida.' };
}

export function extractWebhookData(body: any) {
  const customer = body?.Customer || body?.customer || body?.data?.customer || {};
  const product = body?.Product || body?.product || body?.data?.product || {};
  const subscription = body?.Subscription || body?.subscription || body?.data?.subscription || {};
  const tracking = body?.TrackingParameters || body?.tracking_parameters || body?.trackingParameters || {};

  return {
    event: safeString(
      body?.webhook_event_type || body?.event || body?.event_type || body?.order_status || body?.status
    ).toLowerCase(),
    customerEmail: normalizeEmail(customer?.email || body?.email || body?.customer_email),
    orderId: safeString(body?.order_id || body?.order_ref || body?.id || body?.order?.id || body?.data?.order_id),
    subscriptionId: safeString(subscription?.id || body?.subscription_id || body?.data?.subscription_id),
    productId: safeString(product?.product_id || product?.id || body?.product_id || body?.data?.product_id),
    productName: safeString(product?.product_name || product?.name || body?.product_name || body?.data?.product_name).toLowerCase(),
    frequency: safeString(subscription?.plan?.frequency || subscription?.frequency || body?.frequency).toLowerCase(),
    checkoutCode: safeString(body?.checkout_link || body?.checkoutLink || body?.data?.checkout_link),
    customUid: safeString(
      body?.custom_fields?.uid || tracking?.uid || tracking?.sck || body?.metadata?.uid || body?.data?.custom_fields?.uid
    ),
    nextPaymentRaw: subscription?.next_payment || subscription?.next_payment_at || body?.next_payment || body?.next_payment_at || null,
  };
}

export function determinePlan(data: ReturnType<typeof extractWebhookData>): SubscriptionPlan | null {
  // Defesa em profundidade: se a Kiwify informou um checkout, só aceitamos os checkouts PRO conhecidos.
  // Isso evita que outro produto da mesma conta conceda PRO caso a configuração do webhook seja alterada por engano.
  if (data.checkoutCode) {
    if (ANNUAL_CHECKOUT_CODES.has(data.checkoutCode)) return 'annual';
    if (MONTHLY_CHECKOUT_CODES.has(data.checkoutCode)) return 'monthly';
    return null;
  }

  const freq = data.frequency;
  if (freq.includes('anual') || freq.includes('annual') || freq.includes('year')) return 'annual';
  if (freq.includes('mensal') || freq.includes('monthly') || freq.includes('month')) return 'monthly';

  if (data.productName.includes('anual') || data.productName.includes('annual')) return 'annual';
  if (data.productName.includes('mensal') || data.productName.includes('monthly')) return 'monthly';

  return null;
}

export function eventAction(event: string): EventAction {
  if (['order_approved', 'subscription_renewed', 'paid', 'approved', 'completed'].includes(event)) return 'grant';
  if (['order_refunded', 'refunded', 'chargeback', 'charged_back', 'chargedback', 'dispute'].includes(event)) return 'revoke';
  if (['subscription_canceled', 'subscription_cancelled'].includes(event)) return 'cancel_end';
  if (['subscription_late', 'past_due', 'overdue'].includes(event)) return 'past_due';
  return 'ignore';
}

export async function resolveTargetIdentity(customerEmail: string, customUid: string): Promise<TargetIdentity> {
  if (customerEmail) {
    try {
      const user = await adminAuth.getUserByEmail(customerEmail);
      if (customUid && customUid !== user.uid) {
        throw new Error('UID do checkout não corresponde ao e-mail do comprador.');
      }
      return { kind: 'user', uid: user.uid, email: customerEmail };
    } catch (error: any) {
      if (error?.code !== 'auth/user-not-found') throw error;
      return { kind: 'pending', email: customerEmail };
    }
  }

  if (customUid) {
    const user = await adminAuth.getUser(customUid);
    return { kind: 'user', uid: user.uid, email: normalizeEmail(user.email) };
  }

  throw new Error('Webhook sem e-mail do comprador e sem UID confiável.');
}

function calculateExpiresAt(plan: SubscriptionPlan, existingExpiresAt?: unknown, nextPaymentRaw?: unknown): string {
  const suppliedNextPayment = nextPaymentRaw ? new Date(String(nextPaymentRaw)) : null;
  if (suppliedNextPayment && !Number.isNaN(suppliedNextPayment.getTime()) && suppliedNextPayment.getTime() > Date.now()) {
    return suppliedNextPayment.toISOString();
  }

  const now = new Date();
  const existing = existingExpiresAt ? new Date(String(existingExpiresAt)) : null;
  const base = existing && !Number.isNaN(existing.getTime()) && existing.getTime() > now.getTime() ? existing : now;
  const next = new Date(base.getTime());
  if (plan === 'annual') next.setFullYear(next.getFullYear() + 1);
  else next.setMonth(next.getMonth() + 1);
  return next.toISOString();
}

function createIdempotencyKey(action: EventAction, data: ReturnType<typeof extractWebhookData>, rawBody: string): string {
  const transactionRef = data.orderId || data.subscriptionId || sha256(rawBody || JSON.stringify(data));
  const actionGroup = action === 'grant' ? 'grant' : `${action}:${data.event}`;
  return sha256(`kiwify:${actionGroup}:${transactionRef}`);
}

export async function processSubscriptionEvent(
  action: EventAction,
  target: TargetIdentity,
  plan: SubscriptionPlan,
  data: ReturnType<typeof extractWebhookData>,
  rawBody: string
) {
  const eventId = createIdempotencyKey(action, data, rawBody);
  const eventRef = adminDb.collection('webhookEvents').doc(eventId);
  const targetRef =
    target.kind === 'user'
      ? adminDb.collection('subscriptions').doc(target.uid)
      : adminDb.collection('pendingSubscriptions').doc(sha256(target.email));

  return adminDb.runTransaction(async (tx) => {
    const eventSnap = await tx.get(eventRef);
    if (eventSnap.exists) return { duplicate: true, changed: false, expiresAt: null as string | null };

    const targetSnap = await tx.get(targetRef);
    const existing = targetSnap.exists ? targetSnap.data() || {} : {};
    let expiresAt: string | null = typeof existing.expiresAt === 'string' ? existing.expiresAt : null;
    let changed = false;

    if (action === 'grant') {
      expiresAt = calculateExpiresAt(plan, existing.expiresAt, data.nextPaymentRaw);
      tx.set(targetRef, {
        plan,
        expiresAt,
        status: 'active',
        cancelAtPeriodEnd: false,
        updatedAt: new Date().toISOString(),
        paymentMethod: 'Kiwify Automatic Webhook',
        customerEmail: target.email,
        orderId: data.orderId || null,
        subscriptionId: data.subscriptionId || null,
        checkoutCode: data.checkoutCode || null,
        source: 'kiwify',
      }, { merge: true });
      changed = true;
    } else if (action === 'revoke') {
      expiresAt = null;
      tx.set(targetRef, {
        plan: 'free', expiresAt: null, status: 'revoked', cancelAtPeriodEnd: false,
        updatedAt: new Date().toISOString(), paymentMethod: 'Kiwify Refund/Chargeback',
        customerEmail: target.email, orderId: data.orderId || null,
        subscriptionId: data.subscriptionId || null, source: 'kiwify',
      }, { merge: true });
      changed = true;
    } else if (action === 'cancel_end') {
      tx.set(targetRef, {
        status: 'canceling', cancelAtPeriodEnd: true, updatedAt: new Date().toISOString(),
        customerEmail: target.email, orderId: data.orderId || null,
        subscriptionId: data.subscriptionId || null, source: 'kiwify',
      }, { merge: true });
      changed = true;
    } else if (action === 'past_due') {
      tx.set(targetRef, {
        status: 'past_due', updatedAt: new Date().toISOString(), customerEmail: target.email,
        orderId: data.orderId || null, subscriptionId: data.subscriptionId || null, source: 'kiwify',
      }, { merge: true });
      changed = true;
    }

    tx.create(eventRef, {
      provider: 'kiwify', event: data.event || 'unknown', action,
      orderIdHash: data.orderId ? sha256(data.orderId) : null,
      targetUid: target.kind === 'user' ? target.uid : null,
      targetEmailHash: target.email ? sha256(target.email) : null,
      processedAt: new Date().toISOString(), changed,
    });

    return { duplicate: false, changed, expiresAt };
  });
}

export function isAdminToken(decoded: DecodedIdToken): boolean {
  if (decoded.admin === true) return true;
  const email = normalizeEmail(decoded.email);
  return Boolean(decoded.email_verified && email && ADMIN_EMAILS.has(email));
}

export async function requireFirebaseToken(request: Request): Promise<DecodedIdToken> {
  const authHeader = request.headers.get('authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new Error('Token Firebase ausente.');
  return adminAuth.verifyIdToken(match[1], true);
}

export async function claimPendingSubscription(decoded: DecodedIdToken) {
  const email = normalizeEmail(decoded.email);
  if (!email || !decoded.email_verified) return { claimed: false, reason: 'Conta sem e-mail verificado.' };

  const pendingRef = adminDb.collection('pendingSubscriptions').doc(sha256(email));
  const subscriptionRef = adminDb.collection('subscriptions').doc(decoded.uid);

  return adminDb.runTransaction(async (tx) => {
    const pendingSnap = await tx.get(pendingRef);
    if (!pendingSnap.exists) return { claimed: false, reason: 'Nenhuma assinatura pendente.' };

    const pending = pendingSnap.data() || {};
    const pendingExpiresAt = typeof pending.expiresAt === 'string' ? pending.expiresAt : null;
    const pendingActive =
      (pending.plan === 'monthly' || pending.plan === 'annual') &&
      pendingExpiresAt && new Date(pendingExpiresAt).getTime() > Date.now();

    if (!pendingActive) {
      tx.delete(pendingRef);
      return { claimed: false, reason: 'Assinatura pendente inexistente, revogada ou expirada.' };
    }

    const currentSnap = await tx.get(subscriptionRef);
    const current = currentSnap.exists ? currentSnap.data() || {} : {};
    const currentExpiresAt = typeof current.expiresAt === 'string' ? current.expiresAt : null;
    const usePending = !currentExpiresAt || new Date(pendingExpiresAt).getTime() > new Date(currentExpiresAt).getTime();

    if (usePending) {
      tx.set(subscriptionRef, {
        ...pending, customerEmail: email, claimedAt: new Date().toISOString(), claimedByUid: decoded.uid,
      }, { merge: true });
    }
    tx.delete(pendingRef);
    return { claimed: true, expiresAt: usePending ? pendingExpiresAt : currentExpiresAt };
  });
}
