import { firestoreDatabaseId } from './_lib/firebaseAdmin.js';

export async function GET() {
  return Response.json({
    status: 'ok',
    service: 'Jornada da Meta API',
    firebaseAdmin: true,
    firestoreDatabaseId,
    kiwifyWebhookSecurityConfigured: Boolean((process.env.KIWIFY_WEBHOOK_SECRET || '').trim()),
    timestamp: new Date().toISOString(),
  });
}
