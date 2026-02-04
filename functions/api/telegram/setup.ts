
import { Env } from '../../utils/storage';
import { setWebhook, setMyCommands, BotCommand } from '../../services/telegram/client';

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

    // 3. Call Telegram API (Webhook)
    const result = await setWebhook(env.TELEGRAM_BOT_TOKEN, webhookUrl);

    if (!result.ok) {
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // 4. Register bot commands for Telegram "/" menu
    const commands: BotCommand[] = [
      { command: 'start', description: '绑定账户并查看 Chat ID' },
      { command: 'help', description: '查看所有可用指令' },
      { command: 'status', description: '资产概览与到期提醒' },
      { command: 'expiring', description: '查看 30 天内到期资源' },
      { command: 'list', description: '列出全部资源' },
      { command: 'vps', description: '列出 VPS 资源' },
      { command: 'domains', description: '列出域名资源' },
      { command: 'accounts', description: '列出账号资源' },
      { command: 'cellphones', description: '列出手机号码资源' },
      { command: 'search', description: '搜索资源：/search 关键词' }
    ];

    const commandsResult = await setMyCommands(env.TELEGRAM_BOT_TOKEN, commands);

    const responseBody = {
      ok: true,
      webhook: result,
      commands: commandsResult
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
