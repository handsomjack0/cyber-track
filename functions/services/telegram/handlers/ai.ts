import { GoogleGenAI } from '@google/genai';
import { Env, getResources, Resource } from '../../../utils/storage';
import { sendMessage } from '../client';

type AiProvider = 'openai' | 'deepseek' | 'openrouter' | 'github' | 'custom' | 'gemini';
const AI_PROVIDERS: AiProvider[] = ['openai', 'deepseek', 'openrouter', 'github', 'custom', 'gemini'];

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string }; text?: string }>;
}

type CustomEndpoint = {
  id: string;
  url: string;
  key?: string;
  defaultModel?: string;
};

const parseCustomEndpoints = (raw?: string): CustomEndpoint[] => {
  if (!raw) return [];
  return raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [id, url, key, defaultModel] = line.split('|').map(s => s?.trim());
      if (!id || !url) return null;
      return { id, url, key, defaultModel };
    })
    .filter((v): v is CustomEndpoint => Boolean(v));
};

const buildPrompt = (resources: Resource[], userText: string) => `
You are the cyberTrack Telegram assistant. You help the user understand and manage IT assets.

Resources (JSON):
${JSON.stringify(resources)}

User question:
${userText}

Rules:
- Reply in concise, friendly Chinese.
- Keep answers short (3-8 lines).
- If the question is about assets, use the data above.
- If you need a command for details, suggest the relevant slash command.
- Do not include JSON in the response.
`;

async function callOpenAICompatible(params: {
  url: string;
  apiKey?: string;
  model: string;
  prompt: string;
  extraHeaders?: Record<string, string>;
  mode?: 'chat' | 'completion';
}) {
  const { url, apiKey, model, prompt, extraHeaders } = params;
  const mode = params.mode ?? 'chat';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      ...(extraHeaders || {})
    },
    body: JSON.stringify(
      mode === 'chat'
        ? {
            model,
            messages: [
              { role: 'system', content: 'You are a helpful IT asset advisor.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.4,
            max_tokens: 500
          }
        : {
            model,
            prompt,
            temperature: 0.4,
            max_tokens: 500
          }
    )
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI request failed (${response.status}): ${text || response.statusText}`);
  }

  const data = (await response.json()) as ChatCompletionResponse;
  const text = mode === 'chat' ? data?.choices?.[0]?.message?.content : data?.choices?.[0]?.text;
  return text || '';
}

function buildProviderConfig(env: Env, provider: AiProvider) {
  switch (provider) {
    case 'openai':
      if (!env.OPENAI_API_KEY) return null;
      return { provider, model: 'gpt-4o-mini', apiKey: env.OPENAI_API_KEY, url: 'https://api.openai.com/v1/chat/completions' };
    case 'deepseek':
      if (!env.DEEPSEEK_API_KEY) return null;
      return { provider, model: 'deepseek-chat', apiKey: env.DEEPSEEK_API_KEY, url: 'https://api.deepseek.com/chat/completions' };
    case 'openrouter':
      if (!env.OPENROUTER_API_KEY) return null;
      return {
        provider,
        model: 'openai/gpt-4o-mini',
        apiKey: env.OPENROUTER_API_KEY,
        url: 'https://openrouter.ai/api/v1/chat/completions',
        extraHeaders: {
          ...(env.OPENROUTER_SITE_URL ? { 'HTTP-Referer': env.OPENROUTER_SITE_URL } : {}),
          ...(env.OPENROUTER_APP_TITLE ? { 'X-Title': env.OPENROUTER_APP_TITLE } : {})
        }
      };
    case 'github':
      if (!env.GITHUB_TOKEN || !env.GITHUB_MODELS_URL) return null;
      return {
        provider,
        model: 'gpt-4o-mini',
        apiKey: env.GITHUB_TOKEN,
        url: env.GITHUB_MODELS_URL,
        extraHeaders: { Accept: 'application/vnd.github+json' }
      };
    case 'custom': {
      const endpoints = parseCustomEndpoints(env.CUSTOM_AI_ENDPOINTS);
      if (endpoints.length > 0) {
        const selected = endpoints[0];
        const mode = /\/chat\/completions$/i.test(selected.url) ? 'chat' : 'completion';
        return {
          provider,
          model: selected.defaultModel || 'gpt-4o-mini',
          apiKey: selected.key || env.CUSTOM_AI_API_KEY,
          url: selected.url,
          mode
        };
      }

      if (!env.CUSTOM_AI_BASE_URL && !env.CUSTOM_AI_ENDPOINT) return null;
      const rawEndpoint = env.CUSTOM_AI_ENDPOINT?.trim();
      const rawBase = env.CUSTOM_AI_BASE_URL?.trim();
      let url = '';
      if (rawEndpoint) {
        url = rawEndpoint;
      } else if (rawBase) {
        const base = rawBase.replace(/\/$/, '');
        const hasFullEndpoint = /\/(chat\/completions|completions)$/i.test(base);
        url = hasFullEndpoint ? base : `${base}/v1/chat/completions`;
      }
      const mode = /\/chat\/completions$/i.test(url) ? 'chat' : 'completion';
      return {
        provider,
        model: 'gpt-4o-mini',
        apiKey: env.CUSTOM_AI_API_KEY,
        url,
        mode
      };
    }
    case 'gemini':
      if (!env.API_KEY) return null;
      return { provider, model: 'gemini-1.5-flash', apiKey: env.API_KEY };
    default:
      return null;
  }
}

function pickProvider(env: Env) {
  for (const p of AI_PROVIDERS) {
    const found = buildProviderConfig(env, p);
    if (found) return found;
  }
  return null;
}

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

export async function handleAiMessage(
  env: Env,
  chatId: number,
  userText: string,
  options: { source: 'chat' | 'command' } = { source: 'chat' }
) {
  const parsed = options.source === 'command'
    ? parseAiCommand(userText)
    : { question: userText, list: false };

  if (options.source === 'command' && parsed.list) {
    await sendMessage(env.TELEGRAM_BOT_TOKEN!, {
      chat_id: chatId,
      text: `当前 TGbot 使用与面板一致的 AI 配置（不再单独区分）。`
    });
    return;
  }

  const picked = pickProvider(env);
  const question = parsed.question?.trim();

  if (!picked) {
    await sendMessage(env.TELEGRAM_BOT_TOKEN!, {
      chat_id: chatId,
      text: 'AI 未配置。请在环境变量中设置可用的 API Key 或自建公益站配置。'
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

  try {
    const resources = await getResources(env);
    const prompt = buildPrompt(resources, question || '');
    let reply = '';
    const model = picked.model;

    if (picked.provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey: picked.apiKey! });
      const response = await ai.models.generateContent({
        model,
        contents: prompt
      });
      reply = response.text || '';
    } else {
      reply = await callOpenAICompatible({
        url: picked.url!,
        apiKey: picked.apiKey,
        model,
        prompt,
        extraHeaders: picked.extraHeaders,
        mode: (picked as any).mode
      });
    }

    const safeReply = reply?.trim() || '抱歉，我暂时没有找到合适的答复。你可以试试 /help 或 /status。';
    await sendMessage(env.TELEGRAM_BOT_TOKEN!, { chat_id: chatId, text: safeReply });
  } catch (error) {
    console.error('Telegram AI Error:', error);
    await sendMessage(env.TELEGRAM_BOT_TOKEN!, {
      chat_id: chatId,
      text: 'AI 暂时不可用，请稍后重试，或使用 /help /status 等指令。'
    });
  }
}
