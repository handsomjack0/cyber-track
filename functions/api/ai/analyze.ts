import { GoogleGenAI } from '@google/genai';
import { Env, jsonResponse, errorResponse, checkAuth, Resource } from '../../utils/storage';
import {
  AiProvider,
  getAiRuntimeSettings,
  getDefaultProvider,
  resolveProvider
} from '../../services/ai/config';
import { callOpenAICompatible, withTimeout } from '../../services/ai/client';

interface AnalyzeRequest {
  resources: Resource[];
  provider?: AiProvider;
  model?: string;
  customId?: string;
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

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const requestId = request.headers.get('cf-ray') || 'unknown';
  let provider: AiProvider = getDefaultProvider(env);
  let model = '';

  // 1. Auth Check
  if (!checkAuth(request, env)) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = await request.json() as AnalyzeRequest;
    const resources = body.resources || [];
    provider = body.provider || getDefaultProvider(env);

    const prompt = buildPrompt(resources);
    const runtime = getAiRuntimeSettings(env);
    const resolved = resolveProvider(env, provider, { model: body.model, customId: body.customId });

    if (!resolved.config) {
      const error = resolved.error || { code: 'UNSUPPORTED_PROVIDER', message: 'Unsupported provider.' };
      const status = error.code === 'UNSUPPORTED_PROVIDER' || error.code === 'CUSTOM_ENDPOINT_NOT_FOUND' ? 400 : 500;
      return errorWithCode(error.message, error.code, status, provider, model, requestId);
    }

    model = resolved.config.model;

    if (resolved.config.kind === 'gemini') {
      const ai = new GoogleGenAI({ apiKey: resolved.config.apiKey! });
      const response = await withTimeout(
        ai.models.generateContent({
          model,
          contents: prompt
        }),
        runtime.timeoutMs
      ) as Awaited<ReturnType<typeof ai.models.generateContent>>;

      return jsonResponse({ success: true, analysis: response.text });
    }

    const analysis = await callOpenAICompatible({
      url: resolved.config.url!,
      apiKey: resolved.config.apiKey,
      model,
      prompt,
      extraHeaders: resolved.config.extraHeaders,
      mode: resolved.config.mode,
      timeoutMs: runtime.timeoutMs,
      retries: runtime.retries,
      retryDelayMs: runtime.retryDelayMs,
      temperature: runtime.temperature,
      maxTokens: runtime.maxTokens
    });
    return jsonResponse({ success: true, analysis });
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
  provider?: AiProvider,
  model?: string,
  requestId?: string
) =>
  jsonResponse(
    { success: false, error: message, error_code: code, provider, model, request_id: requestId },
    status
  );
