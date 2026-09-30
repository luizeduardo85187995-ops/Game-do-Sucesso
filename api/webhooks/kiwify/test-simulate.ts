import crypto from 'node:crypto';
import {
  isAdminToken,
  normalizeEmail,
  processSubscriptionEvent,
  requireFirebaseToken,
  resolveTargetIdentity,
  safeString,
} from '../../_lib/subscriptions.js';

export async function POST(request: Request) {
  try {
    const decoded = await requireFirebaseToken(request);
    if (!isAdminToken(decoded)) {
      return Response.json({ success: false, message: 'Acesso administrativo negado.' }, { status: 403 });
    }

    const body: any = await request.json().catch(() => ({}));
    const plan = body?.plan === 'annual' ? 'annual' : body?.plan === 'monthly' ? 'monthly' : null;
    if (!plan) return Response.json({ success: false, message: 'Plano inválido.' }, { status: 400 });

    const email = normalizeEmail(body?.email);
    const uid = safeString(body?.uid);
    if (!email && !uid) {
      return Response.json({ success: false, message: 'Informe e-mail ou UID.' }, { status: 400 });
    }

    const target = await resolveTargetIdentity(email, uid);
    const data = {
      event: 'order_approved', customerEmail: email,
      orderId: `admin-sim-${Date.now()}-${crypto.randomUUID()}`,
      subscriptionId: '', productId: '', productName: plan === 'annual' ? 'Plano Anual' : 'Plano Mensal',
      frequency: plan === 'annual' ? 'annual' : 'monthly', checkoutCode: '', customUid: uid, nextPaymentRaw: null,
    };
    const result = await processSubscriptionEvent('grant', target, plan, data, JSON.stringify(data));
    return Response.json({ success: true, status: 'simulated', plan, expiresAt: result.expiresAt });
  } catch (error: any) {
    console.error('[Admin simulate]', error?.message || error);
    return Response.json({ success: false, message: error?.message || 'Falha na simulação.' }, { status: 500 });
  }
}
