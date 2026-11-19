/**
 * Ordered fallback across official, OpenAI-compatible LLM APIs with free tiers.
 * A provider is used only when its API key is configured; when one fails (quota, rate limit, outage,
 * invalid model, empty answer) the next one is tried. Keys never leave the server and are never logged.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type ProviderId = 'groq' | 'gemini' | 'cerebras' | 'openrouter' | 'mistral';

export interface ProviderConfig {
  id: ProviderId;
  label: string;
  url: string;
  apiKey: string;
  model: string;
  /** Output budget sent as max_tokens. Groq free tier rejects requests reserving more than 1000/min. */
  maxOutputTokens: number;
  /** How the provider accepts a reasoning hint (reasoning models spend output tokens "thinking"). */
  reasoning: 'groq' | 'gemini' | 'none';
  extraHeaders?: Record<string, string>;
}

interface ProviderSpec {
  label: string;
  url: string;
  keyEnv: string[];
  modelEnv: string;
  defaultModel: string;
  maxOutEnv: string;
  defaultMaxOut: number;
  reasoning: ProviderConfig['reasoning'];
  extraHeaders?: Record<string, string>;
}

// Default models are overridable per env var because providers rename/retire free models often.
const SPECS: Record<ProviderId, ProviderSpec> = {
  groq: {
    label: 'Groq', url: 'https://api.groq.com/openai/v1/chat/completions', keyEnv: ['GROQ_API_KEY'],
    modelEnv: 'GROQ_MODEL', defaultModel: 'qwen/qwen3.8-27b', maxOutEnv: 'GROQ_MAX_OUTPUT_TOKENS', defaultMaxOut: 1000, reasoning: 'groq',
  },
  gemini: {
    label: 'Google Gemini', url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', keyEnv: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'],
    modelEnv: 'GEMINI_MODEL', defaultModel: 'gemini-3.8-flash', /* 2.5 retired (404) in 2026; 3.8 Flash has a free tier */ maxOutEnv: 'GEMINI_MAX_OUTPUT_TOKENS', defaultMaxOut: 2048, reasoning: 'gemini',
  },
  cerebras: {
    label: 'Cerebras', url: 'https://api.cerebras.ai/v1/chat/completions', keyEnv: ['CEREBRAS_API_KEY'],
    modelEnv: 'CEREBRAS_MODEL', defaultModel: 'llama-3.3-70b', maxOutEnv: 'CEREBRAS_MAX_OUTPUT_TOKENS', defaultMaxOut: 2048, reasoning: 'none',
  },
  openrouter: {
    label: 'OpenRouter', url: 'https://openrouter.ai/api/v1/chat/completions', keyEnv: ['OPENROUTER_API_KEY'],
    modelEnv: 'OPENROUTER_MODEL', defaultModel: 'meta-llama/llama-3.3-70b-instruct:free', maxOutEnv: 'OPENROUTER_MAX_OUTPUT_TOKENS', defaultMaxOut: 2048, reasoning: 'none',
    extraHeaders: { 'X-Title': 'Jornada do Sucesso - Dante' },
  },
  mistral: {
    label: 'Mistral', url: 'https://api.mistral.ai/v1/chat/completions', keyEnv: ['MISTRAL_API_KEY'],
    modelEnv: 'MISTRAL_MODEL', defaultModel: 'mistral-small-latest', maxOutEnv: 'MISTRAL_MAX_OUTPUT_TOKENS', defaultMaxOut: 2048, reasoning: 'none',
  },
};

export const DEFAULT_ORDER: ProviderId[] = ['groq', 'gemini', 'cerebras', 'openrouter', 'mistral'];

function clampInt(raw: string | undefined, fallback: number, min: number, max: number): number {
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) && n > 0 ? Math.min(max, Math.max(min, n)) : fallback;
}

/** Providers with a configured key, in LLM_PROVIDER_ORDER (comma separated) or the default order. */
export function configuredProviders(env: NodeJS.ProcessEnv = process.env): ProviderConfig[] {
  const requested = (env.LLM_PROVIDER_ORDER || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean) as ProviderId[];
  const order = [...new Set([...requested.filter(id => id in SPECS), ...DEFAULT_ORDER])];
  const out: ProviderConfig[] = [];
  for (const id of order) {
    const spec = SPECS[id];
    const apiKey = spec.keyEnv.map(k => env[k]?.trim()).find(Boolean);
    if (!apiKey) continue;
    out.push({
      id, label: spec.label, url: spec.url, apiKey,
      model: env[spec.modelEnv]?.trim() || spec.defaultModel,
      maxOutputTokens: clampInt(env[spec.maxOutEnv], spec.defaultMaxOut, 256, 16384),
      reasoning: spec.reasoning,
      extraHeaders: spec.extraHeaders,
    });
  }
  return out;
}

// Per-instance memory of providers that told us to back off. Warm serverless instances reuse it.
const cooldownUntil = new Map<ProviderId, number>();
export function resetCooldowns(): void { cooldownUntil.clear(); }

export interface Attempt {
  provider: ProviderId;
  model: string;
  outcome: 'ok' | 'rate_limited' | 'too_large' | 'auth' | 'bad_request' | 'server_error' | 'timeout' | 'network' | 'empty' | 'skipped_cooldown';
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
  const body: Record<string, unknown> = {
    model: p.model,
    messages: req.messages,
    temperature: req.temperature,
    max_tokens: p.maxOutputTokens,
  };
  if (p.reasoning === 'groq') body.reasoning_effort = reasoningOff ? 'none' : 'low';
  if (p.reasoning === 'gemini') body.reasoning_effort = reasoningOff ? 'none' : 'low';
  return body;
}

function retryAfterSeconds(res: Response): number | null {
  const raw = res.headers.get('retry-after');
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n >= 0 ? Math.min(3600, Math.ceil(n)) : null;
}

/**
 * Tries each provider in order until one returns non-empty text.
 * @param deadlineMs absolute epoch ms; no new attempt starts after it (stays inside the function timeout).
 */
export async function chatWithFallback(
  providers: ProviderConfig[],
  req: ChatRequest,
  options: { deadlineMs: number; perAttemptTimeoutMs?: number; fetcher?: typeof fetch; now?: () => number } ,
): Promise<RouterResult> {
  const fetcher = options.fetcher ?? fetch;
  const now = options.now ?? Date.now;
  const attempts: Attempt[] = [];
  let shortestRetry: number | null = null;

  for (const [index, p] of providers.entries()) {
    const started = now();
    // The last provider has nobody to fall back to: give it all the remaining time.
    const isLast = index === providers.length - 1;
    if ((cooldownUntil.get(p.id) ?? 0) > started) {
      attempts.push({ provider: p.id, model: p.model, outcome: 'skipped_cooldown', durationMs: 0 });
      const left = Math.ceil(((cooldownUntil.get(p.id) ?? 0) - started) / 1000);
      shortestRetry = shortestRetry === null ? left : Math.min(shortestRetry, left);
      continue;
    }
    const remaining = options.deadlineMs - started;
    if (remaining < 3000) break;

    // One retry on the same provider only for reasoning-hint rejection (400); everything else moves on.
    for (const reasoningOff of p.reasoning === 'none' ? [false] : req.deep ? [true, false] : [false]) {
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

      if (res.status === 400 && reasoningOff) continue; // provider/model rejected reasoning_effort=none: retry with low
      const outcome: Attempt['outcome'] =
        res.status === 429 ? 'rate_limited'
        : res.status === 413 ? 'too_large'
        : res.status === 401 || res.status === 403 ? 'auth'
        : res.status >= 500 ? 'server_error'
        : 'bad_request';
      attempts.push({ provider: p.id, model: p.model, outcome, status: res.status, durationMs: now() - t0 });
      if (outcome === 'rate_limited') {
        const wait = retryAfterSeconds(res) ?? 60;
        cooldownUntil.set(p.id, now() + wait * 1000);
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
