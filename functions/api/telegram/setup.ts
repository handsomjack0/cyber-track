
import { Env } from '../../utils/storage';
import { setWebhook } from '../../services/telegram/client';

interface SetupRequest {
  origin: string; // The website's current base URL (e.g., https://myapp.pages.dev)
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  // 1. Security Check
  if (!env.TELEGRAM_BOT_TOKEN) {
    return new Response(JSON.stringify({ 
      ok: false, 
      description: "Server Error: TELEGRAM_BOT_TOKEN is not configured." 
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const body = await request.json() as SetupRequest;
    
    if (!body.origin) {
      return new Response(JSON.stringify({ ok: false, description: "Missing 'origin' in request body." }), { status: 400 });
    }

    // 2. Construct Webhook URL
    // Ensure no trailing slash on origin and append correct path
    const baseUrl = body.origin.replace(/\/$/, '');
    const webhookUrl = `${baseUrl}/api/webhook`;

    // 3. Call Telegram API
    const result = await setWebhook(env.TELEGRAM_BOT_TOKEN, webhookUrl);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: result.ok ? 200 : 400
    });

  } catch (error) {
    return new Response(JSON.stringify({ ok: false, description: String(error) }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
};
