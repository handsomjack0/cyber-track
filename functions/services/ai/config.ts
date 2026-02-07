import { Env } from '../../utils/storage';

export type AiProvider = 'openai' | 'deepseek' | 'openrouter' | 'github' | 'custom' | 'gemini';
export type AiMode = 'chat' | 'completion';

export type ProviderConfig = {
  provider: AiProvider;
  model: string;
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

const DEFAULT_MODELS: Record<AiProvider, string> = {
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
  openai: { code: 'MISSING_OPENAI_KEY', message: 'OpenAI API Key 未配置' },
  deepseek: { code: 'MISSING_DEEPSEEK_KEY', message: 'DeepSeek API Key 未配置' },
  openrouter: { code: 'MISSING_OPENROUTER_KEY', message: 'OpenRouter API Key 未配置' },
  github: { code: 'MISSING_GITHUB_MODELS', message: 'GitHub Models 配置不完整' },
  custom: { code: 'MISSING_CUSTOM_BASE', message: '自建公益站地址未配置' },
  gemini: { code: 'MISSING_GEMINI_KEY', message: 'Gemini API Key 未配置' }
};

const DEFAULT_RUNTIME: AiRuntimeSettings = {
  timeoutMs: 12000,
  retries: 1,
  retryDelayMs: 400,
  temperature: 0.4,
  maxTokens: 800
};

const parseNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const parseCustomEndpoints = (raw?: string): CustomEndpoint[] => {
  if (!raw) return [];
  return raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [id, url, key, defaultModel] = line.split('|').map(s => s?.trim());
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
  const modelEnvKey = MODEL_ENV_BY_PROVIDER[provider];
  const providerModel = (env as Record<string, string | undefined>)[modelEnvKey];
  return requested || providerModel || env.AI_DEFAULT_MODEL || endpointDefault || DEFAULT_MODELS[provider];
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
        const selected = options?.customId
          ? endpoints.find(e => e.id === options.customId)
          : endpoints[0];
        if (!selected) {
          return { error: { code: 'CUSTOM_ENDPOINT_NOT_FOUND', message: '自建公益站标识不存在' } };
        }
        const mode: AiMode = /\/chat\/completions$/i.test(selected.url) ? 'chat' : 'completion';
        return {
          config: {
            provider,
            kind: 'openai-compatible',
            model: resolveModel(env, provider, options?.model, selected.defaultModel),
            apiKey: selected.key || env.CUSTOM_AI_API_KEY,
            url: selected.url,
            mode
          }
        };
      }

      if (!env.CUSTOM_AI_BASE_URL && !env.CUSTOM_AI_ENDPOINT) {
        return { error: PROVIDER_ERRORS.custom };
      }

      const rawEndpoint = env.CUSTOM_AI_ENDPOINT?.trim();
      const rawBase = env.CUSTOM_AI_BASE_URL?.trim();
      let url = '';
      if (rawEndpoint) {
        url = rawEndpoint;
      } else if (rawBase) {
        const base = rawBase.replace(/\/$/, '');
        const hasFullEndpoint = /\/(chat\/completions|completions)$/i.test(base);
        url = hasFullEndpoint ? base : `${base}/v1/chat/completions`;
      }
      const mode: AiMode = /\/chat\/completions$/i.test(url) ? 'chat' : 'completion';
      return {
        config: {
          provider,
          kind: 'openai-compatible',
          model: resolveModel(env, provider, options?.model),
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

export const pickFirstAvailableProvider = (
  env: Env,
  preferred?: AiProvider[]
): ProviderConfig | null => {
  const order = preferred?.length
    ? preferred
    : (['openai', 'deepseek', 'openrouter', 'github', 'custom', 'gemini'] as AiProvider[]);
  for (const provider of order) {
    const resolved = resolveProvider(env, provider);
    if (resolved.config) return resolved.config;
  }
  return null;
};

export const getDefaultProvider = (env: Env) =>
  (env.AI_DEFAULT_PROVIDER as AiProvider | undefined) || 'openai';
