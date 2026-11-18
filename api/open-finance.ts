import { createHash } from 'node:crypto';
import { assertOwner, fetchPersonalSnapshot, monthRange, OpenFinanceError, readPersonalConfig } from './_lib/pluggyPersonal.js';

const CACHE_MS = 15 * 60 * 1000;
const COOLDOWN_MS = 60 * 1000;

function reply(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}

async function handle(request: Request, refresh: boolean): Promise<Response> {
  try {
    const token = request.headers.get('authorization')?.match(/^Bearer (\S+)$/)?.[1];
    if (!token) throw new OpenFinanceError(401, 'Entre com sua conta Google para consultar seus bancos.');
    const owner = process.env.OPEN_FINANCE_OWNER_UID;
    if (!owner?.trim()) throw new OpenFinanceError(503, 'A integração pessoal ainda precisa ser configurada no servidor.');
    const { adminAuth, adminDb } = await import('./_lib/firebaseAdmin.js');
    let uid: string;
    try { uid = (await adminAuth.verifyIdToken(token, true)).uid; }
    catch { throw new OpenFinanceError(401, 'Sua sessão expirou. Entre novamente com o Google.'); }
    assertOwner(uid, owner);
    const config = readPersonalConfig(process.env);
    if (!config) return reply({ configured: false, snapshot: null });
    const url = new URL(request.url);
    const month = url.searchParams.get('month') || new Date().toISOString().slice(0, 7);
    monthRange(month);
    // New configuration never reuses another connection's cached financial data.
    const fingerprint = createHash('sha256').update([config.clientId, ...config.itemIds].join(':')).digest('hex');
    const ref = adminDb.collection('openFinancePrivate').doc(uid).collection('months').doc(month);
    const saved = (await ref.get()).data();
    const snapshot = saved?.fingerprint === fingerprint ? saved.snapshot ?? null : null;
    if (!refresh) return reply({ configured: true, snapshot });
    if (snapshot && Date.now() - Date.parse(snapshot.fetchedAt) < CACHE_MS) {
      return reply({ configured: true, snapshot, cached: true });
    }
    // Global per-owner cooldown also covers different months and concurrent server instances.
    const lease = adminDb.collection('openFinancePrivate').doc(uid);
    await adminDb.runTransaction(async transaction => {
      const state = (await transaction.get(lease)).data();
      if (typeof state?.lastAttemptAt === 'number' && Date.now() - state.lastAttemptAt < COOLDOWN_MS) {
        throw new OpenFinanceError(429, 'Aguarde um minuto antes de fazer outra consulta.');
      }
      transaction.set(lease, { lastAttemptAt: Date.now() }, { merge: true });
    });
    const fresh = await fetchPersonalSnapshot(config, month);
    await ref.set({ fingerprint, snapshot: fresh });
    return reply({ configured: true, snapshot: fresh, cached: false });
  } catch (error: unknown) {
    if (error instanceof OpenFinanceError) return reply({ message: error.message }, error.status);
    // Do not return provider bodies, tokens, configuration values or bank payloads in errors/logs.
    return reply({ message: 'A consulta bancária não pôde ser concluída. Verifique a configuração do servidor e tente novamente.' }, 503);
  }
}

export function GET(request: Request): Promise<Response> { return handle(request, false); }
export function POST(request: Request): Promise<Response> { return handle(request, true); }
