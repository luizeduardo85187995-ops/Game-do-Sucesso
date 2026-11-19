/**
 * Model catalog + ordered fallback across official, OpenAI-compatible LLM APIs with free tiers
 * (same idea as OpenCode's provider/model catalog). Each chain entry is a provider + model pair:
 * free-tier quotas are per model, so several models on one key multiply capacity.
 * Only providers with a configured key are used. Keys never leave the server and are never logged.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type ProviderId = 'groq' | 'gemini' | 'cerebras' | 'openrouter' | 'mistral';

/** How a model accepts a reasoning hint. Reasoning tokens count toward output limits. */
export type ReasoningMode = 'none-or-low' | 'low-only' | 'unsupported';

export interface ProviderConfig {
  id: ProviderId;
  label: string;
  url: string;
  apiKey: string;
  model: string;
  /** Output budget sent as max_tokens. Groq free tier rejects requests reserving more than 1000/min. */
  maxOutputTokens: number;
  reasoning: ReasoningMode;
  extraHeaders?: Record<string, string>;
}

interface ModelSpec { id: string; reasoning: ReasoningMode }

interface ProviderSpec {
  label: string;
  url: string;
  keyEnv: string[];
  /** Comma-separated override of the model list, e.g. GEMINI_MODELS=gemini-x,gemini-y */
  modelsEnv: string;
  /** Legacy single-model override; becomes the first model when set. */
  modelEnv: string;
  models: ModelSpec[];
  defaultReasoning: ReasoningMode;
  maxOutEnv: string;
  defaultMaxOut: number;
  extraHeaders?: Record<string, string>;
}

// Free chat models verified on the providers' docs (Nov 2026). Overridable per env var because
// providers rename or retire free models often; a retired model just fails over (404) to the next.
const SPECS: Record<ProviderId, ProviderSpec> = {
  groq: {
    label: 'Groq', url: 'https://api.groq.com/openai/v1/chat/completions', keyEnv: ['GROQ_API_KEY'],
    modelsEnv: 'GROQ_MODELS', modelEnv: 'GROQ_MODEL', defaultReasoning: 'low-only',
    models: [
      { id: 'qwen/qwen3.8-27b', reasoning: 'none-or-low' },
      { id: 'openai/gpt-oss-120b', reasoning: 'low-only' },
      { id: 'openai/gpt-oss-20b', reasoning: 'low-only' },
    ],
    maxOutEnv: 'GROQ_MAX_OUTPUT_TOKENS', defaultMaxOut: 1000,
  },
  gemini: {
    label: 'Google Gemini', url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', keyEnv: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'],
    modelsEnv: 'GEMINI_MODELS', modelEnv: 'GEMINI_MODEL', defaultReasoning: 'none-or-low',
    models: [
      { id: 'gemini-3.5-flash-lite', reasoning: 'none-or-low' },
      { id: 'gemini-3.6-flash', reasoning: 'none-or-low' },
      { id: 'gemini-3.1-flash-lite', reasoning: 'none-or-low' },
      { id: 'gemini-3.8-flash', reasoning: 'none-or-low' },
      { id: 'gemini-4-hydrogen', reasoning: 'none-or-low' },
    ],
    maxOutEnv: 'GEMINI_MAX_OUTPUT_TOKENS', defaultMaxOut: 2048,
  },
  cerebras: {
    label: 'Cerebras', url: 'https://api.cerebras.ai/v1/chat/completions', keyEnv: ['CEREBRAS_API_KEY'],
    modelsEnv: 'CEREBRAS_MODELS', modelEnv: 'CEREBRAS_MODEL', defaultReasoning: 'unsupported',
    models: [{ id: 'llama-3.3-70b', reasoning: 'unsupported' }],
    maxOutEnv: 'CEREBRAS_MAX_OUTPUT_TOKENS', defaultMaxOut: 2048,
  },
  openrouter: {
    label: 'OpenRouter', url: 'https://openrouter.ai/api/v1/chat/completions', keyEnv: ['OPENROUTER_API_KEY'],
    modelsEnv: 'OPENROUTER_MODELS', modelEnv: 'OPENROUTER_MODEL', defaultReasoning: 'unsupported',
    models: [{ id: 'meta-llama/llama-3.3-70b-instruct:free', reasoning: 'unsupported' }],
    maxOutEnv: 'OPENROUTER_MAX_OUTPUT_TOKENS', defaultMaxOut: 2048,
    extraHeaders: { 'X-Title': 'Jornada do Sucesso - Dante' },
  },
  mistral: {
    label: 'Mistral', url: 'https://api.mistral.ai/v1/chat/completions', keyEnv: ['MISTRAL_API_KEY'],
    modelsEnv: 'MISTRAL_MODELS', modelEnv: 'MISTRAL_MODEL', defaultReasoning: 'unsupported',
    models: [{ id: 'mistral-small-latest', reasoning: 'unsupported' }],
    maxOutEnv: 'MISTRAL_MAX_OUTPUT_TOKENS', defaultMaxOut: 2048,
  },
};

export const DEFAULT_ORDER: ProviderId[] = ['groq', 'gemini', 'cerebras', 'openrouter', 'mistral'];

function clampInt(raw: string | undefined, fallback: number, min: number, max: number): number {
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) && n > 0 ? Math.min(max, Math.max(min, n)) : fallback;
}

function modelsFor(spec: ProviderSpec, env: NodeJS.ProcessEnv): ModelSpec[] {
  const list = (env[spec.modelsEnv] || '').split(',').map(s => s.trim()).filter(Boolean);
  const known = new Map(spec.models.map(m => [m.id, m]));
  const toSpec = (id: string): ModelSpec => known.get(id) ?? { id, reasoning: spec.defaultReasoning };
  let models = list.length ? list.map(toSpec) : [...spec.models];
  const single = env[spec.modelEnv]?.trim();
  if (single) models = [toSpec(single), ...models.filter(m => m.id !== single)];
  return models.slice(0, 8);
}

/**
 * Chain of provider+model entries for every provider with a key. Providers are interleaved
 * (groq#1, gemini#1, groq#2, gemini#2, ...) so a provider-wide overload doesn't burn the time budget.
 * LLM_PROVIDER_ORDER (comma separated) changes which provider comes first.
 */
export function configuredProviders(env: NodeJS.ProcessEnv = process.env): ProviderConfig[] {
  const requested = (env.LLM_PROVIDER_ORDER || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean) as ProviderId[];
  const order = [...new Set([...requested.filter(id => id in SPECS), ...DEFAULT_ORDER])];
  const perProvider: ProviderConfig[][] = [];
  for (const id of order) {
    const spec = SPECS[id];
    const apiKey = spec.keyEnv.map(k => env[k]?.trim()).find(Boolean);
    if (!apiKey) continue;
    const maxOutputTokens = clampInt(env[spec.maxOutEnv], spec.defaultMaxOut, 256, 16384);
    perProvider.push(modelsFor(spec, env).map(m => ({
      id, label: spec.label, url: spec.url, apiKey, model: m.id, maxOutputTokens, reasoning: m.reasoning, extraHeaders: spec.extraHeaders,
    })));
  }
  const chain: ProviderConfig[] = [];
  for (let round = 0; perProvider.some(list => round < list.length); round += 1) {
    for (const list of perProvider) if (round < list.length) chain.push(list[round]);
  }
  return chain;
}

// Per-instance memory of models that told us to back off. Warm serverless instances reuse it.
const cooldownUntil = new Map<string, number>();
const entryKey = (p: Pick<ProviderConfig, 'id' | 'model'>) => `${p.id}:${p.model}`;
export function resetCooldowns(): void { cooldownUntil.clear(); }

export interface Attempt {
  provider: ProviderId;
  model: string;
  outcome: 'ok' | 'rate_limited' | 'too_large' | 'auth' | 'bad_request' | 'server_error' | 'timeout' | 'network' | 'empty' | 'skipped_cooldown' | 'skipped_auth';
  status?: number;
  durationMs: number;
}

export interface RouterResult {
  text: string;
  provider: ProviderId;
  providerLabel: string;
  model: string;
  usage: { promptTokens: number | null; completionTokens: number | null; totalTokens: number | null };
  attempts: Attempt[];
}

export class AllProvidersFailedError extends Error {
  constructor(public readonly attempts: Attempt[], public readonly retryAfterSeconds: number | null) {
    super('Nenhum provedor de IA respondeu.');
    this.name = 'AllProvidersFailedError';
  }
}

export interface ChatRequest {
  messages: ChatMessage[];
  temperature: number;
  /** Deep answers: ask reasoning models to skip hidden reasoning so the visible answer fits the budget. */
  deep: boolean;
}

function buildBody(p: ProviderConfig, req: ChatRequest, reasoningOff: boolean): Record<string, unknown> {
  const body: Record<string, unknown> = { model: p.model, messages: req.messages, temperature: req.temperature, max_tokens: p.maxOutputTokens };
  if (p.reasoning === 'none-or-low') body.reasoning_effort = reasoningOff ? 'none' : 'low';
  if (p.reasoning === 'low-only') body.reasoning_effort = 'low';
  return body;
}

function retryAfterSeconds(res: Response): number | null {
  const raw = res.headers.get('retry-after');
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n >= 0 ? Math.min(3600, Math.ceil(n)) : null;
}

/**
 * Tries each chain entry in order until one returns non-empty text.
 * @param deadlineMs absolute epoch ms; no new attempt starts after it (stays inside the function timeout).
 */
export async function chatWithFallback(
  providers: ProviderConfig[],
  req: ChatRequest,
  options: { deadlineMs: number; perAttemptTimeoutMs?: number; retryDelayMs?: number; fetcher?: typeof fetch; now?: () => number },
): Promise<RouterResult> {
  const fetcher = options.fetcher ?? fetch;
  const now = options.now ?? Date.now;
  const attempts: Attempt[] = [];
  const badKey = new Set<ProviderId>();
  let shortestRetry: number | null = null;
  // One short pause-and-retry per request for transient 5xx; more would eat the time budget.
  let transientRetried = false;

  for (const [index, p] of providers.entries()) {
    const started = now();
    if (badKey.has(p.id)) {
      attempts.push({ provider: p.id, model: p.model, outcome: 'skipped_auth', durationMs: 0 });
      continue;
    }
    const until = cooldownUntil.get(entryKey(p)) ?? 0;
    if (until > started) {
      attempts.push({ provider: p.id, model: p.model, outcome: 'skipped_cooldown', durationMs: 0 });
      const left = Math.ceil((until - started) / 1000);
      shortestRetry = shortestRetry === null ? left : Math.min(shortestRetry, left);
      continue;
    }
    if (options.deadlineMs - started < 3000) break;
    // The last entry has nobody to fall back to: give it all the remaining time.
    const isLast = index === providers.length - 1;

    const plan: boolean[] = p.reasoning === 'none-or-low' && req.deep ? [true, false] : [false];
    for (let step = 0; step < plan.length; step += 1) {
      const reasoningOff = plan[step];
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), isLast ? options.deadlineMs - now() : Math.min(options.perAttemptTimeoutMs ?? 25_000, options.deadlineMs - now()));
      const t0 = now();
      let res: Response;
      try {
        res = await fetcher(p.url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${p.apiKey}`, 'Content-Type': 'application/json', ...(p.extraHeaders ?? {}) },
          body: JSON.stringify(buildBody(p, req, reasoningOff)),
          signal: controller.signal,
        });
      } catch (error: unknown) {
        clearTimeout(timer);
        const timedOut = error instanceof Error && error.name === 'AbortError';
        attempts.push({ provider: p.id, model: p.model, outcome: timedOut ? 'timeout' : 'network', durationMs: now() - t0 });
        break;
      }
      clearTimeout(timer);

      let payload: any = {};
      try { payload = await res.json(); } catch { payload = {}; }

      if (res.ok) {
        const text = typeof payload?.choices?.[0]?.message?.content === 'string' ? payload.choices[0].message.content.trim() : '';
        if (text) {
          attempts.push({ provider: p.id, model: p.model, outcome: 'ok', status: res.status, durationMs: now() - t0 });
          const u = payload?.usage ?? {};
          return {
            text, provider: p.id, providerLabel: p.label, model: p.model, attempts,
            usage: { promptTokens: u.prompt_tokens ?? null, completionTokens: u.completion_tokens ?? null, totalTokens: u.total_tokens ?? null },
          };
        }
        attempts.push({ provider: p.id, model: p.model, outcome: 'empty', status: res.status, durationMs: now() - t0 });
        break;
      }

      if (res.status === 400 && reasoningOff) continue; // model rejected reasoning_effort=none: retry with low
      const outcome: Attempt['outcome'] =
        res.status === 429 ? 'rate_limited'
        : res.status === 413 ? 'too_large'
        : res.status === 401 || res.status === 403 ? 'auth'
        : res.status >= 500 ? 'server_error'
        : 'bad_request';
      attempts.push({ provider: p.id, model: p.model, outcome, status: res.status, durationMs: now() - t0 });
      if (outcome === 'auth') badKey.add(p.id); // an invalid key fails for every model of that provider
      if (outcome === 'server_error' && !transientRetried && options.deadlineMs - now() > 6000) {
        transientRetried = true;
        await new Promise(resolve => setTimeout(resolve, options.retryDelayMs ?? 1500));
        plan.splice(step + 1, 0, reasoningOff);
        continue;
      }
      if (outcome === 'rate_limited') {
        const wait = retryAfterSeconds(res) ?? 60;
        cooldownUntil.set(entryKey(p), now() + wait * 1000);
        shortestRetry = shortestRetry === null ? wait : Math.min(shortestRetry, wait);
      }
      break;
    }
  }
  throw new AllProvidersFailedError(attempts, shortestRetry);
}

/** Public, key-free description for the status endpoint. */
export function describeProviders(providers: ProviderConfig[]): Array<{ id: ProviderId; label: string; model: string }> {
  return providers.map(p => ({ id: p.id, label: p.label, model: p.model }));
}
