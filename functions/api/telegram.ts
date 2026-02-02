
interface Env {
  TELEGRAM_BOT_TOKEN: string;
}

interface RequestBody {
  chatId: string;
  message?: string;
}

// Fix: Removed PagesFunction type annotation as it is missing in the environment. Typed context inline.
export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  // 1. Security Check: Ensure the token exists in Cloudflare Environment Variables
  if (!env.TELEGRAM_BOT_TOKEN) {
    return new Response(JSON.stringify({ 
      ok: false, 
      description: "Server Error: TELEGRAM_BOT_TOKEN is not set in Cloudflare Environment Variables." 
    }), { status: 500 });
  }

  try {
    // 2. Parse Request Body
    const body = await request.json() as RequestBody;
    const { chatId, message } = body;

    if (!chatId) {
      return new Response(JSON.stringify({ ok: false, description: "Missing chatId" }), { status: 400 });
    }

    // 3. Construct Telegram API URL
    const text = message || '🔔 CloudTrack: 这是一个测试通知。\n您的配置已成功连接！(来自 Cloudflare Functions)';
    const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;

    // 4. Call Telegram API from the Server Side
    const telegramResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });

    const telegramData = await telegramResponse.json();

    // 5. Return result to frontend
    return new Response(JSON.stringify(telegramData), {
      headers: { 'Content-Type': 'application/json' },
      status: telegramResponse.status
    });

  } catch (error) {
    return new Response(JSON.stringify({ ok: false, description: String(error) }), { status: 500 });
  }
};
