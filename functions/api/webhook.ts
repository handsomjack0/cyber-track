
import { Env } from '../utils/storage';
import { TelegramUpdate } from '../services/telegram/types';
import { processTelegramCommand } from '../services/telegram/dispatcher';

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  // 1. Security Check
  if (!env.TELEGRAM_BOT_TOKEN) {
    return new Response('Server Error: Bot Token Missing', { status: 500 });
  }

  try {
    const reqId = request.headers.get('cf-ray') || 'unknown';
    const update = await request.json() as TelegramUpdate;
    console.log('[tg:webhook] update received', {
      reqId,
      updateId: (update as any)?.update_id,
      hasMessage: Boolean(update.message),
      hasText: Boolean(update.message?.text),
      chatId: update.message?.chat?.id
    });
    
    // 2. Validate Update
    if (!update.message || !update.message.text) {
      console.log('[tg:webhook] ignore non-text message', { reqId });
      return new Response('OK', { status: 200 }); // Ignore non-text messages
    }

    // 3. Process Command
    await processTelegramCommand(env, update.message);

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Webhook Error:', error);
    return new Response('Error processing webhook', { status: 500 });
  }
};
