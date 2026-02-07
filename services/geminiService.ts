import { Resource } from "../types/index";
import { ApiError, requestJson } from "../utils/apiClient";

export type AiProvider = 'openai' | 'deepseek' | 'openrouter' | 'github' | 'custom' | 'gemini';

const getHeaders = () => ({
  'Content-Type': 'application/json'
});

export const analyzePortfolio = async (
  resources: Resource[],
  provider: AiProvider,
  model: string
): Promise<string> => {
  try {
    const response = await requestJson<{ analysis?: string; error?: string }>(
      '/api/ai/analyze',
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ resources, provider, model }),
        timeoutMs: 30000
      }
    );

    if (response.data?.analysis) return response.data.analysis;
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
