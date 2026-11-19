import {
  determinePlan,
  eventAction,
  extractWebhookData,
  processSubscriptionEvent,
  resolveTargetIdentity,
  verifyKiwifySignature,
} from '../_lib/subscriptions.js';

// Public probe: only says whether the webhook is ready, never internal identifiers.
export async function GET() {
  return Response.json({ status: process.env.KIWIFY_WEBHOOK_SECRET ? 'ready' : 'configuration_required' });
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
    const plan = determinePlan(data);
    if (data.checkoutCode && !plan) {
      // Checkout informado, mas não pertence a um dos planos PRO conhecidos.
      return Response.json({ success: true, status: 'ignored_unknown_checkout', event: data.event || 'unknown' });
    }
    if (action === 'grant' && !plan) {
      // Nunca concede PRO se não conseguimos reconhecer com segurança o plano.
      return Response.json({ success: true, status: 'ignored_unknown_plan', event: data.event || 'unknown' });
    }

    const target = await resolveTargetIdentity(data.customerEmail, data.customUid);
    // O plano só altera estado em eventos de concessão. Para revogação/cancelamento, o valor abaixo é neutro.
    const effectivePlan = plan || 'monthly';
    const result = await processSubscriptionEvent(action, target, effectivePlan, data, rawBody);
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
