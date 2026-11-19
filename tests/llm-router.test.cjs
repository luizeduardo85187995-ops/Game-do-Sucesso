const { test } = require('node:test');
const assert = require('node:assert/strict');
const { build } = require('esbuild');
const Module = require('module');

async function compile(entry, plugins = []) {
  const built = await build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', write: false, plugins });
  const m = new Module(process.cwd() + '/llm-router-test.cjs', module);
  m.filename = process.cwd() + '/llm-router-test.cjs'; m.paths = module.paths;
  m._compile(built.outputFiles[0].text, m.filename);
  return m.exports;
}

const ok = (text, extra = {}) => Response.json({ choices: [{ message: { content: text }, finish_reason: 'stop' }], usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }, ...extra });
const err = (status, headers = {}) => new Response(JSON.stringify({ error: { message: 'segredo interno do provedor' } }), { status, headers });
const req = { messages: [{ role: 'user', content: 'oi' }], temperature: 0.5, deep: false };
const env = { GROQ_API_KEY: 'gsk-test-secret', GEMINI_API_KEY: 'gem-test-secret', OPENROUTER_API_KEY: 'or-test-secret' };

test('provedores: só os que têm chave, na ordem configurada, com modelo sobrescrevível', async () => {
  const r = await compile('api/_lib/llmRouter.ts');
  assert.deepEqual(r.configuredProviders({}).map(p => p.id), []);
  assert.deepEqual(r.configuredProviders(env).map(p => p.id), ['groq', 'gemini', 'openrouter']);
  assert.deepEqual(r.configuredProviders({ ...env, LLM_PROVIDER_ORDER: 'gemini, openrouter' }).map(p => p.id), ['gemini', 'openrouter', 'groq']);
  assert.deepEqual(r.configuredProviders({ GOOGLE_API_KEY: 'x' }).map(p => p.id), ['gemini'], 'GOOGLE_API_KEY também vale para o Gemini');
  const g = r.configuredProviders({ GEMINI_API_KEY: 'x', GEMINI_MODEL: 'gemini-novo', GEMINI_MAX_OUTPUT_TOKENS: '999999' })[0];
  assert.equal(g.model, 'gemini-novo'); assert.equal(g.maxOutputTokens, 16384);
  assert.equal(r.configuredProviders({ GROQ_API_KEY: 'x' })[0].maxOutputTokens, 1000, 'Groq gratuito: no máximo 1000 tokens de saída');
  assert(!JSON.stringify(r.describeProviders(r.configuredProviders(env))).includes('secret'), 'status nunca expõe chave');
});

test('acabou o limite de um, responde o próximo; e o que estourou entra em espera', async () => {
  const r = await compile('api/_lib/llmRouter.ts');
  r.resetCooldowns();
  const providers = r.configuredProviders(env);
  const calls = [];
  const fetcher = async (url, init) => {
    calls.push({ url, auth: init.headers.Authorization, body: JSON.parse(init.body) });
    if (url.includes('groq')) return err(429, { 'retry-after': '30' });
    return ok('resposta do Gemini');
  };
  const result = await r.chatWithFallback(providers, req, { deadlineMs: Date.now() + 40_000, fetcher });
  assert.equal(result.text, 'resposta do Gemini');
  assert.equal(result.provider, 'gemini');
  assert.deepEqual(result.attempts.map(a => `${a.provider}:${a.outcome}`), ['groq:rate_limited', 'gemini:ok']);
  assert.equal(calls[1].auth, 'Bearer gem-test-secret', 'cada provedor recebe só a própria chave');
  assert.equal(calls[1].body.model, 'gemini-3.8-flash', 'modelo Gemini atual com plano gratuito');
  // Second question: Groq is cooling down, so it is skipped without a network call.
  calls.length = 0;
  const again = await r.chatWithFallback(providers, req, { deadlineMs: Date.now() + 40_000, fetcher });
  assert.equal(again.provider, 'gemini');
  assert.equal(calls.length, 1);
  assert.equal(again.attempts[0].outcome, 'skipped_cooldown');
});

test('falhas variadas: fora do ar, chave inválida, resposta vazia, modelo sem suporte a reasoning=none', async () => {
  const r = await compile('api/_lib/llmRouter.ts');
  r.resetCooldowns();
  const providers = r.configuredProviders({ ...env, CEREBRAS_API_KEY: 'c' });
  const seen = [];
  const fetcher = async (url, init) => {
    const body = JSON.parse(init.body);
    seen.push(`${new URL(url).hostname}:${body.reasoning_effort ?? '-'}`);
    if (url.includes('groq')) return body.reasoning_effort === 'none' ? err(400) : err(503);
    if (url.includes('googleapis')) return err(401);
    if (url.includes('cerebras')) return ok('   ');
    return ok('resposta do OpenRouter');
  };
  const result = await r.chatWithFallback(providers, { ...req, deep: true }, { deadlineMs: Date.now() + 40_000, fetcher });
  assert.equal(result.provider, 'openrouter');
  assert.deepEqual(seen, ['api.groq.com:none', 'api.groq.com:low', 'generativelanguage.googleapis.com:none', 'api.cerebras.ai:-', 'openrouter.ai:-']);
  assert.deepEqual(result.attempts.map(a => a.outcome), ['server_error', 'auth', 'empty', 'ok']);
});

test('todas no limite: erro com tempo de espera e sem vazar chave nem mensagem do provedor', async () => {
  const r = await compile('api/_lib/llmRouter.ts');
  r.resetCooldowns();
  const providers = r.configuredProviders(env);
  const fetcher = async (url) => err(url.includes('openrouter') ? 413 : 429, url.includes('gemini') || url.includes('googleapis') ? { 'retry-after': '12' } : {});
  await assert.rejects(r.chatWithFallback(providers, req, { deadlineMs: Date.now() + 40_000, fetcher }), e => {
    assert(e instanceof r.AllProvidersFailedError);
    assert.equal(e.retryAfterSeconds, 12);
    const dump = JSON.stringify({ message: e.message, attempts: e.attempts });
    assert(!dump.includes('secret') && !dump.includes('segredo'));
    return true;
  });
});

test('não começa tentativa nova perto do limite de tempo da função', async () => {
  const r = await compile('api/_lib/llmRouter.ts');
  r.resetCooldowns();
  let calls = 0;
  await assert.rejects(r.chatWithFallback(r.configuredProviders(env), req, { deadlineMs: Date.now() + 1000, fetcher: async () => { calls++; return ok('x'); } }));
  assert.equal(calls, 0);
  // A hanging provider is aborted by the per-attempt timeout and the next one answers.
  const hang = (url, init) => url.includes('groq')
    ? new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))))
    : Promise.resolve(ok('Gemini salvou'));
  const res = await r.chatWithFallback(r.configuredProviders(env), req, { deadlineMs: Date.now() + 40_000, perAttemptTimeoutMs: 50, fetcher: hang });
  assert.equal(res.text, 'Gemini salvou');
  assert.equal(res.attempts[0].outcome, 'timeout');
  // The last provider is not cut by the per-attempt timeout: it may use the remaining deadline.
  const slowLast = (url) => url.includes('openrouter')
    ? new Promise(resolve => setTimeout(() => resolve(ok('lento mas chegou')), 120))
    : Promise.resolve(err(429));
  r.resetCooldowns();
  const last = await r.chatWithFallback(r.configuredProviders(env), req, { deadlineMs: Date.now() + 40_000, perAttemptTimeoutMs: 50, fetcher: slowLast });
  assert.equal(last.text, 'lento mas chegou');
});

test('Dante usa a cadeia: Groq no limite, Gemini responde e o app recebe o nome do provedor', async () => {
  const api = await compile('api/dante.ts', [{ name: 'm', setup(b) {
    b.onResolve({ filter: /firebaseAdmin\.js$/ }, () => ({ path: 'a', namespace: 'f' }));
    b.onResolve({ filter: /bankStore\.js$/ }, () => ({ path: 'bs', namespace: 'f' }));
    b.onLoad({ filter: /^a$/, namespace: 'f' }, () => ({ contents: 'export const adminAuth={verifyIdToken:async()=>({uid:"owner",email:"luizeduardo85187995@gmail.com"})};export const adminDb={};', loader: 'js' }));
    b.onLoad({ filter: /^bs$/, namespace: 'f' }, () => ({ contents: 'export const loadOwnerBankData=async()=>null;', loader: 'js' }));
  } }]);
  const previous = { ...process.env };
  const originalFetch = global.fetch;
  try {
    for (const k of ['GROQ_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY', 'CEREBRAS_API_KEY', 'OPENROUTER_API_KEY', 'MISTRAL_API_KEY', 'LLM_PROVIDER_ORDER']) delete process.env[k];
    const call = () => api.POST(new Request('https://t/api/dante', { method: 'POST', headers: { Authorization: 'Bearer t', 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'oi', history: [], context: {} }) }));
    assert.equal((await call()).status, 503, 'sem nenhuma chave: erro claro');
    process.env.GROQ_API_KEY = 'g'; process.env.GEMINI_API_KEY = 'm';
    global.fetch = async (url) => url.includes('groq') ? err(429) : ok('Olá do Gemini');
    const res = await call();
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.text, 'Olá do Gemini');
    assert.equal(body.provider, 'Google Gemini');
    const status = await (await api.GET()).json();
    assert.deepEqual(status.providers.map(p => p.id), ['groq', 'gemini']);
  } finally {
    global.fetch = originalFetch;
    for (const k of Object.keys(process.env)) if (!(k in previous)) delete process.env[k];
    Object.assign(process.env, previous);
  }
});
