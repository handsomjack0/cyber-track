import { TelegramConfig } from '../../types';

export const sendTelegramTestMessage = async (config: TelegramConfig): Promise<boolean> => {
  if (!config.chatId) {
    throw new Error('Missing Chat ID');
  }

  const url = '/api/telegram';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatId: config.chatId,
        message: '🔔 <b>cyberTrack</b>: 这是一条测试通知。\n已成功连接到 Cloudflare Pages Functions。'
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
