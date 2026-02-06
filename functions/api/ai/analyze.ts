
import { GoogleGenAI } from "@google/genai";
import { Env, jsonResponse, errorResponse, checkAuth, Resource } from '../../utils/storage';

type Provider = 'openai' | 'deepseek' | 'openrouter' | 'github' | 'custom' | 'gemini';

interface AnalyzeRequest {
  resources: Resource[];
  provider?: Provider;
  model?: string;
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

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

async function callOpenAICompatible(params: {
  url: string;
  apiKey?: string;
  model: string;
  prompt: string;
  extraHeaders?: Record<string, string>;
}) {
  const { url, apiKey, model, prompt, extraHeaders } = params;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      ...(extraHeaders || {})
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a helpful IT asset advisor.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 800
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI request failed (${response.status}): ${text || response.statusText}`);
  }

  const data = await response.json() as ChatCompletionResponse;
  const text = data?.choices?.[0]?.message?.content;
  return text || '';
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  // 1. Auth Check
  if (!checkAuth(request, env)) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = await request.json() as AnalyzeRequest;
    const resources = body.resources || [];
    const provider = body.provider || 'openai';
    const model = body.model || 'gpt-4o-mini';

    const prompt = buildPrompt(resources);

    if (provider === 'gemini') {
      if (!env.API_KEY) {
        return errorWithCode('Gemini API Key 未配置', 'MISSING_GEMINI_KEY', 500);
      }

      const ai = new GoogleGenAI({ apiKey: env.API_KEY });
      const response = await ai.models.generateContent({
        model: model || 'gemini-1.5-flash',
        contents: prompt,
      });

      return jsonResponse({ success: true, analysis: response.text });
    }

    if (provider === 'openai') {
      if (!env.OPENAI_API_KEY) {
        return errorWithCode('OpenAI API Key 未配置', 'MISSING_OPENAI_KEY', 500);
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
        return errorWithCode('DeepSeek API Key 未配置', 'MISSING_DEEPSEEK_KEY', 500);
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
        return errorWithCode('OpenRouter API Key 未配置', 'MISSING_OPENROUTER_KEY', 500);
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
        return errorWithCode('GitHub Models 配置不完整', 'MISSING_GITHUB_MODELS', 500);
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
      if (!env.CUSTOM_AI_BASE_URL) {
        return errorWithCode('自建公益站地址未配置', 'MISSING_CUSTOM_BASE', 500);
      }
      const raw = env.CUSTOM_AI_BASE_URL.trim();
      const base = raw.replace(/\/$/, '');
      const hasFullEndpoint = /\/chat\/completions$/i.test(base);
      const url = hasFullEndpoint ? base : `${base}/v1/chat/completions`;
      const analysis = await callOpenAICompatible({
        url,
        apiKey: env.CUSTOM_AI_API_KEY,
        model,
        prompt
      });
      return jsonResponse({ success: true, analysis });
    }

    return errorWithCode('Unsupported provider.', 'UNSUPPORTED_PROVIDER', 400);

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("AI Backend Error:", message);
    return errorWithCode(`AI Backend Error: ${message}`, 'AI_BACKEND_ERROR', 500);
  }
};
const errorWithCode = (message: string, code: string, status = 400) =>
  jsonResponse({ success: false, error: message, error_code: code }, status);
