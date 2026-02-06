import { Env, Resource, AppSettings } from '../../utils/storage';
import { sendMessage } from '../telegram/client';
import { sendEmailResend } from '../email/resend';

interface NotificationResult {
  success: boolean;
  channels: string[];
  error?: string;
}

type ChangeAction = 'created' | 'updated' | 'deleted';

function formatChangeList(changes: string[]) {
  if (changes.length === 0) return '';
  return `\n\n变更项:\n${changes.map(item => `? ${item}`).join('\n')}`;
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
  const useEmail = isGlobal ? settings.email.enabled : resSettings?.channels?.email;
  const useWebhook = isGlobal ? settings.webhook.enabled : resSettings?.channels?.webhook;

  // Prepare Message Content
  const title = `?? <b>续费提醒: ${resource.name}</b>`;
  const status = daysRemaining < 0 ? `已过期 ${Math.abs(daysRemaining)} 天` : `剩余 ${daysRemaining} 天`;
  const message = `${title}\n\n` +
                  `?? <b>资产:</b> ${resource.name}\n` +
                  `??? <b>服务商:</b> ${resource.provider}\n` +
                  `?? <b>状态:</b> ${status}\n` +
                  `?? <b>到期日:</b> ${resource.expiryDate}\n` +
                  `?? <b>费用:</b> ${resource.currency}${resource.cost}\n\n` +
                  `请及时处理续费以避免服务中断。`;

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

  // 3. Send via Email (Resend)
  if (useEmail && settings.email.email && env.RESEND_API_KEY && env.RESEND_FROM) {
    try {
      const subject = `cyberTrack 续费提醒：${resource.name}`;
      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h3>续费提醒：${resource.name}</h3>
          <ul>
            <li><strong>服务商：</strong>${resource.provider}</li>
            <li><strong>状态：</strong>${status}</li>
            <li><strong>到期日：</strong>${resource.expiryDate}</li>
            <li><strong>费用：</strong>${resource.currency}${resource.cost}</li>
          </ul>
          <p>请及时处理续费以避免服务中断。</p>
        </div>
      `;
      const text = `续费提醒：${resource.name}\n服务商：${resource.provider}\n状态：${status}\n到期日：${resource.expiryDate}\n费用：${resource.currency}${resource.cost}\n请及时处理续费以避免服务中断。`;

      await sendEmailResend(env.RESEND_API_KEY, env.RESEND_FROM, {
        to: settings.email.email,
        subject,
        html,
        text
      });
      channelsSent.push('Email');
    } catch (e) {
      console.error('Email send failed', e);
    }
  }

  // 4. Send via Webhook
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

export async function sendResourceChangeNotification(
  env: Env,
  action: ChangeAction,
  resource: Resource,
  settings: AppSettings,
  changes: string[] = []
): Promise<NotificationResult> {
  const channelsSent: string[] = [];

  const resSettings = resource.notificationSettings;
  const isGlobal = resSettings?.useGlobal ?? true;
  if (resSettings && resSettings.enabled === false) {
    return { success: false, channels: [], error: 'Notifications disabled for this resource' };
  }

  const useTelegram = isGlobal ? settings.telegram.enabled : resSettings?.channels?.telegram;
  const useEmail = isGlobal ? settings.email.enabled : resSettings?.channels?.email;
  const useWebhook = isGlobal ? settings.webhook.enabled : resSettings?.channels?.webhook;

  const actionLabel =
    action === 'created' ? '新增' :
    action === 'updated' ? '更新' :
    '删除';

  const message = `?? <b>资源${actionLabel}</b>\n\n` +
                  `?? <b>资产:</b> ${resource.name}\n` +
                  `??? <b>服务商:</b> ${resource.provider}\n` +
                  `?? <b>类型:</b> ${resource.type}\n` +
                  `?? <b>到期日:</b> ${resource.expiryDate || '-'}` +
                  formatChangeList(changes);

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

  if (useEmail && settings.email.email && env.RESEND_API_KEY && env.RESEND_FROM) {
    try {
      const subject = `cyberTrack 资源${actionLabel}：${resource.name}`;
      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h3>资源${actionLabel}：${resource.name}</h3>
          <ul>
            <li><strong>服务商：</strong>${resource.provider}</li>
            <li><strong>类型：</strong>${resource.type}</li>
            <li><strong>到期日：</strong>${resource.expiryDate || '-'}</li>
          </ul>
          ${changes.length ? `<p><strong>变更项：</strong><br/>${changes.map(c => `? ${c}`).join('<br/>')}</p>` : ''}
        </div>
      `;
      const text = `资源${actionLabel}：${resource.name}\n服务商：${resource.provider}\n类型：${resource.type}\n到期日：${resource.expiryDate || '-'}${changes.length ? `\n变更项：\n${changes.map(c => `? ${c}`).join('\n')}` : ''}`;

      await sendEmailResend(env.RESEND_API_KEY, env.RESEND_FROM, {
        to: settings.email.email,
        subject,
        html,
        text
      });
      channelsSent.push('Email');
    } catch (e) {
      console.error('Email send failed', e);
    }
  }

  if (useWebhook && settings.webhook.url) {
    try {
      await fetch(settings.webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: `resource_${action}`,
          resource: resource,
          changes,
          message: message.replace(/<[^>]*>/g, '')
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
