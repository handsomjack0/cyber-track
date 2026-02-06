
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

    const data = await response.json() as TelegramApiResponse;
    if (!response.ok || !data.ok) {
      console.error('Telegram API sendMessage failed', {
        status: response.status,
        description: data.description
      });
    }
    return data;
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
    const data = await response.json() as TelegramApiResponse;
    if (!response.ok || !data.ok) {
      console.error('Telegram setWebhook failed', {
        status: response.status,
        description: data.description
      });
    }
    return data;
  } catch (error) {
    console.error('Telegram Webhook Error:', error);
    return { ok: false, description: String(error) };
  }
}

export interface BotCommand {
  command: string;
  description: string;
}

export interface BotCommandScope {
  type:
    | 'default'
    | 'all_private_chats'
    | 'all_group_chats'
    | 'all_chat_administrators'
    | 'chat'
    | 'chat_administrators'
    | 'chat_member';
  chat_id?: number | string;
  user_id?: number;
}

export interface BotCommandOptions {
  scope?: BotCommandScope;
  language_code?: string;
}

export interface WebhookInfo {
  url?: string;
  has_custom_certificate?: boolean;
  pending_update_count?: number;
  last_error_date?: number;
  last_error_message?: string;
  max_connections?: number;
  ip_address?: string;
}

/**
 * Register bot commands so Telegram can show the "/" command menu.
 */
export async function setMyCommands(
  token: string,
  commands: BotCommand[],
  options: BotCommandOptions = {}
): Promise<TelegramApiResponse> {
  const url = getApiUrl(token, 'setMyCommands');
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands, ...options })
    });
    const data = await response.json() as TelegramApiResponse;
    if (!response.ok || !data.ok) {
      console.error('Telegram setMyCommands failed', {
        status: response.status,
        description: data.description
      });
    }
    return data;
  } catch (error) {
    console.error('Telegram setMyCommands Error:', error);
    return { ok: false, description: String(error) };
  }
}

/**
 * Fetch current bot commands.
 */
export async function getMyCommands(
  token: string,
  options: BotCommandOptions = {}
): Promise<TelegramApiResponse> {
  const url = getApiUrl(token, 'getMyCommands');
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...options })
    });
    const data = await response.json() as TelegramApiResponse;
    if (!response.ok || !data.ok) {
      console.error('Telegram getMyCommands failed', {
        status: response.status,
        description: data.description
      });
    }
    return data;
  } catch (error) {
    console.error('Telegram getMyCommands Error:', error);
    return { ok: false, description: String(error) };
  }
}

/**
 * Fetch current webhook info for debugging.
 */
export async function getWebhookInfo(token: string): Promise<TelegramApiResponse<WebhookInfo>> {
  const url = getApiUrl(token, 'getWebhookInfo');
  try {
    const response = await fetch(url);
    const data = await response.json() as TelegramApiResponse<WebhookInfo>;
    if (!response.ok || !data.ok) {
      console.error('Telegram getWebhookInfo failed', {
        status: response.status,
        description: data.description
      });
    }
    return data;
  } catch (error) {
    console.error('Telegram getWebhookInfo Error:', error);
    return { ok: false, description: String(error) };
  }
}
