import { GoogleGenAI } from '@google/genai';
import { Env, getResources, Resource } from '../../../utils/storage';
import { sendMessage } from '../client';

type AiProvider = 'openai' | 'deepseek' | 'openrouter' | 'github' | 'custom' | 'gemini';
const AI_PROVIDERS: AiProvider[] = ['openai', 'deepseek', 'openrouter', 'github', 'custom', 'gemini'];

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

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
}) {
  const { url, apiKey, model, prompt, extraHeaders } = params;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      ...(extraHeaders || {})
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a helpful IT asset advisor.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI request failed (${response.status}): ${text || response.statusText}`);
  }

  const data = await response.json() as ChatCompletionResponse;
  const text = data?.choices?.[0]?.message?.content;
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
      if (!env.CUSTOM_AI_BASE_URL) return null;
      const raw = env.CUSTOM_AI_BASE_URL.trim();
      const base = raw.replace(/\/$/, '');
      const hasFullEndpoint = /\/chat\/completions$/i.test(base);
      const url = hasFullEndpoint ? base : `${base}/v1/chat/completions`;
      return {
        provider,
        model: 'gpt-4o-mini',
        apiKey: env.CUSTOM_AI_API_KEY,
        url
      };
    }
    case 'gemini':
      if (!env.API_KEY) return null;
      return { provider, model: 'gemini-1.5-flash', apiKey: env.API_KEY };
    default:
      return null;
  }
}

function pickProvider(env: Env, preferred?: AiProvider) {
  if (preferred) {
    return buildProviderConfig(env, preferred);
  }
  for (const p of AI_PROVIDERS) {
    const found = buildProviderConfig(env, p);
    if (found) return found;
  }
  return null;
}

function parseAiCommand(text: string) {
  const parts = text.trim().split(' ').filter(Boolean);
  const isCommand = parts[0]?.toLowerCase() === '/ai';
  if (!isCommand) return { provider: undefined, model: undefined, question: text, list: false };

  const secondRaw = parts[1]?.toLowerCase();
  if (secondRaw === 'list') {
    return { provider: undefined, model: undefined, question: '', list: true };
  }

  const second = secondRaw;
  if (second && (AI_PROVIDERS as string[]).includes(second)) {
    const provider = second as AiProvider;
    const model = parts[2];
    const question = parts.slice(3).join(' ');
    return { provider, model, question, list: false };
  }

  const question = parts.slice(1).join(' ');
  return { provider: undefined, model: undefined, question, list: false };
}

export async function handleAiMessage(
  env: Env,
  chatId: number,
  userText: string,
  options: { source: 'chat' | 'command' } = { source: 'chat' }
) {
  const parsed = options.source === 'command'
    ? parseAiCommand(userText)
    : { provider: undefined, model: undefined, question: userText, list: false };

  if (options.source === 'command' && parsed.list) {
    const defaultProvider = env.TELEGRAM_AI_PROVIDER || 'auto';
    const defaultModel = env.TELEGRAM_AI_MODEL || 'auto';
    await sendMessage(env.TELEGRAM_BOT_TOKEN!, {
      chat_id: chatId,
      text: `当前默认：${defaultProvider} / ${defaultModel}\n可用 provider：${AI_PROVIDERS.join(', ')}`
    });
    return;
  }

  const preferredProvider = parsed.provider || env.TELEGRAM_AI_PROVIDER;
  const picked = pickProvider(env, preferredProvider);
  const question = parsed.question?.trim();

  if (!picked) {
    await sendMessage(env.TELEGRAM_BOT_TOKEN!, {
      chat_id: chatId,
      text: 'AI 未配置。请在环境变量中设置可用的 API Key，并可选设置 TELEGRAM_AI_PROVIDER/TELEGRAM_AI_MODEL。'
    });
    return;
  }

  if (options.source === 'command' && !question) {
    await sendMessage(env.TELEGRAM_BOT_TOKEN!, {
      chat_id: chatId,
      text: '用法：/ai <问题> 或 /ai <provider> <model> <问题>\n示例：/ai openai gpt-4o-mini 哪些资产快到期？\n查看默认：/ai list'
    });
    return;
  }

  if (parsed.provider && parsed.provider !== picked.provider) {
    await sendMessage(env.TELEGRAM_BOT_TOKEN!, {
      chat_id: chatId,
      text: `未配置 ${parsed.provider} 的 Key，请换其他 provider。`
    });
    return;
  }

  try {
    const resources = await getResources(env);
    const prompt = buildPrompt(resources, question || '');
    let reply = '';
    const model = parsed.model || env.TELEGRAM_AI_MODEL || picked.model;

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
        extraHeaders: picked.extraHeaders
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
