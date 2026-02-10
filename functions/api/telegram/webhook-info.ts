import { Env, checkAuth } from '../../utils/storage';
import { getWebhookInfo } from '../../services/telegram/client';

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { env, request } = context;
  if (!checkAuth(request, env)) {
    return new Response(JSON.stringify({ ok: false, description: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!env.TELEGRAM_BOT_TOKEN) {
    return new Response(JSON.stringify({
      ok: false,
      description: 'Server Error: TELEGRAM_BOT_TOKEN is not configured.'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const result = await getWebhookInfo(env.TELEGRAM_BOT_TOKEN);
    return new Response(JSON.stringify(result), {
      status: result.ok ? 200 : 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, description: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
