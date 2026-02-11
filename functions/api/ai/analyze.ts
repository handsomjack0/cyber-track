import { Env, jsonResponse, errorResponse, checkAuth, Resource } from '../../utils/storage';
import { AiProvider, getDefaultProvider } from '../../services/ai/config';
import { runAiWithFallback } from '../../services/ai/fallback';

interface AnalyzeRequest {
  resources: Resource[];
  provider?: AiProvider;
  model?: string;
  customId?: string;
}

const buildPrompt = (resources: Resource[]) => `
你是 IT 资产治理顾问（FinOps + SRE）。请基于以下 JSON 数据输出简洁、可执行的中文 Markdown 报告。

数据：
${JSON.stringify(resources)}

输出要求：
1. 不要输出代码块，不要复述原始 JSON。
2. 总长度控制在 500-900 中文字。
3. 无法确定的信息明确标注为“信息不足”或“假设”。
4. 标题必须保留 Markdown 标记（## / ###），不要省略井号。
5. 表格每一行必须单独换行，不要把多行表格压在同一行。

必须使用以下结构：

## 资产管理总览
- 2-3 句，概述规模、风险、成本，并指出最高优先级问题。

### 1. 紧急预警（30 天内）
- 列出到期或已过期资产（名称、类型、服务商、到期日、剩余天数、费用）。
- 若没有，写：未来 30 天无紧急到期风险。

### 2. 成本分析
- 月度总成本（估算）
- 年度总成本（估算）
- 类型拆分表：
| 类型 | 数量 | 月度成本 | 年度成本 | 主要服务商 | 备注 |
| --- | --- | --- | --- | --- | --- |
| VPS |  |  |  |  |  |
| DOMAIN |  |  |  |  |  |
| PHONE_NUMBER |  |  |  |  |  |
| ACCOUNT |  |  |  |  |  |

### 3. 优化建议（按优先级）
- 给出 4-6 条，每条包含：动作、预期收益、风险/前提。
- 优先考虑：续费策略、闲置清理、供应商整合、账期优化、自动续费风险。

### 4. 待确认信息
- 列出缺失字段对判断的影响（例如 billingCycle、expiryDate、cost、currency、autoRenew、tags）。
- 若关键字段完整，写：当前关键字段基本完整。

计算规则：
- Monthly/Yearly 按周期计入。
- OneTime 不计入月度，放在备注。
- 周期未知时做保守估算并说明假设。
`;

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
    return jsonResponse({ success: true, analysis: result.text, provider: result.provider, model: result.model });
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
