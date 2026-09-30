import { claimPendingSubscription, requireFirebaseToken } from '../_lib/subscriptions.js';

export async function POST(request: Request) {
  try {
    const decoded = await requireFirebaseToken(request);
    const result = await claimPendingSubscription(decoded);
    return Response.json({ success: true, ...result });
  } catch (error: any) {
    const message = error?.message || 'Não foi possível verificar assinatura pendente.';
    const authError = /Token Firebase|auth\//i.test(message);
    return Response.json({ success: false, message }, { status: authError ? 401 : 500 });
  }
}
