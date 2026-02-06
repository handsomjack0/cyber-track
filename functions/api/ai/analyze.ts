import { GoogleGenAI } from '@google/genai';
import { Env, jsonResponse, errorResponse, checkAuth, Resource } from '../../utils/storage';

type Provider = 'openai' | 'deepseek' | 'openrouter' | 'github' | 'custom' | 'gemini';

interface AnalyzeRequest {
  resources: Resource[];
  provider?: Provider;
  model?: string;
  customId?: string;
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string }; text?: string }>;
}

const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_RETRIES = 1;
const RETRY_DELAY_MS = 400;

const buildPrompt = (resources: Resource[]) => `
You are a System Administrator and IT Asset Advisor. Analyze the following JSON list of resources which includes VPS (Servers), Domains, and Phone Numbers (e.g., SIM cards, VoIP numbers).

Data:
${JSON.stringify(resources)}

Output a clean, readable Markdown report using this exact structure (no code fences):

## IT Asset Management Summary
Short 1-2 sentence overview.

### 1. Urgent Alerts
- Bullet list of items expiring in the next 30 days.
- If none, write: "No urgent alerts in the next 30 days."

### 2. Cost Analysis
- **Total Monthly Cost:** $X (or "N/A" if unknown)
- **Total Yearly Cost:** $Y (or "N/A" if unknown)
- **Breakdown by Type** (use a Markdown table):
| Type | Items | Monthly | Yearly | Notes |
| --- | --- | --- | --- | --- |
| VPS |  |  |  |  |
| Domain |  |  |  |  |
| Phone |  |  |  |  |

### 3. Optimization Tips
- 3-6 concise bullets focused on consolidation, renewals, and low-value assets.

### 4. Follow-ups (if needed)
- Any missing info or confirmations required.

Formatting rules:
- Use consistent bold labels.
- Avoid nested lists when possible.
- Do not include raw JSON in the output.
- Keep language professional and helpful.
`;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callOpenAICompatible(params: {
  url: string;
  apiKey?: string;
  model: string;
  prompt: string;
  extraHeaders?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  mode?: 'chat' | 'completion';
}) {
  const { url, apiKey, model, prompt, extraHeaders } = params;
  const timeoutMs = params.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = params.retries ?? DEFAULT_RETRIES;
  const mode = params.mode ?? 'chat';

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
                temperature: 0.4,
                max_tokens: 800
              }
            : {
                model,
                prompt,
                temperature: 0.4,
                max_tokens: 800
              }
        ),
        signal: controller.signal
      });

      if (!response.ok) {
        const text = await response.text();
        if ((response.status >= 500 || response.status === 429) && attempt < retries) {
          console.warn('[ai] retry on http error', { status: response.status, attempt });
          await delay(RETRY_DELAY_MS);
          continue;
        }
        throw new Error(`AI request failed (${response.status}): ${text || response.statusText}`);
      }

      const data = await response.json() as ChatCompletionResponse;
      const text =
        mode === 'chat'
          ? data?.choices?.[0]?.message?.content
          : data?.choices?.[0]?.text;
      return text || '';
    } catch (error) {
      const isAbort = error instanceof Error && error.name === 'AbortError';
      if (attempt < retries && (isAbort || !(error instanceof Error) || /network/i.test(error.message))) {
        console.warn('[ai] retry on network/timeout', { attempt, reason: isAbort ? 'timeout' : 'network' });
        await delay(RETRY_DELAY_MS);
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

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const requestId = request.headers.get('cf-ray') || 'unknown';
  let provider: Provider = 'openai';
  let model = 'gpt-4o-mini';

  // 1. Auth Check
  if (!checkAuth(request, env)) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = await request.json() as AnalyzeRequest;
    const resources = body.resources || [];
    provider = body.provider || 'openai';
    model = body.model || 'gpt-4o-mini';

    const prompt = buildPrompt(resources);

    if (provider === 'gemini') {
      if (!env.API_KEY) {
        return errorWithCode('Gemini API Key 未配置', 'MISSING_GEMINI_KEY', 500, provider, model, requestId);
      }

      const ai = new GoogleGenAI({ apiKey: env.API_KEY });
      const timeoutMs = DEFAULT_TIMEOUT_MS;
      const response = await Promise.race([
        ai.models.generateContent({
          model: model || 'gemini-1.5-flash',
          contents: prompt,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`AI request timed out after ${timeoutMs}ms`)), timeoutMs)
        )
      ]) as Awaited<ReturnType<typeof ai.models.generateContent>>;

      return jsonResponse({ success: true, analysis: response.text });
    }

    if (provider === 'openai') {
      if (!env.OPENAI_API_KEY) {
        return errorWithCode('OpenAI API Key 未配置', 'MISSING_OPENAI_KEY', 500, provider, model, requestId);
      }
      const analysis = await callOpenAICompatible({
        url: 'https://api.openai.com/v1/chat/completions',
        apiKey: env.OPENAI_API_KEY,
        model,
        prompt
      });
      return jsonResponse({ success: true, analysis });
    }

    if (provider === 'deepseek') {
      if (!env.DEEPSEEK_API_KEY) {
        return errorWithCode('DeepSeek API Key 未配置', 'MISSING_DEEPSEEK_KEY', 500, provider, model, requestId);
      }
      const analysis = await callOpenAICompatible({
        url: 'https://api.deepseek.com/chat/completions',
        apiKey: env.DEEPSEEK_API_KEY,
        model,
        prompt
      });
      return jsonResponse({ success: true, analysis });
    }

    if (provider === 'openrouter') {
      if (!env.OPENROUTER_API_KEY) {
        return errorWithCode('OpenRouter API Key 未配置', 'MISSING_OPENROUTER_KEY', 500, provider, model, requestId);
      }
      const analysis = await callOpenAICompatible({
        url: 'https://openrouter.ai/api/v1/chat/completions',
        apiKey: env.OPENROUTER_API_KEY,
        model,
        prompt,
        extraHeaders: {
          ...(env.OPENROUTER_SITE_URL ? { 'HTTP-Referer': env.OPENROUTER_SITE_URL } : {}),
          ...(env.OPENROUTER_APP_TITLE ? { 'X-Title': env.OPENROUTER_APP_TITLE } : {})
        }
      });
      return jsonResponse({ success: true, analysis });
    }

    if (provider === 'github') {
      if (!env.GITHUB_TOKEN || !env.GITHUB_MODELS_URL) {
        return errorWithCode('GitHub Models 配置不完整', 'MISSING_GITHUB_MODELS', 500, provider, model, requestId);
      }
      const analysis = await callOpenAICompatible({
        url: env.GITHUB_MODELS_URL,
        apiKey: env.GITHUB_TOKEN,
        model,
        prompt,
        extraHeaders: {
          Accept: 'application/vnd.github+json'
        }
      });
      return jsonResponse({ success: true, analysis });
    }

    if (provider === 'custom') {
      const endpoints = parseCustomEndpoints(env.CUSTOM_AI_ENDPOINTS);
      if (endpoints.length > 0) {
        const selected =
          (body.customId && endpoints.find(e => e.id === body.customId)) || endpoints[0];
        const url = selected.url;
        const mode = /\/chat\/completions$/i.test(url) ? 'chat' : 'completion';
        const analysis = await callOpenAICompatible({
          url,
          apiKey: selected.key || env.CUSTOM_AI_API_KEY,
          model: body.model || selected.defaultModel || model,
          prompt,
          mode
        });
        return jsonResponse({ success: true, analysis, provider, model: body.model || selected.defaultModel || model });
      }

      if (!env.CUSTOM_AI_BASE_URL && !env.CUSTOM_AI_ENDPOINT) {
        return errorWithCode('自建公益站地址未配置', 'MISSING_CUSTOM_BASE', 500, provider, model, requestId);
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

      const mode = /\/chat\/completions$/i.test(url) ? 'chat' : 'completion';
      const analysis = await callOpenAICompatible({
        url,
        apiKey: env.CUSTOM_AI_API_KEY,
        model,
        prompt,
        mode
      });
      return jsonResponse({ success: true, analysis });
    }

    return errorWithCode('Unsupported provider.', 'UNSUPPORTED_PROVIDER', 400, provider, model, requestId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('AI Backend Error:', message);
    const code = message.includes('timed out')
      ? 'AI_TIMEOUT'
      : message.includes('429')
        ? 'AI_RATE_LIMIT'
        : 'AI_BACKEND_ERROR';
    return errorWithCode(`AI Backend Error: ${message}`, code, 500, provider, model, requestId);
  }
};

const errorWithCode = (
  message: string,
  code: string,
  status = 400,
  provider?: Provider,
  model?: string,
  requestId?: string
) =>
  jsonResponse(
    { success: false, error: message, error_code: code, provider, model, request_id: requestId },
    status
  );
type CustomEndpoint = {
  id: string;
  url: string;
  key?: string;
  defaultModel?: string;
};

const parseCustomEndpoints = (raw?: string): CustomEndpoint[] => {
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
