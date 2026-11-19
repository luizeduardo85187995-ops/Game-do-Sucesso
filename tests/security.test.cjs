const { test } = require('node:test');
const assert = require('node:assert/strict');
const { build } = require('esbuild');
const Module = require('module');

async function compile(entry, plugins = []) {
  const built = await build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', write: false, plugins });
  const m = new Module(process.cwd() + '/security-test.cjs', module);
  m.filename = process.cwd() + '/security-test.cjs'; m.paths = module.paths;
  m._compile(built.outputFiles[0].text, m.filename);
  return m.exports;
}

function fakeDb() {
  const store = new Map();
  const ref = (path) => ({ path, collection: n => ({ doc: id => ref(`${path}/${n}/${id}`) }) });
  return {
    store,
    collection: n => ({ doc: id => ref(`${n}/${id}`) }),
    runTransaction: async fn => fn({ get: async r => ({ data: () => store.get(r.path) }), set: (r, v) => store.set(r.path, { ...(store.get(r.path) || {}), ...v }) }),
  };
}

test('limite por usuário: por hora, por dia, janela nova libera, usuários isolados', async () => {
  const rl = await compile('api/_lib/rateLimit.ts');
  const db = fakeDb();
  const t0 = Date.UTC(2026, 10, 19, 10, 5);
  const limits = { perHour: 2, perDay: 3 };
  assert.equal((await rl.consumeRateLimit(db, 'dante_a', limits, t0)).allowed, true);
  assert.equal((await rl.consumeRateLimit(db, 'dante_a', limits, t0 + 1000)).remainingHour, 0);
  const blocked = await rl.consumeRateLimit(db, 'dante_a', limits, t0 + 2000);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 55 * 60 - 2, 'espera até virar a hora');
  assert.equal((await rl.consumeRateLimit(db, 'dante_b', limits, t0)).allowed, true, 'outro usuário não é afetado');
  assert.equal((await rl.consumeRateLimit(db, 'dante_a', limits, t0 + 3_600_000)).allowed, true, 'hora nova libera');
  const daily = await rl.consumeRateLimit(db, 'dante_a', limits, t0 + 7_200_000);
  assert.equal(daily.allowed, false, 'limite diário vale mesmo em hora nova');
  assert(daily.retryAfterSeconds > 3600);
  assert.deepEqual(rl.danteLimits(false, {}), { perHour: 20, perDay: 100 });
  assert.deepEqual(rl.danteLimits(true, {}), { perHour: 60, perDay: 300 });
  assert.deepEqual(rl.danteLimits(false, { DANTE_LIMIT_HOUR: '5', DANTE_LIMIT_DAY: 'x' }), { perHour: 5, perDay: 100 });
});

async function danteWith(decoded, { subscription = null, rateDb = null } = {}) {
  global.__sec = { decoded, subscription, rateDb };
  return compile('api/dante.ts', [{ name: 'm', setup(b) {
    b.onResolve({ filter: /firebaseAdmin\.js$/ }, () => ({ path: 'a', namespace: 'f' }));
    b.onResolve({ filter: /bankStore\.js$/ }, () => ({ path: 'bs', namespace: 'f' }));
    b.onLoad({ filter: /^a$/, namespace: 'f' }, () => ({ contents: `
      export const adminAuth={verifyIdToken:async(t,revoked)=>{if(!revoked)throw new Error('checkRevoked obrigatório');return globalThis.__sec.decoded;}};
      const db=globalThis.__sec.rateDb;
      export const adminDb={
        collection:n=>n==='subscriptions'?{doc:()=>({get:async()=>({data:()=>globalThis.__sec.subscription})})}:db.collection(n),
        runTransaction:(...a)=>db.runTransaction(...a)};`, loader: 'js' }));
    b.onLoad({ filter: /^bs$/, namespace: 'f' }, () => ({ contents: 'export const loadOwnerBankData=async()=>null;', loader: 'js' }));
  } }]);
}

test('Dante: e-mail de admin sem verificação não vira admin; limite bloqueia antes de chamar a IA', async () => {
  const previous = { ...process.env };
  const originalFetch = global.fetch;
  let aiCalls = 0;
  global.fetch = async () => { aiCalls++; return Response.json({ choices: [{ message: { content: 'ok' } }] }); };
  try {
    for (const k of Object.keys(process.env)) if (/_API_KEY$|_MODELS?$|LLM_PROVIDER_ORDER|DANTE_/.test(k)) delete process.env[k];
    process.env.GROQ_API_KEY = 'g';
    const call = api => api.POST(new Request('https://t/api/dante', { method: 'POST', headers: { Authorization: 'Bearer t', 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'oi', history: [], context: {} }) }));

    const impostor = await danteWith({ uid: 'x', email: 'luiz.honorato@lcmconstrucao.com.br', email_verified: false }, { rateDb: fakeDb() });
    const r1 = await call(impostor);
    assert.equal(r1.status, 403, 'e-mail não verificado não ganha acesso de admin');
    assert.equal(aiCalls, 0);

    const adminOk = await danteWith({ uid: 'admin', email: 'luiz.honorato@lcmconstrucao.com.br', email_verified: true }, { rateDb: fakeDb() });
    assert.equal((await call(adminOk)).status, 200);

    process.env.DANTE_LIMIT_HOUR = '1';
    const db = fakeDb();
    const pro = await danteWith({ uid: 'pro', email: 'cliente@example.com', email_verified: true }, { subscription: { plan: 'monthly', expiresAt: '2099-01-01T00:00:00Z' }, rateDb: db });
    aiCalls = 0;
    assert.equal((await call(pro)).status, 200);
    const limited = await call(pro);
    assert.equal(limited.status, 429);
    assert.match((await limited.json()).message, /limite de perguntas/);
    assert.ok(limited.headers.get('retry-after'));
    assert.equal(aiCalls, 1, 'a pergunta bloqueada não chega à IA');
  } finally {
    global.fetch = originalFetch;
    delete global.__sec;
    for (const k of Object.keys(process.env)) if (!(k in previous)) delete process.env[k];
    Object.assign(process.env, previous);
  }
});

test('logout: apaga dados locais da conta só quando a nuvem já tem tudo; outras contas intactas', async () => {
  const store = new Map();
  global.localStorage = {
    get length() { return store.size; },
    key: i => [...store.keys()][i] ?? null,
    getItem: k => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k),
  };
  try {
    const built = await build({ entryPoints: ['src/context/FinanceContext.tsx'], bundle: true, platform: 'node', format: 'cjs', write: false, external: ['react', 'firebase/*'],
      plugins: [{ name: 'stub', setup(b) {
        b.onResolve({ filter: /lib\/firebase$|AuthContext$|b3MarketService$/ }, a => ({ path: a.path, namespace: 'stub' }));
        b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: 'export const db={},logOut=()=>{},useAuth=()=>({}),B3_CATALOG=[],fetchB3Quote=()=>{},generateDividendScheduleForPortfolio=()=>[],DEFAULT_LINKED_BROKERS=[];', loader: 'js' }));
      } }] });
    const m = new Module(process.cwd() + '/fc-test.cjs', module); m.paths = module.paths; m.filename = process.cwd() + '/fc-test.cjs';
    m._compile(built.outputFiles[0].text, m.filename);
    const seed = () => { store.clear(); for (const k of ['@financas/state_user_UID1', '@financas/state_user_UID1:recovery', '@dante/history_v2_UID1', '@dante/mode_v2_UID1', '@financas/state_user_UID2', 'has_completed_guided_tour']) store.set(k, 'x'); };
    seed();
    m.exports.clearLocalAccountData('UID1', false);
    assert.deepEqual([...store.keys()].sort(), ['@financas/state_user_UID1', '@financas/state_user_UID1:recovery', '@financas/state_user_UID2', 'has_completed_guided_tour'], 'sem sincronizar: mantém finanças, apaga só o chat do Dante');
    seed();
    m.exports.clearLocalAccountData('UID1', true);
    assert.deepEqual([...store.keys()].sort(), ['@financas/state_user_UID2', 'has_completed_guided_tour'], 'sincronizado: apaga tudo da conta que saiu');
  } finally {
    delete global.localStorage;
  }
});
