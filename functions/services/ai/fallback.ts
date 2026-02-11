import { GoogleGenAI } from '@google/genai';
import { Env } from '../../utils/storage';
import {
  AiProvider,
  DEFAULT_MODELS,
  getAiRuntimeSettings,
  getDefaultProvider,
  getProviderModelFallbacks,
  resolveProviderCandidates
} from './config';
import { callOpenAICompatible, withTimeout } from './client';

type RunAiWithFallbackParams = {
  env: Env;
  prompt: string;
  preferredProvider?: AiProvider;
  preferredModel?: string;
  customId?: string;
  maxTokens?: number;
};

type RunAiWithFallbackResult = {
  text: string;
  provider: AiProvider;
  model: string;
};

const ALL_PROVIDERS: AiProvider[] = ['openai', 'deepseek', 'openrouter', 'github', 'custom', 'gemini'];

const makeProviderOrder = (env: Env, preferred?: AiProvider) => {
  const primary = preferred || getDefaultProvider(env);
  return [primary, ...ALL_PROVIDERS.filter((p) => p !== primary)];
};

const isFailoverWorthyError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  return (
    lower.includes('timed out') ||
    lower.includes('(429)') ||
    lower.includes('rate limit') ||
    lower.includes('(503)') ||
    lower.includes('service unavailable') ||
    lower.includes('model_not_found') ||
    lower.includes('model not found') ||
    lower.includes('no available distributor') ||
    lower.includes('distributor') ||
    lower.includes('network')
  );
};

export async function runAiWithFallback(params: RunAiWithFallbackParams): Promise<RunAiWithFallbackResult> {
  const { env, prompt, preferredProvider, preferredModel, customId, maxTokens } = params;
  const runtime = getAiRuntimeSettings(env, maxTokens ? { maxTokens } : undefined);
  const providerOrder = makeProviderOrder(env, preferredProvider);
  const candidates = resolveProviderCandidates(env, providerOrder, {
    model: preferredModel,
    customId
  });

  if (candidates.length === 0) {
    throw new Error('No available AI provider configured');
  }

  let lastError: unknown = null;

  for (const candidate of candidates) {
    const modelCandidates = getProviderModelFallbacks(
      candidate.provider,
      env,
      candidate.provider === preferredProvider ? preferredModel : undefined,
      candidate.modelFallbacks
    );
    const models = modelCandidates.length ? modelCandidates : [candidate.model || DEFAULT_MODELS[candidate.provider]];

    for (const model of models) {
      try {
        if (candidate.kind === 'gemini') {
          const ai = new GoogleGenAI({ apiKey: candidate.apiKey! });
          const response = (await withTimeout(
            ai.models.generateContent({
              model,
              contents: prompt
            }),
            runtime.timeoutMs
          )) as Awaited<ReturnType<typeof ai.models.generateContent>>;

          return {
            text: response.text || '',
            provider: candidate.provider,
            model
          };
        }

        const text = await callOpenAICompatible({
          url: candidate.url!,
          apiKey: candidate.apiKey,
          model,
          prompt,
          extraHeaders: candidate.extraHeaders,
          mode: candidate.mode,
          timeoutMs: runtime.timeoutMs,
          retries: runtime.retries,
          retryDelayMs: runtime.retryDelayMs,
          temperature: runtime.temperature,
          maxTokens: runtime.maxTokens
        });

        return { text, provider: candidate.provider, model };
      } catch (error) {
        lastError = error;
        if (!isFailoverWorthyError(error)) {
          // still continue to maximize availability, but mark explicitly
          console.warn('[ai:fallback] non-failover error, trying next candidate', {
            provider: candidate.provider,
            model,
            error: error instanceof Error ? error.message : String(error)
          });
        } else {
          console.warn('[ai:fallback] failover to next candidate', {
            provider: candidate.provider,
            model,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }
  }

  if (lastError) throw lastError;
  throw new Error('AI fallback failed without explicit error');
}
