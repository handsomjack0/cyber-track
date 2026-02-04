export class ApiError extends Error {
  status?: number;
  data?: unknown;

  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data: T | null;
}

export interface ApiRequestOptions extends RequestInit {
  timeoutMs?: number;
  throwOnError?: boolean;
}

const DEFAULT_TIMEOUT_MS = 10000;

const safeParseJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const requestJson = async <T>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> => {
  const { timeoutMs, throwOnError = true, headers, ...rest } = options;
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    timeoutMs ?? DEFAULT_TIMEOUT_MS
  );

  try {
    const response = await fetch(url, {
      ...rest,
      headers: {
        ...(headers || {}),
      },
      signal: controller.signal,
    });

    const data = (await safeParseJson(response)) as T | null;

    if (!response.ok && throwOnError) {
      const message =
        (data as any)?.error ||
        (data as any)?.message ||
        response.statusText ||
        'Request failed';
      throw new ApiError(message, response.status, data);
    }

    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if ((error as any)?.name === 'AbortError') {
      throw new ApiError('Request timeout', undefined, null);
    }
    throw new ApiError('Network request failed', undefined, null);
  } finally {
    clearTimeout(timeout);
  }
};
