import { AiMode } from './config';

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string }; text?: string }>;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number) => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`AI request timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

export async function callOpenAICompatible(params: {
  url: string;
  apiKey?: string;
  model: string;
  prompt: string;
  extraHeaders?: Record<string, string>;
  timeoutMs: number;
  retries: number;
  retryDelayMs: number;
  temperature: number;
  maxTokens: number;
  mode?: AiMode;
}) {
  const {
    url,
    apiKey,
    model,
    prompt,
    extraHeaders,
    timeoutMs,
    retries,
    retryDelayMs,
    temperature,
    maxTokens,
    mode = 'chat'
  } = params;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          ...(extraHeaders || {})
        },
        body: JSON.stringify(
          mode === 'chat'
            ? {
                model,
                messages: [
                  { role: 'system', content: 'You are a helpful IT asset advisor.' },
                  { role: 'user', content: prompt }
                ],
                temperature,
                max_tokens: maxTokens
              }
            : {
                model,
                prompt,
                temperature,
                max_tokens: maxTokens
              }
        ),
        signal: controller.signal
      });

      if (!response.ok) {
        const text = await response.text();
        if ((response.status >= 500 || response.status === 429) && attempt < retries) {
          console.warn('[ai] retry on http error', { status: response.status, attempt });
          await delay(retryDelayMs);
          continue;
        }
        throw new Error(`AI request failed (${response.status}): ${text || response.statusText}`);
      }

      const data = (await response.json()) as ChatCompletionResponse;
      const text = mode === 'chat' ? data?.choices?.[0]?.message?.content : data?.choices?.[0]?.text;
      return text || '';
    } catch (error) {
      const isAbort = error instanceof Error && error.name === 'AbortError';
      if (attempt < retries && (isAbort || !(error instanceof Error) || /network/i.test(error.message))) {
        console.warn('[ai] retry on network/timeout', { attempt, reason: isAbort ? 'timeout' : 'network' });
        await delay(retryDelayMs);
        continue;
      }
      if (isAbort) {
        throw new Error(`AI request timed out after ${timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  return '';
}
