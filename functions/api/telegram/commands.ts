import { Env } from '../../utils/storage';
import { getMyCommands } from '../../services/telegram/client';

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { env } = context;

  if (!env.TELEGRAM_BOT_TOKEN) {
    return new Response(JSON.stringify({
      ok: false,
      description: 'Server Error: TELEGRAM_BOT_TOKEN is not configured.'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const [defaultScope, privateScope, groupScope] = await Promise.all([
      getMyCommands(env.TELEGRAM_BOT_TOKEN, { scope: { type: 'default' } }),
      getMyCommands(env.TELEGRAM_BOT_TOKEN, { scope: { type: 'all_private_chats' } }),
      getMyCommands(env.TELEGRAM_BOT_TOKEN, { scope: { type: 'all_group_chats' } })
    ]);

    return new Response(JSON.stringify({
      ok: true,
      commands: {
        default: defaultScope,
        private: privateScope,
        group: groupScope
      }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, description: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
