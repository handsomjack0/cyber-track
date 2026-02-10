import { Env, checkAuth } from '../../utils/storage';
import { setWebhook, setMyCommands, BotCommand, getMyCommands } from '../../services/telegram/client';

interface SetupRequest {
  origin: string; // The website's current base URL (e.g., https://myapp.pages.dev)
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  if (!checkAuth(request, env)) {
    return new Response(JSON.stringify({ ok: false, description: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 1. Security Check
  if (!env.TELEGRAM_BOT_TOKEN) {
    return new Response(JSON.stringify({
      ok: false,
      description: 'Server Error: TELEGRAM_BOT_TOKEN is not configured.'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const body = await request.json() as SetupRequest;

    if (!body.origin) {
      return new Response(JSON.stringify({ ok: false, description: "Missing 'origin' in request body." }), { status: 400 });
    }

    // 2. Construct Webhook URL
    // Prefer server-side override to avoid binding to localhost by mistake.
    const rawBase = (env.PUBLIC_SITE_URL || body.origin || '').trim();
    if (!rawBase) {
      return new Response(JSON.stringify({ ok: false, description: "Missing webhook base URL." }), { status: 400 });
    }

    let baseUrl = rawBase.replace(/\/$/, '');
    try {
      const parsed = new URL(baseUrl);
      const host = parsed.hostname.toLowerCase();
      if (host === 'localhost' || host === '127.0.0.1') {
        return new Response(JSON.stringify({
          ok: false,
          description: 'Webhook URL cannot be localhost. Please run this on a public domain or set PUBLIC_SITE_URL.'
        }), { status: 400 });
      }
    } catch {
      return new Response(JSON.stringify({
        ok: false,
        description: 'Invalid webhook base URL. Please check PUBLIC_SITE_URL or the client origin.'
      }), { status: 400 });
    }

    const webhookUrl = `${baseUrl}/api/webhook`;

    // 3. Call Telegram API (Webhook)
    const result = await setWebhook(env.TELEGRAM_BOT_TOKEN, webhookUrl, env.TELEGRAM_WEBHOOK_SECRET);

    if (!result.ok) {
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // 4. Register bot commands for Telegram "/" menu
    const commands: BotCommand[] = [
      { command: 'start', description: 'Bind account and show Chat ID' },
      { command: 'help', description: 'Show all commands' },
      { command: 'status', description: 'Asset overview and expirations' },
      { command: 'expiring', description: 'Assets expiring in 30 days' },
      { command: 'list', description: 'List all assets' },
      { command: 'detail', description: 'View asset details: /detail keyword' },
      { command: 'ai', description: 'AI Q&A' },
      { command: 'vps', description: 'List VPS assets' },
      { command: 'domains', description: 'List domain assets' },
      { command: 'accounts', description: 'List account assets' },
      { command: 'cellphones', description: 'List phone number assets' },
      { command: 'search', description: 'Search assets: /search keyword' }
    ];

    // Register commands in multiple scopes to avoid client-side menu inconsistencies
    const commandsDefault = await setMyCommands(env.TELEGRAM_BOT_TOKEN, commands, { scope: { type: 'default' } });
    const commandsPrivate = await setMyCommands(env.TELEGRAM_BOT_TOKEN, commands, { scope: { type: 'all_private_chats' } });
    const commandsGroup = await setMyCommands(env.TELEGRAM_BOT_TOKEN, commands, { scope: { type: 'all_group_chats' } });

    // Fetch back for verification
    const currentDefault = await getMyCommands(env.TELEGRAM_BOT_TOKEN, { scope: { type: 'default' } });
    const currentPrivate = await getMyCommands(env.TELEGRAM_BOT_TOKEN, { scope: { type: 'all_private_chats' } });

    const responseBody = {
      ok: true,
      webhook: result,
      commands: {
        default: commandsDefault,
        private: commandsPrivate,
        group: commandsGroup,
        current: {
          default: currentDefault,
          private: currentPrivate
        }
      }
    };

    return new Response(JSON.stringify(responseBody), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    return new Response(JSON.stringify({ ok: false, description: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
