import { firestoreDatabaseId } from '../_lib/firebaseAdmin.js';
import {
  determinePlan,
  eventAction,
  extractWebhookData,
  processSubscriptionEvent,
  resolveTargetIdentity,
  verifyKiwifySignature,
} from '../_lib/subscriptions.js';

export async function GET(request: Request) {
  return Response.json({
    status: process.env.KIWIFY_WEBHOOK_SECRET ? 'ready' : 'configuration_required',
    service: 'Jornada da Meta — Webhook Kiwify',
    webhookUrl: new URL(request.url).origin + '/api/webhooks/kiwify',
    firebaseAdmin: true,
    firestoreDatabaseId,
    signatureValidation: 'HMAC-SHA1',
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  let body: any;
  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return Response.json({ success: false, message: 'JSON inválido.' }, { status: 400 });
  }

  const signatureCheck = verifyKiwifySignature(rawBody, body, request.url, request.headers);
  if (!signatureCheck.ok) {
    const configured = Boolean((process.env.KIWIFY_WEBHOOK_SECRET || '').trim());
    return Response.json(
      { success: false, message: signatureCheck.reason },
      { status: configured ? 401 : 503 }
    );
  }

  const data = extractWebhookData(body);
  const action = eventAction(data.event);
  if (action === 'ignore') {
    return Response.json({ success: true, status: 'acknowledged', event: data.event || 'unknown' });
  }

  try {
    const target = await resolveTargetIdentity(data.customerEmail, data.customUid);
    const plan = determinePlan(data);
    const result = await processSubscriptionEvent(action, target, plan, data, rawBody);
    return Response.json({
      success: true,
      status: result.duplicate ? 'duplicate_ignored' : action,
      plan: action === 'grant' ? plan : undefined,
      expiresAt: result.expiresAt,
      target: target.kind === 'user' ? 'firebase_user' : 'pending_until_login',
    });
  } catch (error: any) {
    console.error('[Kiwify] processamento falhou:', error?.message || error);
    return Response.json(
      { success: false, message: 'Webhook autenticado, mas não foi possível atualizar a assinatura.' },
      { status: 500 }
    );
  }
}
