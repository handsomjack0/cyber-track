import { Env, Resource, AppSettings } from '../../utils/storage';
import { sendMessage } from '../telegram/client';

interface NotificationResult {
  success: boolean;
  channels: string[];
  error?: string;
}

export async function sendResourceNotification(
  env: Env, 
  resource: Resource, 
  daysRemaining: number, 
  settings: AppSettings
): Promise<NotificationResult> {
  const channelsSent: string[] = [];
  
  // 1. Determine effective configuration
  // If resource has overrides, use them. Otherwise use global.
  const resSettings = resource.notificationSettings;
  const isGlobal = resSettings?.useGlobal ?? true;
  
  // Check if notification is enabled for this resource
  if (resSettings && resSettings.enabled === false) {
    return { success: false, channels: [], error: 'Notifications disabled for this resource' };
  }

  // Determine enabled channels
  const useTelegram = isGlobal ? settings.telegram.enabled : resSettings?.channels?.telegram;
  const useWebhook = isGlobal ? settings.webhook.enabled : resSettings?.channels?.webhook;

  // Prepare Message Content
  const title = `⚠️ <b>续费提醒: ${resource.name}</b>`;
  const status = daysRemaining < 0 ? `已过期 ${Math.abs(daysRemaining)} 天` : `剩余 ${daysRemaining} 天`;
  const message = `${title}\n\n` +
                  `📦 <b>资产:</b> ${resource.name}\n` +
                  `🏢 <b>服务商:</b> ${resource.provider}\n` +
                  `⏳ <b>状态:</b> ${status}\n` +
                  `📅 <b>到期日:</b> ${resource.expiryDate}\n` +
                  `💰 <b>费用:</b> ${resource.currency}${resource.cost}\n\n` +
                  `请及时处理续费以免服务中断。`;

  // 2. Send via Telegram
  if (useTelegram && settings.telegram.chatId && env.TELEGRAM_BOT_TOKEN) {
    try {
      await sendMessage(env.TELEGRAM_BOT_TOKEN, {
        chat_id: settings.telegram.chatId,
        text: message,
        parse_mode: 'HTML'
      });
      channelsSent.push('Telegram');
    } catch (e) {
      console.error('Telegram send failed', e);
    }
  }

  // 3. Send via Webhook
  if (useWebhook && settings.webhook.url) {
    try {
      await fetch(settings.webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'expiration_alert',
          resource: resource,
          days_remaining: daysRemaining,
          message: message.replace(/<[^>]*>/g, '') // Strip HTML for plain text webhook
        })
      });
      channelsSent.push('Webhook');
    } catch (e) {
      console.error('Webhook send failed', e);
    }
  }

  return {
    success: channelsSent.length > 0,
    channels: channelsSent
  };
}
