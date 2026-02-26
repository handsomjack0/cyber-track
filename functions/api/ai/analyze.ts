import { Env, jsonResponse, errorResponse, checkAuth, Resource } from '../../utils/storage';
import { AiProvider, getDefaultProvider } from '../../services/ai/config';
import { runAiWithFallback } from '../../services/ai/fallback';

interface AnalyzeRequest {
  resources: Resource[];
  provider?: AiProvider;
  model?: string;
  customId?: string;
}

const buildPrompt = (resources: Resource[]) => {
  const payload = JSON.stringify(resources);

  return [
    'You are an IT asset management advisor (FinOps + SRE).',
    'Write a concise and actionable report in Simplified Chinese based on the JSON data.',
    '',
    'Hard rules:',
    '1. Output Markdown only.',
    '2. Never output chain-of-thought, reasoning process, hidden analysis, or tags like <think>.',
    '3. Do not repeat the raw JSON.',
    '4. Keep total length around 500-900 Chinese characters.',
    '5. If information is uncertain, explicitly mark it as "insufficient information" or "assumption".',
    '6. Keep the heading structure exactly as specified.',
    '7. Keep each markdown table row on its own line.',
    '',
    'Use this exact structure:',
    '## Portfolio Overview',
    '- 2-3 sentences covering scale, risk, cost, and top-priority issue.',
    '',
    '### 1. Urgent Alerts (next 30 days)',
    '- List expiring/expired assets with: name, type, provider, expiry date, remaining days, and cost.',
    '- If none, clearly say there is no urgent expiry risk in the next 30 days.',
    '',
    '### 2. Cost Analysis',
    '- Estimated monthly total cost',
    '- Estimated yearly total cost',
    '- Breakdown table:',
    '| Type | Count | Monthly Cost | Yearly Cost | Main Provider | Notes |',
    '| --- | --- | --- | --- | --- | --- |',
    '| VPS |  |  |  |  |  |',
    '| DOMAIN |  |  |  |  |  |',
    '| PHONE_NUMBER |  |  |  |  |  |',
    '| ACCOUNT |  |  |  |  |  |',
    '',
    '### 3. Optimization Actions (priority order)',
    '- Give 4-6 items. Each item includes: action, expected benefit, risk/prerequisite.',
    '- Prioritize: renewal strategy, idle cleanup, vendor consolidation, billing optimization, auto-renew risk.',
    '',
    '### 4. Missing Information',
    '- List missing fields and impact: billingCycle, expiryDate, cost, currency, autoRenew, tags.',
    '- If key fields are mostly complete, state that key fields are mostly complete.',
    '',
    'Calculation rules:',
    '- Monthly/Yearly: count by billing cycle.',
    '- OneTime: do not include in monthly total; place in notes.',
    '- Unknown cycle: use conservative estimate and state assumptions.',
    '',
    'Data JSON:',
    payload
  ].join('\n');
};

const sanitizeAiOutput = (text: string) => {
  let output = (text || '').replace(/\r\n/g, '\n');

  output = output.replace(/<think\b[^>]*>[\s\S]*?<\/think>/gi, '');
  output = output.replace(/<thinking\b[^>]*>[\s\S]*?<\/thinking>/gi, '');
  output = output.replace(/```(?:thinking|reasoning|analysis)[\s\S]*?```/gi, '');

  const firstHeadingIdx = output.search(/(^|\n)##\s+/);
  if (firstHeadingIdx > 0) {
    output = output.slice(firstHeadingIdx).trimStart();
  }

  return output.trim();
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const requestId = request.headers.get('cf-ray') || 'unknown';
  let provider: AiProvider = getDefaultProvider(env);
  let model = '';

  if (!checkAuth(request, env)) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = (await request.json()) as AnalyzeRequest;
    const resources = body.resources || [];
    provider = body.provider || getDefaultProvider(env);

    const prompt = buildPrompt(resources);
    const result = await runAiWithFallback({
      env,
      prompt,
      preferredProvider: provider,
      preferredModel: body.model,
      customId: body.customId
    });

    model = result.model;
    const analysis = sanitizeAiOutput(result.text);
    if (!analysis) {
      return errorWithCode(
        'AI Backend Error: empty or non-displayable response',
        'AI_EMPTY_RESPONSE',
        502,
        provider,
        model,
        requestId
      );
    }

    return jsonResponse({ success: true, analysis, provider: result.provider, model: result.model });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('AI Backend Error:', message);
    const lower = message.toLowerCase();
    const code = message.includes('timed out')
      ? 'AI_TIMEOUT'
      : message.includes('429')
        ? 'AI_RATE_LIMIT'
        : lower.includes('model_not_found') || lower.includes('model not found')
          ? 'AI_MODEL_NOT_FOUND'
          : lower.includes('no available distributor') || lower.includes('distributor') || lower.includes('unavailable channel')
            ? 'AI_MODEL_UNAVAILABLE'
            : lower.includes('(503)') || lower.includes('service unavailable')
              ? 'AI_UPSTREAM_UNAVAILABLE'
              : 'AI_BACKEND_ERROR';
    const status = code === 'AI_MODEL_NOT_FOUND'
      ? 400
      : code === 'AI_RATE_LIMIT'
        ? 429
        : code === 'AI_TIMEOUT'
          ? 504
          : code === 'AI_MODEL_UNAVAILABLE' || code === 'AI_UPSTREAM_UNAVAILABLE'
            ? 503
            : 500;
    return errorWithCode(`AI Backend Error: ${message}`, code, status, provider, model, requestId);
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
