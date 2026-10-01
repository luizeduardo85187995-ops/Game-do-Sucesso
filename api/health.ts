import { firestoreDatabaseId } from './_lib/firebaseAdmin.js';

export async function GET() {
  return Response.json({
    status: 'ok',
    service: 'Jornada da Meta API',
    firebaseAdmin: true,
    firestoreDatabaseId,
    kiwifyWebhookSecurityConfigured: Boolean((process.env.KIWIFY_WEBHOOK_SECRET || '').trim()),
    groqConfigured: Boolean((process.env.GROQ_API_KEY || '').trim()),
    danteModel: (process.env.GROQ_MODEL || 'qwen/qwen3.8-27b').trim(),
    timestamp: new Date().toISOString(),
  });
}
