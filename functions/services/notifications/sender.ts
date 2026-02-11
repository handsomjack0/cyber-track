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
  return `\n\n变更项：\n${changes.map((item) => `- ${item}`).join('\n')}`;
}

function escapeHtml(value: string | number | null | undefined) {
  const text = String(value ?? '-');
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendResourceNotification(
  env: Env,
  resource: Resource,
  daysRemaining: number,
  settings: AppSettings
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

  const safeName = escapeHtml(resource.name);
  const safeProvider = escapeHtml(resource.provider);
  const safeExpiryDate = escapeHtml(resource.expiryDate || '-');
  const safeCost = `${escapeHtml(resource.currency)}${escapeHtml(resource.cost)}`;
  const status = daysRemaining < 0 ? `已过期 ${Math.abs(daysRemaining)} 天` : `剩余 ${daysRemaining} 天`;

  const message =
    `<b>续费提醒: ${safeName}</b>\n\n` +
    `资产: <b>${safeName}</b>\n` +
    `服务商: <b>${safeProvider}</b>\n` +
    `状态: <b>${escapeHtml(status)}</b>\n` +
    `到期日: <b>${safeExpiryDate}</b>\n` +
    `费用: <b>${safeCost}</b>\n\n` +
    `请及时处理续费，避免服务中断。`;

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
      const subject = `cyberTrack 续费提醒：${resource.name}`;
      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h3>续费提醒：${safeName}</h3>
          <ul>
            <li><strong>服务商：</strong>${safeProvider}</li>
            <li><strong>状态：</strong>${escapeHtml(status)}</li>
            <li><strong>到期日：</strong>${safeExpiryDate}</li>
            <li><strong>费用：</strong>${safeCost}</li>
          </ul>
          <p>请及时处理续费，避免服务中断。</p>
        </div>
      `;
      const text = [
        `续费提醒：${resource.name}`,
        `服务商：${resource.provider}`,
        `状态：${status}`,
        `到期日：${resource.expiryDate || '-'}`,
        `费用：${resource.currency}${resource.cost}`,
        '请及时处理续费，避免服务中断。'
      ].join('\n');

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
          event: 'expiration_alert',
          resource,
          days_remaining: daysRemaining,
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

  const actionLabel = action === 'created' ? '新增' : action === 'updated' ? '更新' : '删除';

  const safeName = escapeHtml(resource.name);
  const safeProvider = escapeHtml(resource.provider);
  const safeType = escapeHtml(resource.type);
  const safeExpiryDate = escapeHtml(resource.expiryDate || '-');

  const message =
    `<b>资源${actionLabel}</b>\n\n` +
    `资产: <b>${safeName}</b>\n` +
    `服务商: <b>${safeProvider}</b>\n` +
    `类型: <b>${safeType}</b>\n` +
    `到期日: <b>${safeExpiryDate}</b>` +
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
          <h3>资源${actionLabel}：${safeName}</h3>
          <ul>
            <li><strong>服务商：</strong>${safeProvider}</li>
            <li><strong>类型：</strong>${safeType}</li>
            <li><strong>到期日：</strong>${safeExpiryDate}</li>
          </ul>
          ${changes.length ? `<p><strong>变更项：</strong><br/>${changes.map((c) => `- ${escapeHtml(c)}`).join('<br/>')}</p>` : ''}
        </div>
      `;
      const text = [
        `资源${actionLabel}：${resource.name}`,
        `服务商：${resource.provider}`,
        `类型：${resource.type}`,
        `到期日：${resource.expiryDate || '-'}`
      ]
        .concat(changes.length ? ['变更项：', ...changes.map((c) => `- ${c}`)] : [])
        .join('\n');

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
          resource,
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
