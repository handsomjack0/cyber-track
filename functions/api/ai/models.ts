import { Env, jsonResponse, errorResponse, checkAuth } from '../../utils/storage';
import { resolveProvider } from '../../services/ai/config';

interface ModelsRequest {
  provider?: 'custom';
  customId?: string;
  force?: boolean;
}

const CACHE_TTL_MS = 30 * 60 * 1000;

const safeJson = async (response: Response): Promise<any> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const buildModelsCandidates = (endpointUrl: string) => {
  const trimmed = endpointUrl.replace(/\/$/, '');
  const match = trimmed.match(/(.*)\/(?:chat\/completions|completions)$/i);
  const base = match ? match[1] : trimmed;
  const primary = base.endsWith('/models') ? base : `${base}/models`;
  const candidates = [primary];

  if (primary.includes('/v1/models')) {
    candidates.push(primary.replace('/v1/models', '/models'));
  } else if (primary.endsWith('/models')) {
    candidates.push(primary.replace(/\/models$/, '/v1/models'));
  }

  return Array.from(new Set(candidates));
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

  const modelsCandidates = buildModelsCandidates(endpointUrl);
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
