import { Env, jsonResponse, errorResponse, checkAuth } from '../../utils/storage';
import { resolveProvider } from '../../services/ai/config';

interface ModelsRequest {
  provider?: 'custom';
  customId?: string;
  force?: boolean;
}

const CACHE_TTL_MS = 30 * 60 * 1000;

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);

const normalizeBaseUrl = (value?: string) => {
  const raw = (value || '').trim();
  if (!raw) return '';
  if (isHttpUrl(raw)) return raw;
  if (/^\/\//.test(raw)) return `https:${raw}`;
  if (/^[a-z0-9.-]+(?::\d+)?(\/.*)?$/i.test(raw)) return `https://${raw}`;
  return raw;
};

const toAbsoluteEndpointUrl = (endpoint: string, base?: string) => {
  const raw = (endpoint || '').trim();
  if (!raw) return '';

  if (isHttpUrl(raw)) return raw;
  if (/^\/\//.test(raw)) return `https:${raw}`;
  if (/^[a-z0-9.-]+(?::\d+)?(\/.*)?$/i.test(raw) && !raw.startsWith('/')) {
    return `https://${raw}`;
  }

  const normalizedBase = normalizeBaseUrl(base);
  if (!normalizedBase || !isHttpUrl(normalizedBase)) return raw;

  try {
    const baseUrl = new URL(normalizedBase);
    if (raw.startsWith('/')) {
      return new URL(raw, `${baseUrl.origin}/`).toString();
    }
    const normalizedPathBase = normalizedBase.endsWith('/') ? normalizedBase : `${normalizedBase}/`;
    return new URL(raw, normalizedPathBase).toString();
  } catch {
    return raw;
  }
};

const safeJson = async (response: Response): Promise<any> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const joinPath = (basePath: string, suffix: string) => {
  const left = trimTrailingSlash(basePath);
  const right = suffix.startsWith('/') ? suffix : `/${suffix}`;
  return left ? `${left}${right}` : right;
};

const buildModelsCandidates = (absoluteEndpointUrl: string) => {
  const endpoint = new URL(absoluteEndpointUrl);
  const normalizedPath = trimTrailingSlash(endpoint.pathname || '/');

  let basePath = normalizedPath;
  if (/\/chat\/completions$/i.test(normalizedPath)) {
    basePath = normalizedPath.replace(/\/chat\/completions$/i, '');
  } else if (/\/completions$/i.test(normalizedPath)) {
    basePath = normalizedPath.replace(/\/completions$/i, '');
  } else if (/\/models$/i.test(normalizedPath)) {
    basePath = normalizedPath.replace(/\/models$/i, '');
  }

  const candidates = [
    joinPath(basePath, '/models'),
    /\/v1$/i.test(basePath)
      ? joinPath(basePath.replace(/\/v1$/i, ''), '/models')
      : joinPath(basePath, '/v1/models')
  ];

  return Array.from(new Set(candidates)).map((path) => {
    const url = new URL(endpoint.toString());
    url.pathname = path;
    url.search = '';
    url.hash = '';
    return url.toString();
  });
};

const normalizeModels = (payload: any): string[] => {
  const data = payload?.data ?? payload?.models ?? payload?.result ?? payload;
  if (!Array.isArray(data)) return [];
  const seen = new Set<string>();
  const models: string[] = [];
  for (const item of data) {
    const value =
      typeof item === 'string'
        ? item
        : (item?.id || item?.model || item?.name || '');
    const normalized = String(value || '').trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    models.push(normalized);
  }
  return models.sort();
};

const getCacheKey = (customId?: string) => `ai_models_cache:custom:${customId || 'default'}`;

const readCache = async (env: Env, key: string): Promise<string[] | null> => {
  if (!env.CLOUDTRACK_KV) return null;
  try {
    const raw = await env.CLOUDTRACK_KV.get(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts?: number; models?: string[] };
    if (!parsed?.ts || !Array.isArray(parsed?.models)) return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.models;
  } catch {
    return null;
  }
};

const writeCache = async (env: Env, key: string, models: string[]) => {
  if (!env.CLOUDTRACK_KV) return;
  try {
    await env.CLOUDTRACK_KV.put(key, JSON.stringify({ ts: Date.now(), models }));
  } catch {
    // ignore cache errors
  }
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  if (!checkAuth(request, env)) {
    return errorResponse('Unauthorized', 401);
  }

  let body: ModelsRequest = {};
  try {
    body = (await request.json()) as ModelsRequest;
  } catch {
    body = {};
  }

  const provider = body.provider || 'custom';
  if (provider !== 'custom') {
    return errorResponse('Unsupported provider', 400);
  }

  const customId = body.customId?.trim() || undefined;
  const cacheKey = getCacheKey(customId);
  if (!body.force) {
    const cached = await readCache(env, cacheKey);
    if (cached) {
      return jsonResponse({ success: true, provider, customId, models: cached, cached: true });
    }
  }

  const resolved = resolveProvider(env, 'custom', { customId });
  if (!resolved.config) {
    return errorResponse(resolved.error?.message || 'Custom endpoint not configured', 400);
  }

  const endpointUrl = resolved.config.url;
  if (!endpointUrl) {
    return errorResponse('Custom endpoint URL not configured', 400);
  }

  const absoluteEndpointUrl = toAbsoluteEndpointUrl(endpointUrl, env.CUSTOM_AI_BASE_URL);
  if (!isHttpUrl(absoluteEndpointUrl)) {
    return errorResponse('Custom endpoint URL must be absolute (include protocol and host)', 400);
  }

  const modelsCandidates = buildModelsCandidates(absoluteEndpointUrl);
  const headers: Record<string, string> = {
    Accept: 'application/json'
  };
  if (resolved.config.apiKey) {
    headers.Authorization = `Bearer ${resolved.config.apiKey}`;
    headers['api-key'] = resolved.config.apiKey;
  }
  if (resolved.config.extraHeaders) {
    Object.assign(headers, resolved.config.extraHeaders);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    let lastError: { status: number; message: string } | null = null;

    for (const modelsUrl of modelsCandidates) {
      const response = await fetch(modelsUrl, {
        method: 'GET',
        headers,
        signal: controller.signal
      });
      const payload = await safeJson(response);

      if (!response.ok) {
        const upstreamMessage =
          payload?.error?.message ||
          payload?.message ||
          `${response.status} ${response.statusText}`;
        lastError = { status: response.status, message: upstreamMessage };
        if (response.status === 404 || response.status === 405) {
          continue;
        }
        return errorResponse(`Upstream error: ${upstreamMessage}`, response.status);
      }

      const models = normalizeModels(payload);
      await writeCache(env, cacheKey, models);

      return jsonResponse({ success: true, provider, customId, models, cached: false });
    }

    if (lastError) {
      return errorResponse(`Upstream error: ${lastError.message}`, lastError.status);
    }

    return errorResponse('No available models endpoint', 502);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResponse(`Failed to fetch models: ${message}`, 502);
  } finally {
    clearTimeout(timeout);
  }
};
