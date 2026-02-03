
import { SendMessagePayload, TelegramApiResponse } from './types';

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

/**
 * Send a message to a Telegram chat
 */
export async function sendMessage(token: string, payload: SendMessagePayload): Promise<TelegramApiResponse> {
  const url = `${TELEGRAM_API_BASE}${token}/sendMessage`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return await response.json() as TelegramApiResponse;
  } catch (error) {
    console.error('Telegram API Error:', error);
    return { ok: false, description: String(error) };
  }
}

/**
 * Set webhook for the bot
 */
export async function setWebhook(token: string, webhookUrl: string): Promise<TelegramApiResponse> {
  const url = `${TELEGRAM_API_BASE}${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
  const response = await fetch(url);
  return await response.json() as TelegramApiResponse;
}
