import { GoogleGenAI } from '@google/genai';
import { Env, getResources, Resource } from '../../../utils/storage';
import { editMessageText, sendChatAction, sendMessage } from '../client';
import { AiProvider, getAiRuntimeSettings, pickFirstAvailableProvider } from '../../../services/ai/config';
import { callOpenAICompatible, withTimeout } from '../../../services/ai/client';

const AI_PROVIDERS: AiProvider[] = ['openai', 'deepseek', 'openrouter', 'github', 'custom', 'gemini'];

const toCompactResources = (resources: Resource[]) =>
  resources.slice(0, 80).map((r) => ({
    id: r.id,
    name: r.name,
    provider: r.provider,
    type: r.type,
    expiryDate: r.expiryDate,
    cost: r.cost,
    currency: r.currency,
    billingCycle: r.billingCycle,
    autoRenew: r.autoRenew,
    tags: r.tags || [],
    status: r.status
  }));

const buildPrompt = (resources: Resource[], userText: string) => `
You are the cyberTrack Telegram assistant. You help the user understand and manage IT assets.

Resources (JSON, compact):
${JSON.stringify(toCompactResources(resources))}

User question:
${userText}

Rules:
- Reply in concise, friendly Chinese.
- Keep answers short (3-8 lines, max ~220 Chinese chars).
- If the question is about assets, use the data above.
- Only suggest existing commands: /status /expiring /list /search /detail /vps /domains /accounts /cellphones /help.
- Do not include JSON in the response.
`;

const hasCustomConfig = (env: Env) =>
  Boolean(env.CUSTOM_AI_ENDPOINTS?.trim()) ||
  Boolean(env.CUSTOM_AI_ENDPOINT?.trim()) ||
  Boolean(env.CUSTOM_AI_BASE_URL?.trim());

const getPreferredOrder = (env: Env) => {
  const defaultProvider = env.AI_DEFAULT_PROVIDER as AiProvider | undefined;
  if (defaultProvider) {
    return [defaultProvider, ...AI_PROVIDERS.filter((p) => p !== defaultProvider)] as AiProvider[];
  }
  if (hasCustomConfig(env)) {
    return ['custom', ...AI_PROVIDERS.filter((p) => p !== 'custom')] as AiProvider[];
  }
  return AI_PROVIDERS;
};

function parseAiCommand(text: string) {
  const parts = text.trim().split(' ').filter(Boolean);
  const isCommand = parts[0]?.toLowerCase() === '/ai';
  if (!isCommand) return { question: text, list: false };

  const secondRaw = parts[1]?.toLowerCase();
  if (secondRaw === 'list') {
    return { question: '', list: true };
  }

  const question = parts.slice(1).join(' ');
  return { question, list: false };
}

const pickTelegramAiErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes('timed out')) {
    return 'AI 响应超时。请稍后重试，或提问更简短的问题。';
  }
  if (lower.includes('model_not_found') || lower.includes('model not found')) {
    return 'AI 模型不可用。请检查模型配置，或切换模型后重试。';
  }
  if (lower.includes('no available distributor') || lower.includes('distributor')) {
    return 'AI 上游渠道当前不可用。请稍后重试，或更换模型。';
  }
  if (lower.includes('(429)') || lower.includes('rate limit')) {
    return 'AI 请求过于频繁（限流）。请稍后再试。';
  }

  return 'AI 暂时不可用，请稍后重试，或先使用 /status /help 等指令。';
};

export async function handleAiMessage(
  env: Env,
  chatId: number,
  userText: string,
  options: { source: 'chat' | 'command' } = { source: 'chat' }
) {
  let typing = true;
  let progressMessageId: number | null = null;

  const typingLoop = (async () => {
    while (typing) {
      try {
        await sendChatAction(env.TELEGRAM_BOT_TOKEN!, chatId, 'typing');
      } catch {
        // ignore typing indicator failures
      }
      await new Promise((resolve) => setTimeout(resolve, 4000));
    }
  })();

  const sendOrEdit = async (text: string) => {
    if (progressMessageId !== null) {
      const edited = await editMessageText(env.TELEGRAM_BOT_TOKEN!, {
        chat_id: chatId,
        message_id: progressMessageId,
        text,
        disable_web_page_preview: true
      });
      if (edited.ok) return;
    }

    await sendMessage(env.TELEGRAM_BOT_TOKEN!, {
      chat_id: chatId,
      text,
      disable_web_page_preview: true
    });
  };

  try {
    const parsed = options.source === 'command' ? parseAiCommand(userText) : { question: userText, list: false };

    if (options.source === 'command' && parsed.list) {
      await sendMessage(env.TELEGRAM_BOT_TOKEN!, {
        chat_id: chatId,
        text: '当前 TGbot 使用与面板一致的 AI 配置（不再单独区分）。'
      });
      return;
    }

    const picked = pickFirstAvailableProvider(env, getPreferredOrder(env));
    const question = parsed.question?.trim();

    if (!picked) {
      await sendMessage(env.TELEGRAM_BOT_TOKEN!, {
        chat_id: chatId,
        text: 'AI 未配置。请在环境变量中设置可用的 API Key 或自建通道配置。'
      });
      return;
    }

    if (options.source === 'command' && !question) {
      await sendMessage(env.TELEGRAM_BOT_TOKEN!, {
        chat_id: chatId,
        text: '用法：/ai <问题>\n示例：/ai 哪些资产快到期？'
      });
      return;
    }

    const progress = await sendMessage(env.TELEGRAM_BOT_TOKEN!, {
      chat_id: chatId,
      text: '🛰 已收到，正在整理数据并生成回复...',
      disable_web_page_preview: true
    });
    progressMessageId = progress.result?.message_id ?? null;

    const resources = await getResources(env);
    const prompt = buildPrompt(resources, question || '');
    const runtime = getAiRuntimeSettings(env, { maxTokens: 500 });
    let reply = '';

    if (picked.kind === 'gemini') {
      const ai = new GoogleGenAI({ apiKey: picked.apiKey! });
      const response = (await withTimeout(
        ai.models.generateContent({
          model: picked.model,
          contents: prompt
        }),
        runtime.timeoutMs
      )) as Awaited<ReturnType<typeof ai.models.generateContent>>;
      reply = response.text || '';
    } else {
      const runWithModel = (model: string) =>
        callOpenAICompatible({
          url: picked.url!,
          apiKey: picked.apiKey,
          model,
          prompt,
          extraHeaders: picked.extraHeaders,
          mode: picked.mode,
          timeoutMs: runtime.timeoutMs,
          retries: runtime.retries,
          retryDelayMs: runtime.retryDelayMs,
          temperature: runtime.temperature,
          maxTokens: runtime.maxTokens
        });

      try {
        reply = await runWithModel(picked.model);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        const lower = message.toLowerCase();
        const needsModelFallback =
          picked.provider === 'custom' &&
          (lower.includes('model_not_found') ||
            lower.includes('model not found') ||
            lower.includes('no available distributor') ||
            lower.includes('distributor'));

        if (!needsModelFallback) throw e;

        const fallbackModels = [
          env.AI_CUSTOM_MODEL,
          env.AI_DEFAULT_MODEL,
          'deepseek-chat',
          'DeepSeek-V3.1-cb',
          'deepseek-reasoner'
        ].filter((v, i, arr): v is string => Boolean(v && arr.indexOf(v) === i));

        let success = false;
        for (const fallbackModel of fallbackModels) {
          try {
            reply = await runWithModel(fallbackModel);
            success = true;
            break;
          } catch {
            // continue
          }
        }
        if (!success) throw e;
      }
    }

    const safeReply = reply?.trim();
    if (!safeReply) {
      await sendOrEdit('AI 返回为空，请检查模型名或接口路径是否正确（chat/completions vs completions）。');
      return;
    }

    await sendOrEdit(safeReply);
  } catch (error) {
    console.error('Telegram AI Error:', error);
    await sendOrEdit(pickTelegramAiErrorMessage(error));
  } finally {
    typing = false;
    void typingLoop;
  }
}
