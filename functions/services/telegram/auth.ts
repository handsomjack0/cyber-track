
import { Env, getSettings } from '../../utils/storage';

/**
 * Checks if the sender is authorized to use the bot.
 * Compares the sender's chatId with the one stored in KV settings.
 */
export async function isAuthorized(env: Env, chatId: number): Promise<boolean> {
  const settings = await getSettings(env);
  
  // If no chat ID is configured in settings, we default to blocking logic,
  // EXCEPT for /start command which might be used to retrieve the ID.
  // But strictly speaking, for authorization, we match against config.
  
  if (!settings.telegram.chatId) {
    return false; 
  }

  // Convert both to string for safe comparison
  return String(settings.telegram.chatId) === String(chatId);
}
