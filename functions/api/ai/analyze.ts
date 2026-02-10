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
你是“IT 资产治理顾问（FinOps + SRE）”，需要基于用户资产数据输出一份可执行的中文报告。

输入数据（JSON）：
${JSON.stringify(resources)}

请严格按以下 Markdown 结构输出（不要代码块，不要输出原始 JSON）：

## 资产管理总览
- 用 2-4 句总结当前资产规模、到期风险和成本结构。
- 明确点出最需要优先处理的 1-2 个问题。

### 1. 紧急预警（30 天内）
- 列出 30 天内到期或已过期的资产。
- 每条尽量包含：资产名、类型、服务商、到期日、剩余天数、费用。
- 若无风险项，写："未来 30 天无紧急到期风险。"

### 2. 成本分析
- **月度总成本（估算）**：给出数值；无法估算时写“信息不足”并说明缺失字段。
- **年度总成本（估算）**：给出数值；无法估算时写“信息不足”并说明缺失字段。
- **类型拆分表**（必须输出表格）：
| 类型 | 数量 | 月度成本 | 年度成本 | 主要服务商 | 备注 |
| --- | --- | --- | --- | --- | --- |
| VPS |  |  |  |  |  |
| DOMAIN |  |  |  |  |  |
| PHONE_NUMBER |  |  |  |  |  |
| ACCOUNT |  |  |  |  |  |

### 3. 优化建议（可执行）
- 给出 4-8 条，按“高收益优先”排序。
- 覆盖：续费策略、闲置清理、供应商整合、套餐/账期优化、自动续费风险控制。
- 每条建议尽量包含：建议动作 + 预期收益 + 风险/前提。

### 4. 待确认信息
- 列出影响判断准确性的缺失信息（如 billingCycle、startDate、expiryDate、cost、currency、tags、autoRenew）。
- 若信息完整，写："当前关键字段基本完整。"

分析规则（必须遵守）：
- 使用中文输出，术语可保留英文（如 FinOps、SLA）。
- 优先利用这些字段：type、provider、expiryDate、cost、currency、billingCycle、autoRenew、tags、status、notes。
- 成本估算建议：
  - Monthly/Yearly 直接按对应周期计入；
  - OneTime 不计入月度，可在备注提示；
  - 周期缺失时做“保守估算”并明确写出假设。
- 不编造不存在的数据；不确定时明确写“假设”或“信息不足”。
- 风格要求：专业、简洁、可执行，避免空泛表述。
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
    const lower = message.toLowerCase();
    const code = message.includes('timed out')
      ? 'AI_TIMEOUT'
      : message.includes('429')
        ? 'AI_RATE_LIMIT'
        : (lower.includes('model_not_found') || lower.includes('model not found'))
          ? 'AI_MODEL_NOT_FOUND'
          : (message.includes('无可用渠道') || lower.includes('no available distributor') || lower.includes('distributor'))
            ? 'AI_MODEL_UNAVAILABLE'
            : lower.includes('(503)')
              ? 'AI_UPSTREAM_UNAVAILABLE'
              : 'AI_BACKEND_ERROR';
    const status =
      code === 'AI_MODEL_NOT_FOUND' ? 400 :
      code === 'AI_RATE_LIMIT' ? 429 :
      code === 'AI_TIMEOUT' ? 504 :
      code === 'AI_MODEL_UNAVAILABLE' || code === 'AI_UPSTREAM_UNAVAILABLE' ? 503 :
      500;
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
