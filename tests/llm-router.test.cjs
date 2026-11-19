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

const ok = (text) => Response.json({ choices: [{ message: { content: text }, finish_reason: 'stop' }], usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 } });
const err = (status, headers = {}) => new Response(JSON.stringify({ error: { message: 'segredo interno do provedor' } }), { status, headers });
const req = { messages: [{ role: 'user', content: 'oi' }], temperature: 0.5, deep: false };
const env = { GROQ_API_KEY: 'gsk-test-secret', GEMINI_API_KEY: 'gem-test-secret' };
const label = (p) => `${p.id}:${p.model}`;
const modelOf = (init) => JSON.parse(init.body).model;

test('catálogo: vários modelos por chave, provedores intercalados, sem expor chave', async () => {
  const r = await compile('api/_lib/llmRouter.ts');
  assert.deepEqual(r.configuredProviders({}), []);
  assert.deepEqual(r.configuredProviders(env).map(label), [
    'groq:qwen/qwen3.8-27b', 'gemini:gemini-3.5-flash-lite',
    'groq:openai/gpt-oss-120b', 'gemini:gemini-3.6-flash',
    'groq:openai/gpt-oss-20b', 'gemini:gemini-3.1-flash-lite',
    'gemini:gemini-3.8-flash', 'gemini:gemini-4-hydrogen',
  ], '8 IAs com 2 chaves');
  assert.equal(r.configuredProviders({ ...env, LLM_PROVIDER_ORDER: 'gemini' })[0].id, 'gemini');
  assert.deepEqual(r.configuredProviders({ GEMINI_API_KEY: 'x', GEMINI_MODELS: 'gemini-a, gemini-b' }).map(p => p.model), ['gemini-a', 'gemini-b']);
  assert.deepEqual(r.configuredProviders({ GEMINI_API_KEY: 'x', GEMINI_MODEL: 'gemini-3.8-flash' }).map(p => p.model).slice(0, 2), ['gemini-3.8-flash', 'gemini-3.5-flash-lite'], 'modelo único antigo vira o primeiro, sem duplicar');
  assert.deepEqual(r.configuredProviders({ GOOGLE_API_KEY: 'x' })[0].id, 'gemini');
  assert.equal(r.configuredProviders({ GROQ_API_KEY: 'x' })[0].maxOutputTokens, 1000, 'Groq gratuito: no máximo 1000 tokens de saída');
  assert.equal(r.configuredProviders({ GROQ_API_KEY: 'x', GROQ_MAX_OUTPUT_TOKENS: '999999' })[0].maxOutputTokens, 16384);
  assert(!JSON.stringify(r.describeProviders(r.configuredProviders(env))).includes('secret'), 'status nunca expõe chave');
});

test('limite de um modelo: pula para o próximo e o que estourou fica em espera', async () => {
  const r = await compile('api/_lib/llmRouter.ts');
  r.resetCooldowns();
  const chain = r.configuredProviders(env);
  const calls = [];
  const fetcher = async (url, init) => {
    calls.push({ model: modelOf(init), auth: init.headers.Authorization });
    return modelOf(init) === 'qwen/qwen3.8-27b' ? err(429, { 'retry-after': '30' }) : ok(`resposta de ${modelOf(init)}`);
  };
  const first = await r.chatWithFallback(chain, req, { deadlineMs: Date.now() + 40_000, fetcher });
  assert.equal(first.model, 'gemini-3.5-flash-lite');
  assert.equal(calls[1].auth, 'Bearer gem-test-secret', 'cada provedor recebe só a própria chave');
  calls.length = 0;
  const second = await r.chatWithFallback(chain, req, { deadlineMs: Date.now() + 40_000, fetcher });
  assert.equal(second.attempts[0].outcome, 'skipped_cooldown');
  assert.equal(calls.length, 1, 'modelo em espera não gasta chamada');
});

test('Groq e Gemini congestionados: os outros modelos da mesma chave respondem', async () => {
  const r = await compile('api/_lib/llmRouter.ts');
  r.resetCooldowns();
  const fetcher = async (url, init) => {
    const m = modelOf(init);
    if (m === 'qwen/qwen3.8-27b') return err(429);
    if (m === 'gemini-3.5-flash-lite') return err(503);
    if (m === 'openai/gpt-oss-120b') return err(429);
    if (m === 'gemini-3.6-flash') return err(503);
    return ok(`resposta de ${m}`);
  };
  const res = await r.chatWithFallback(r.configuredProviders(env), req, { deadlineMs: Date.now() + 40_000, retryDelayMs: 1, fetcher });
  assert.equal(res.model, 'openai/gpt-oss-20b');
  assert.deepEqual(res.attempts.map(a => a.outcome), ['rate_limited', 'server_error', 'server_error', 'rate_limited', 'server_error', 'ok'], 'só um retry de 503 por pergunta');
});

test('raciocínio: qwen/gemini sem raciocínio na análise profunda; gpt-oss sempre low', async () => {
  const r = await compile('api/_lib/llmRouter.ts');
  r.resetCooldowns();
  const sent = [];
  const fetcher = async (url, init) => {
    const body = JSON.parse(init.body);
    sent.push(`${body.model}:${body.reasoning_effort}`);
    if (body.model === 'qwen/qwen3.8-27b') return body.reasoning_effort === 'none' ? err(400) : err(429);
    if (body.model.startsWith('gemini')) return err(429);
    return ok('gpt-oss respondeu');
  };
  const res = await r.chatWithFallback(r.configuredProviders(env), { ...req, deep: true }, { deadlineMs: Date.now() + 40_000, fetcher });
  assert.equal(res.model, 'openai/gpt-oss-120b');
  assert.deepEqual(sent, ['qwen/qwen3.8-27b:none', 'qwen/qwen3.8-27b:low', 'gemini-3.5-flash-lite:none', 'openai/gpt-oss-120b:low']);
});

test('chave inválida descarta todos os modelos daquele provedor de uma vez', async () => {
  const r = await compile('api/_lib/llmRouter.ts');
  r.resetCooldowns();
  let geminiCalls = 0;
  const fetcher = async (url, init) => {
    if (url.includes('googleapis')) { geminiCalls++; return err(401); }
    return modelOf(init) === 'openai/gpt-oss-20b' ? ok('Groq 20b') : err(429);
  };
  const res = await r.chatWithFallback(r.configuredProviders(env), req, { deadlineMs: Date.now() + 40_000, fetcher });
  assert.equal(res.model, 'openai/gpt-oss-20b');
  assert.equal(geminiCalls, 1);
  assert.deepEqual(res.attempts.map(a => a.outcome), ['rate_limited', 'auth', 'rate_limited', 'skipped_auth', 'ok']);
});

test('todas no limite: erro com espera e sem vazar chave nem mensagem do provedor', async () => {
  const r = await compile('api/_lib/llmRouter.ts');
  r.resetCooldowns();
  const fetcher = async (url, init) => err(429, modelOf(init) === 'gemini-4-hydrogen' ? { 'retry-after': '12' } : {});
  await assert.rejects(r.chatWithFallback(r.configuredProviders(env), req, { deadlineMs: Date.now() + 40_000, fetcher }), e => {
    assert(e instanceof r.AllProvidersFailedError);
    assert.equal(e.retryAfterSeconds, 12);
    assert.equal(e.attempts.length, 8);
    const dump = JSON.stringify({ message: e.message, attempts: e.attempts });
    assert(!dump.includes('secret') && !dump.includes('segredo'));
    return true;
  });
});

test('tempo: não começa tentativa perto do limite; travou, pula; a última usa o tempo que sobra', async () => {
  const r = await compile('api/_lib/llmRouter.ts');
  r.resetCooldowns();
  let calls = 0;
  await assert.rejects(r.chatWithFallback(r.configuredProviders(env), req, { deadlineMs: Date.now() + 1000, fetcher: async () => { calls++; return ok('x'); } }));
  assert.equal(calls, 0);
  const hang = (url, init) => modelOf(init) === 'qwen/qwen3.8-27b'
    ? new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))))
    : Promise.resolve(ok('Gemini salvou'));
  const res = await r.chatWithFallback(r.configuredProviders(env), req, { deadlineMs: Date.now() + 40_000, perAttemptTimeoutMs: 50, fetcher: hang });
  assert.equal(res.text, 'Gemini salvou');
  assert.equal(res.attempts[0].outcome, 'timeout');
  r.resetCooldowns();
  const only = r.configuredProviders({ GEMINI_API_KEY: 'x', GEMINI_MODELS: 'gemini-a,gemini-b' });
  const slowLast = (url, init) => modelOf(init) === 'gemini-b' ? new Promise(resolve => setTimeout(() => resolve(ok('lento mas chegou')), 120)) : Promise.resolve(err(429));
  const last = await r.chatWithFallback(only, req, { deadlineMs: Date.now() + 40_000, perAttemptTimeoutMs: 50, fetcher: slowLast });
  assert.equal(last.text, 'lento mas chegou');
});

test('Dante usa o catálogo: com Groq e Gemini no limite, outro modelo responde e o app vê qual', async () => {
  const api = await compile('api/dante.ts', [{ name: 'm', setup(b) {
    b.onResolve({ filter: /firebaseAdmin\.js$/ }, () => ({ path: 'a', namespace: 'f' }));
    b.onResolve({ filter: /bankStore\.js$/ }, () => ({ path: 'bs', namespace: 'f' }));
    b.onLoad({ filter: /^a$/, namespace: 'f' }, () => ({ contents: 'export const adminAuth={verifyIdToken:async()=>({uid:"owner",email:"luizeduardo85187995@gmail.com",email_verified:true})};export const adminDb={};', loader: 'js' }));
    b.onLoad({ filter: /^bs$/, namespace: 'f' }, () => ({ contents: 'export const loadOwnerBankData=async()=>null;', loader: 'js' }));
  } }]);
  const previous = { ...process.env };
  const originalFetch = global.fetch;
  try {
    for (const k of Object.keys(process.env)) if (/_API_KEY$|_MODELS?$|LLM_PROVIDER_ORDER/.test(k)) delete process.env[k];
    const call = () => api.POST(new Request('https://t/api/dante', { method: 'POST', headers: { Authorization: 'Bearer t', 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'oi', history: [], context: {} }) }));
    assert.equal((await call()).status, 503, 'sem nenhuma chave: erro claro');
    process.env.GROQ_API_KEY = 'g'; process.env.GEMINI_API_KEY = 'm';
    global.fetch = async (url, init) => ['qwen/qwen3.8-27b', 'gemini-3.5-flash-lite'].includes(modelOf(init)) ? err(429) : ok(`Olá de ${modelOf(init)}`);
    const res = await call();
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.text, 'Olá de openai/gpt-oss-120b');
    assert.equal(body.provider, 'Groq');
    const status = await (await api.GET()).json();
    assert.equal(status.providers.length, 8);
  } finally {
    global.fetch = originalFetch;
    for (const k of Object.keys(process.env)) if (!(k in previous)) delete process.env[k];
    Object.assign(process.env, previous);
  }
});
