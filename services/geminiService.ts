import { Resource } from '../types/index';
import { ApiError, requestJson } from '../utils/apiClient';

export type AiProvider = 'openai' | 'deepseek' | 'openrouter' | 'github' | 'custom' | 'gemini';

const getHeaders = () => ({
  'Content-Type': 'application/json'
});

const stripReasoningArtifacts = (input: string): string => {
  let text = (input || '').replace(/\r\n/g, '\n');

  text = text.replace(/<think\b[^>]*>[\s\S]*?<\/think>/gi, '');
  text = text.replace(/<thinking\b[^>]*>[\s\S]*?<\/thinking>/gi, '');
  text = text.replace(/```(?:thinking|reasoning|analysis)[\s\S]*?```/gi, '');

  const firstHeadingIdx = text.search(/(^|\n)##\s+/);
  if (firstHeadingIdx > 0) {
    text = text.slice(firstHeadingIdx).trimStart();
  }

  return text.trim();
};

const normalizeAnalysisMarkdown = (input: string): string => {
  let text = stripReasoningArtifacts(input);
  if (!text) {
    return 'The model returned only reasoning draft content. Please switch to a non-reasoning model and retry.';
  }

  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/\|\s+\|\s+/g, '|\n| ');

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
    return 'AI returned empty content. Please check model name or endpoint settings.';
  } catch (error) {
    if (error instanceof ApiError) {
      const code = (error.data as any)?.error_code as string | undefined;
      if (code) {
        switch (code) {
          case 'MISSING_OPENAI_KEY':
            return 'OpenAI key is missing. Set OPENAI_API_KEY or switch provider.';
          case 'MISSING_DEEPSEEK_KEY':
            return 'DeepSeek key is missing. Set DEEPSEEK_API_KEY or switch provider.';
          case 'MISSING_OPENROUTER_KEY':
            return 'OpenRouter key is missing. Set OPENROUTER_API_KEY or switch provider.';
          case 'MISSING_GITHUB_MODELS':
            return 'GitHub Models is not configured. Set GITHUB_TOKEN and GITHUB_MODELS_URL.';
          case 'MISSING_CUSTOM_BASE':
            return 'Custom endpoint base URL is missing. Set CUSTOM_AI_BASE_URL.';
          case 'MISSING_GEMINI_KEY':
            return 'Gemini key is missing. Set API_KEY or switch provider.';
          case 'CUSTOM_ENDPOINT_NOT_FOUND':
            return 'Custom endpoint id not found. Check customId or CUSTOM_AI_ENDPOINTS.';
          case 'AI_MODEL_NOT_FOUND':
            return 'Model not found. Check model name or pick another model.';
          case 'AI_MODEL_UNAVAILABLE':
            return 'Model is currently unavailable upstream. Retry later or switch model/provider.';
          case 'AI_UPSTREAM_UNAVAILABLE':
            return 'Upstream AI service is unavailable (503). Retry later or switch provider.';
          case 'AI_EMPTY_RESPONSE':
            return 'Model returned empty or non-displayable content. Try another model.';
          default:
            return error.message;
        }
      }
      return error.message;
    }

    console.error('AI Service Error:', error);
    return 'Failed to connect to analysis server. Please check your network or API configuration.';
  }
};

export const fetchCustomModels = async (
  customId?: string,
  force?: boolean
): Promise<{ models: string[]; error?: string; cached?: boolean }> => {
  try {
    const response = await requestJson<{ models?: string[]; error?: string; cached?: boolean }>(
      '/api/ai/models',
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ provider: 'custom', customId, force }),
        timeoutMs: 12000,
        throwOnError: false
      }
    );

    if (!response.ok) {
      return { models: [], error: response.data?.error || 'Failed to fetch models.' };
    }

    return {
      models: Array.isArray(response.data?.models) ? response.data.models : [],
      cached: response.data?.cached
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network request failed';
    return { models: [], error: message };
  }
};
