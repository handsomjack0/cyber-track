
import { TelegramConfig } from '../../types';

export const sendTelegramTestMessage = async (config: TelegramConfig): Promise<boolean> => {
  if (!config.chatId) {
    throw new Error('Missing Chat ID');
  }

  // Call our own backend function (Cloudflare Pages Function)
  // The Bot Token is injected on the server side via environment variables
  const url = '/api/telegram';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatId: config.chatId,
        message: '🔔 <b>CloudTrack</b>: 这是一个测试通知。\n您的配置已成功连接 Cloudflare Pages Functions！'
      })
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.description || 'Failed to send message via Backend');
    }
    return true;
  } catch (error) {
    console.error('Telegram Service Error:', error);
    throw error;
  }
};
