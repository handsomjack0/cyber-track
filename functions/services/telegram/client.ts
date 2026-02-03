
import { SendMessagePayload, TelegramApiResponse } from './types';

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

/**
 * Helper to ensure the token is correctly formatted for the URL.
 * It strips the 'bot' prefix if the user accidentally included it in the env var.
 */
const getApiUrl = (token: string, method: string) => {
  const cleanToken = token.replace(/^bot/i, '');
  return `${TELEGRAM_API_BASE}${cleanToken}/${method}`;
};

/**
 * Send a message to a Telegram chat
 */
export async function sendMessage(token: string, payload: SendMessagePayload): Promise<TelegramApiResponse> {
  const url = getApiUrl(token, 'sendMessage');
  
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
  const url = `${getApiUrl(token, 'setWebhook')}?url=${encodeURIComponent(webhookUrl)}`;
  
  try {
    const response = await fetch(url);
    return await response.json() as TelegramApiResponse;
  } catch (error) {
    console.error('Telegram Webhook Error:', error);
    return { ok: false, description: String(error) };
  }
}
