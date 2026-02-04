import { sendMessage } from '../services/telegram/client';

interface Env {
  TELEGRAM_BOT_TOKEN: string;
}

interface RequestBody {
  chatId: string;
  message?: string;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  // 1. Security Check
  if (!env.TELEGRAM_BOT_TOKEN) {
    return new Response(JSON.stringify({ 
      ok: false, 
      description: "Server Error: TELEGRAM_BOT_TOKEN is not set in Cloudflare Environment Variables." 
    }), { status: 500 });
  }

  try {
    const body = await request.json() as RequestBody;
    const { chatId, message } = body;

    if (!chatId) {
      return new Response(JSON.stringify({ ok: false, description: "Missing chatId" }), { status: 400 });
    }

    const text = message || '🔔 cyberTrack：这是一个测试通知。\n你的配置已成功连接 Cloudflare Pages Functions！';

    // Use the shared client function
    const result = await sendMessage(env.TELEGRAM_BOT_TOKEN, {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    });

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: result.ok ? 200 : 400
    });

  } catch (error) {
    return new Response(JSON.stringify({ ok: false, description: String(error) }), { status: 500 });
  }
};
