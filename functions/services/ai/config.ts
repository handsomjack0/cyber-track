import { Env } from '../../utils/storage';

export type AiProvider = 'openai' | 'deepseek' | 'openrouter' | 'github' | 'custom' | 'gemini';
export type AiMode = 'chat' | 'completion';

export type ProviderConfig = {
  provider: AiProvider;
  model: string;
  modelFallbacks?: string[];
  kind: 'openai-compatible' | 'gemini';
  apiKey?: string;
  url?: string;
  extraHeaders?: Record<string, string>;
  mode?: AiMode;
};

export type ProviderResolution = {
  config?: ProviderConfig;
  error?: { code: string; message: string };
};

export type AiRuntimeSettings = {
  timeoutMs: number;
  retries: number;
  retryDelayMs: number;
  temperature: number;
  maxTokens: number;
};

type CustomEndpoint = {
  id: string;
  url: string;
  key?: string;
  defaultModel?: string;
};

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);

const normalizeBaseUrl = (value?: string) => {
  const raw = (value || '').trim();
  if (!raw) return '';
  if (isHttpUrl(raw)) return raw;
  if (/^\/\//.test(raw)) return `https:${raw}`;
  if (/^[a-z0-9.-]+(?::\d+)?(\/.*)?$/i.test(raw)) return `https://${raw}`;
  return raw;
};

const resolveCustomUrl = (endpoint?: string, base?: string) => {
  const rawEndpoint = (endpoint || '').trim();
  if (!rawEndpoint) return '';

  if (isHttpUrl(rawEndpoint)) return rawEndpoint;
  if (/^\/\//.test(rawEndpoint)) return `https:${rawEndpoint}`;
  if (/^[a-z0-9.-]+(?::\d+)?(\/.*)?$/i.test(rawEndpoint) && !rawEndpoint.startsWith('/')) {
    return `https://${rawEndpoint}`;
  }

  const normalizedBase = normalizeBaseUrl(base);
  if (!normalizedBase || !isHttpUrl(normalizedBase)) return rawEndpoint;

  try {
    const baseUrl = new URL(normalizedBase);
    if (rawEndpoint.startsWith('/')) {
      return new URL(rawEndpoint, `${baseUrl.origin}/`).toString();
    }
    const normalizedPathBase = normalizedBase.endsWith('/') ? normalizedBase : `${normalizedBase}/`;
    return new URL(rawEndpoint, normalizedPathBase).toString();
  } catch {
    return rawEndpoint;
  }
};
export const DEFAULT_MODELS: Record<AiProvider, string> = {
  openai: 'gpt-4o-mini',
  deepseek: 'deepseek-chat',
  openrouter: 'openai/gpt-4o-mini',
  github: 'gpt-4o-mini',
  custom: 'gpt-4o-mini',
  gemini: 'gemini-1.5-flash'
};

const MODEL_ENV_BY_PROVIDER: Record<AiProvider, keyof Env | 'AI_CUSTOM_MODEL'> = {
  openai: 'AI_OPENAI_MODEL',
  deepseek: 'AI_DEEPSEEK_MODEL',
  openrouter: 'AI_OPENROUTER_MODEL',
  github: 'AI_GITHUB_MODEL',
  custom: 'AI_CUSTOM_MODEL',
  gemini: 'AI_GEMINI_MODEL'
};

const PROVIDER_ERRORS: Record<AiProvider, { code: string; message: string }> = {
  openai: { code: 'MISSING_OPENAI_KEY', message: 'OpenAI API key is not configured.' },
  deepseek: { code: 'MISSING_DEEPSEEK_KEY', message: 'DeepSeek API key is not configured.' },
  openrouter: { code: 'MISSING_OPENROUTER_KEY', message: 'OpenRouter API key is not configured.' },
  github: { code: 'MISSING_GITHUB_MODELS', message: 'GitHub Models configuration is incomplete.' },
  custom: { code: 'MISSING_CUSTOM_BASE', message: 'Custom endpoint URL is not configured.' },
  gemini: { code: 'MISSING_GEMINI_KEY', message: 'Gemini API key is not configured.' }
};

const DEFAULT_RUNTIME: AiRuntimeSettings = {
  timeoutMs: 45000,
  retries: 1,
  retryDelayMs: 800,
  temperature: 0.4,
  maxTokens: 600
};

const parseNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const unique = (items: Array<string | undefined>) => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const value = item?.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
};

const parseModelList = (value?: string) =>
  (value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export const parseCustomEndpoints = (raw?: string): CustomEndpoint[] => {
  if (!raw) return [];
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [id, url, key, defaultModel] = line.split('|').map((s) => s?.trim());
      if (!id || !url) return null;
      return { id, url, key, defaultModel };
    })
    .filter((v): v is CustomEndpoint => Boolean(v));
};

export const getAiRuntimeSettings = (env: Env, overrides?: Partial<AiRuntimeSettings>): AiRuntimeSettings => {
  const timeoutMs = parseNumber(env.AI_TIMEOUT_MS, DEFAULT_RUNTIME.timeoutMs);
  const retries = Math.max(0, Math.floor(parseNumber(env.AI_RETRIES, DEFAULT_RUNTIME.retries)));
  const retryDelayMs = parseNumber(env.AI_RETRY_DELAY_MS, DEFAULT_RUNTIME.retryDelayMs);
  const temperature = parseNumber(env.AI_TEMPERATURE, DEFAULT_RUNTIME.temperature);
  const maxTokens = Math.max(1, Math.floor(parseNumber(env.AI_MAX_TOKENS, DEFAULT_RUNTIME.maxTokens)));

  return {
    timeoutMs: overrides?.timeoutMs ?? timeoutMs,
    retries: overrides?.retries ?? retries,
    retryDelayMs: overrides?.retryDelayMs ?? retryDelayMs,
    temperature: overrides?.temperature ?? temperature,
    maxTokens: overrides?.maxTokens ?? maxTokens
  };
};

const resolveModel = (
  env: Env,
  provider: AiProvider,
  requested?: string,
  endpointDefault?: string
) => {
  const endpointModels = parseModelList(endpointDefault);
  const modelEnvKey = MODEL_ENV_BY_PROVIDER[provider];
  const providerModel = (env as Record<string, string | undefined>)[modelEnvKey];
  return requested || endpointModels[0] || providerModel || env.AI_DEFAULT_MODEL || DEFAULT_MODELS[provider];
};

export const resolveProvider = (
  env: Env,
  provider: AiProvider,
  options?: { model?: string; customId?: string }
): ProviderResolution => {
  switch (provider) {
    case 'openai':
      if (!env.OPENAI_API_KEY) return { error: PROVIDER_ERRORS.openai };
      return {
        config: {
          provider,
          kind: 'openai-compatible',
          model: resolveModel(env, provider, options?.model),
          apiKey: env.OPENAI_API_KEY,
          url: 'https://api.openai.com/v1/chat/completions'
        }
      };
    case 'deepseek':
      if (!env.DEEPSEEK_API_KEY) return { error: PROVIDER_ERRORS.deepseek };
      return {
        config: {
          provider,
          kind: 'openai-compatible',
          model: resolveModel(env, provider, options?.model),
          apiKey: env.DEEPSEEK_API_KEY,
          url: 'https://api.deepseek.com/chat/completions'
        }
      };
    case 'openrouter':
      if (!env.OPENROUTER_API_KEY) return { error: PROVIDER_ERRORS.openrouter };
      return {
        config: {
          provider,
          kind: 'openai-compatible',
          model: resolveModel(env, provider, options?.model),
          apiKey: env.OPENROUTER_API_KEY,
          url: 'https://openrouter.ai/api/v1/chat/completions',
          extraHeaders: {
            ...(env.OPENROUTER_SITE_URL ? { 'HTTP-Referer': env.OPENROUTER_SITE_URL } : {}),
            ...(env.OPENROUTER_APP_TITLE ? { 'X-Title': env.OPENROUTER_APP_TITLE } : {})
          }
        }
      };
    case 'github':
      if (!env.GITHUB_TOKEN || !env.GITHUB_MODELS_URL) return { error: PROVIDER_ERRORS.github };
      return {
        config: {
          provider,
          kind: 'openai-compatible',
          model: resolveModel(env, provider, options?.model),
          apiKey: env.GITHUB_TOKEN,
          url: env.GITHUB_MODELS_URL,
          extraHeaders: { Accept: 'application/vnd.github+json' }
        }
      };
    case 'custom': {
      const endpoints = parseCustomEndpoints(env.CUSTOM_AI_ENDPOINTS);
      if (endpoints.length > 0) {
        const selected = options?.customId ? endpoints.find((e) => e.id === options.customId) : endpoints[0];
        if (!selected) {
          return { error: { code: 'CUSTOM_ENDPOINT_NOT_FOUND', message: '自建站标识不存在' } };
        }
        const endpointUrl = resolveCustomUrl(selected.url, env.CUSTOM_AI_BASE_URL);
        const mode: AiMode = /\/chat\/completions$/i.test(endpointUrl) ? 'chat' : 'completion';
        const endpointModels = parseModelList(selected.defaultModel);
        return {
          config: {
            provider,
            kind: 'openai-compatible',
            model: resolveModel(env, provider, options?.model, selected.defaultModel),
            modelFallbacks: unique([options?.model, ...endpointModels, env.AI_CUSTOM_MODEL, env.AI_DEFAULT_MODEL]),
            apiKey: selected.key || env.CUSTOM_AI_API_KEY,
            url: endpointUrl,
            mode
          }
        };
      }

      if (!env.CUSTOM_AI_BASE_URL && !env.CUSTOM_AI_ENDPOINT) {
        return { error: PROVIDER_ERRORS.custom };
      }

      const rawEndpoint = env.CUSTOM_AI_ENDPOINT?.trim();
      const rawBase = env.CUSTOM_AI_BASE_URL?.trim();
      const normalizedBase = normalizeBaseUrl(rawBase);
      let url = '';
      if (rawEndpoint) {
        url = resolveCustomUrl(rawEndpoint, normalizedBase);
      } else if (normalizedBase) {
        const base = normalizedBase.replace(/\/$/, '');
        const hasFullEndpoint = /\/(chat\/completions|completions)$/i.test(base);
        url = hasFullEndpoint ? base : `${base}/v1/chat/completions`;
      }
      const mode: AiMode = /\/chat\/completions$/i.test(url) ? 'chat' : 'completion';
      return {
        config: {
          provider,
          kind: 'openai-compatible',
          model: resolveModel(env, provider, options?.model),
          modelFallbacks: unique([options?.model, env.AI_CUSTOM_MODEL, env.AI_DEFAULT_MODEL]),
          apiKey: env.CUSTOM_AI_API_KEY,
          url,
          mode
        }
      };
    }
    case 'gemini':
      if (!env.API_KEY) return { error: PROVIDER_ERRORS.gemini };
      return {
        config: {
          provider,
          kind: 'gemini',
          model: resolveModel(env, provider, options?.model),
          apiKey: env.API_KEY
        }
      };
    default:
      return { error: { code: 'UNSUPPORTED_PROVIDER', message: 'Unsupported provider.' } };
  }
};

export const pickFirstAvailableProvider = (env: Env, preferred?: AiProvider[]): ProviderConfig | null => {
  const order = preferred?.length ? preferred : (['openai', 'deepseek', 'openrouter', 'github', 'custom', 'gemini'] as AiProvider[]);
  for (const provider of order) {
    const resolved = resolveProvider(env, provider);
    if (resolved.config) return resolved.config;
  }
  return null;
};

export const getDefaultProvider = (env: Env) => (env.AI_DEFAULT_PROVIDER as AiProvider | undefined) || 'openai';

export const getProviderModelFallbacks = (
  provider: AiProvider,
  env: Env,
  preferredModel?: string,
  candidateModels?: string[]
) => {
  const common = [preferredModel, ...(candidateModels || []), env.AI_DEFAULT_MODEL];
  switch (provider) {
    case 'deepseek':
      return unique([...common, env.AI_DEEPSEEK_MODEL, 'deepseek-chat', 'deepseek-reasoner']);
    case 'openai':
      return unique([...common, env.AI_OPENAI_MODEL, 'gpt-4o-mini']);
    case 'openrouter':
      return unique([...common, env.AI_OPENROUTER_MODEL, 'openai/gpt-4o-mini', 'deepseek/deepseek-chat']);
    case 'github':
      return unique([...common, env.AI_GITHUB_MODEL, 'gpt-4o-mini']);
    case 'gemini':
      return unique([...common, env.AI_GEMINI_MODEL, 'gemini-1.5-flash']);
    case 'custom':
      return unique([
        preferredModel,
        ...(candidateModels || []),
        env.AI_CUSTOM_MODEL,
        env.AI_DEFAULT_MODEL,
        'deepseek-chat',
        'DeepSeek-V3.1',
        'Qwen3-32B',
        'zai-glm-4.7'
      ]);
    default:
      return unique([...common]);
  }
};

export const resolveProviderCandidates = (
  env: Env,
  preferred: AiProvider[],
  options?: { model?: string; customId?: string }
) => {
  const candidates: ProviderConfig[] = [];
  const pushIfConfig = (resolved: ProviderResolution) => {
    if (resolved.config) candidates.push(resolved.config);
  };

  for (const provider of preferred) {
    if (provider === 'custom' && !options?.customId) {
      const endpoints = parseCustomEndpoints(env.CUSTOM_AI_ENDPOINTS);
      if (endpoints.length > 0) {
        for (const ep of endpoints) {
          pushIfConfig(resolveProvider(env, 'custom', { model: options?.model, customId: ep.id }));
        }
        continue;
      }
    }
    pushIfConfig(resolveProvider(env, provider, options));
  }

  const dedup = new Set<string>();
  return candidates.filter((c) => {
    const key = `${c.provider}|${c.url || 'gemini'}|${c.model}`;
    if (dedup.has(key)) return false;
    dedup.add(key);
    return true;
  });
};

