import { Resource } from "../types/index";
import { ApiError, requestJson } from "../utils/apiClient";

export type AiProvider = 'openai' | 'deepseek' | 'openrouter' | 'github' | 'custom' | 'gemini';

const getHeaders = () => ({
  'Content-Type': 'application/json'
});

const normalizeAnalysisMarkdown = (input: string): string => {
  let text = (input || '').replace(/\r\n/g, '\n').trim();

  const headingMap: Array<{ pattern: RegExp; replace: string }> = [
    { pattern: /^\s*资产管理总览\s*$/m, replace: '## 资产管理总览' },
    { pattern: /^\s*1\.\s*紧急预警[^\n]*$/m, replace: '### 1. 紧急预警（30 天内）' },
    { pattern: /^\s*2\.\s*成本分析\s*$/m, replace: '### 2. 成本分析' },
    { pattern: /^\s*3\.\s*优化建议[^\n]*$/m, replace: '### 3. 优化建议（按优先级）' },
    { pattern: /^\s*4\.\s*待确认信息\s*$/m, replace: '### 4. 待确认信息' }
  ];

  for (const item of headingMap) {
    text = text.replace(item.pattern, item.replace);
  }

  // Fix common collapsed-table output: "类型拆分表： | ... | | --- ..."
  text = text.replace(/类型拆分表：\s*\|/g, '类型拆分表：\n|');
  text = text.replace(/\s+\|\s+\|\s+/g, ' |\n| ');

  // Ensure stable spacing for markdown parser
  text = text.replace(/\n{3,}/g, '\n\n');
  return text;
};

export const analyzePortfolio = async (
  resources: Resource[],
  provider: AiProvider,
  model: string,
  customId?: string
): Promise<string> => {
  try {
    const response = await requestJson<{ analysis?: string; error?: string }>(
      '/api/ai/analyze',
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ resources, provider, model, customId }),
        timeoutMs: 100000
      }
    );

    if (response.data?.analysis) return normalizeAnalysisMarkdown(response.data.analysis);
    return 'AI 暂未返回内容，请检查模型名称或接口配置。';
  } catch (error) {
    if (error instanceof ApiError) {
      const code = (error.data as any)?.error_code as string | undefined;
      if (code) {
        switch (code) {
          case 'MISSING_OPENAI_KEY':
            return 'OpenAI 未配置 Key。你可以切换到其他平台，或在云端环境变量中添加 OPENAI_API_KEY。';
          case 'MISSING_DEEPSEEK_KEY':
            return 'DeepSeek 未配置 Key。你可以切换到其他平台，或在云端环境变量中添加 DEEPSEEK_API_KEY。';
          case 'MISSING_OPENROUTER_KEY':
            return 'OpenRouter 未配置 Key。你可以切换到其他平台，或在云端环境变量中添加 OPENROUTER_API_KEY。';
          case 'MISSING_GITHUB_MODELS':
            return 'GitHub Models 未配置完成。请设置 GITHUB_TOKEN 与 GITHUB_MODELS_URL，或切换到其他平台。';
          case 'MISSING_CUSTOM_BASE':
            return '自建公益站地址未配置。请设置 CUSTOM_AI_BASE_URL，或切换到其他平台。';
          case 'MISSING_GEMINI_KEY':
            return 'Gemini 未配置 Key。请设置 API_KEY，或切换到其他平台。';
          case 'CUSTOM_ENDPOINT_NOT_FOUND':
            return '自建公益站标识不存在，请检查 customId 或 CUSTOM_AI_ENDPOINTS。';
          case 'AI_MODEL_NOT_FOUND':
            return '当前模型不存在或拼写不正确。请更换可用模型，或检查自建平台的模型列表。';
          case 'AI_MODEL_UNAVAILABLE':
            return '当前模型在上游暂时不可用（无可用渠道）。请稍后重试或切换其他模型/平台。';
          case 'AI_UPSTREAM_UNAVAILABLE':
            return '上游 AI 服务暂时不可用（503）。请稍后重试，或切换到其他平台。';
          default:
            return error.message;
        }
      }
      return error.message;
    }

    console.error("AI Service Error:", error);
    return "Failed to connect to analysis server. Please check your network or API configuration.";
  }
};
