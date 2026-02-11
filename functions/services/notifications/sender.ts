import { Env, Resource, AppSettings } from '../../utils/storage';
import { sendMessage } from '../telegram/client';
import { sendEmailResend } from '../email/resend';

interface NotificationResult {
  success: boolean;
  channels: string[];
  error?: string;
}

type ChangeAction = 'created' | 'updated' | 'deleted';

function escapeHtml(value: string | number | null | undefined) {
  const text = String(value ?? '-');
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

function formatChangeList(changes: string[]) {
  if (changes.length === 0) return '';
  return `\n\n<b>变更项</b>\n${changes.map((item) => `• ${escapeHtml(item)}`).join('\n')}`;
}

function normalizeProvider(provider: string) {
  return provider.replace(/^https?:\/\//i, '').replace(/\/$/, '');
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

  const safeName = escapeHtml(displayValue(resource.name));
  const safeProvider = escapeHtml(normalizeProvider(displayValue(resource.provider)));
  const safeType = escapeHtml(displayValue(resource.type));
  const safeExpiryDate = escapeHtml(displayValue(resource.expiryDate));
  const safeCost = `${escapeHtml(displayValue(resource.currency))}${escapeHtml(displayValue(resource.cost))}`;
  const status = daysRemaining < 0 ? `已过期 ${Math.abs(daysRemaining)} 天` : `剩余 ${daysRemaining} 天`;

  const message = [
    `⏰ <b>续费提醒</b>`,
    ``,
    `📌 资产: <b>${safeName}</b>`,
    `🏢 服务商: <b>${safeProvider}</b>`,
    `🧩 类型: <b>${safeType}</b>`,
    `🗓 到期日: <b>${safeExpiryDate}</b>`,
    `💰 费用: <b>${safeCost}</b>`,
    `📉 状态: <b>${escapeHtml(status)}</b>`
  ].join('\n');

  if (useTelegram && settings.telegram.chatId && env.TELEGRAM_BOT_TOKEN) {
    try {
      await sendMessage(env.TELEGRAM_BOT_TOKEN, {
        chat_id: settings.telegram.chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true
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
            <li><strong>类型：</strong>${safeType}</li>
            <li><strong>到期日：</strong>${safeExpiryDate}</li>
            <li><strong>费用：</strong>${safeCost}</li>
            <li><strong>状态：</strong>${escapeHtml(status)}</li>
          </ul>
          <p>请及时处理续费，避免服务中断。</p>
        </div>
      `;
      const text = [
        `续费提醒：${displayValue(resource.name)}`,
        `服务商：${normalizeProvider(displayValue(resource.provider))}`,
        `类型：${displayValue(resource.type)}`,
        `到期日：${displayValue(resource.expiryDate)}`,
        `费用：${displayValue(resource.currency)}${displayValue(resource.cost)}`,
        `状态：${status}`,
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

  const actionMeta: Record<ChangeAction, { icon: string; label: string }> = {
    created: { icon: '🧩', label: '资源新增' },
    updated: { icon: '♻️', label: '资源更新' },
    deleted: { icon: '🗑️', label: '资源删除' }
  };

  const meta = actionMeta[action];
  const safeName = escapeHtml(displayValue(resource.name));
  const safeProvider = escapeHtml(normalizeProvider(displayValue(resource.provider)));
  const safeType = escapeHtml(displayValue(resource.type));
  const safeExpiryDate = escapeHtml(displayValue(resource.expiryDate));

  const message = [
    `${meta.icon} <b>${meta.label}</b>`,
    ``,
    `📌 资产: <b>${safeName}</b>`,
    `🏢 服务商: <b>${safeProvider}</b>`,
    `🧩 类型: <b>${safeType}</b>`,
    `🗓 到期日: <b>${safeExpiryDate}</b>${formatChangeList(changes)}`
  ].join('\n');

  if (useTelegram && settings.telegram.chatId && env.TELEGRAM_BOT_TOKEN) {
    try {
      await sendMessage(env.TELEGRAM_BOT_TOKEN, {
        chat_id: settings.telegram.chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      });
      channelsSent.push('Telegram');
    } catch (e) {
      console.error('Telegram send failed', e);
    }
  }

  if (useEmail && settings.email.email && env.RESEND_API_KEY && env.RESEND_FROM) {
    try {
      const subject = `cyberTrack ${meta.label}：${resource.name}`;
      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h3>${meta.label}：${safeName}</h3>
          <ul>
            <li><strong>服务商：</strong>${safeProvider}</li>
            <li><strong>类型：</strong>${safeType}</li>
            <li><strong>到期日：</strong>${safeExpiryDate}</li>
          </ul>
          ${changes.length ? `<p><strong>变更项：</strong><br/>${changes.map((c) => `• ${escapeHtml(c)}`).join('<br/>')}</p>` : ''}
        </div>
      `;
      const text = [
        `${meta.label}：${displayValue(resource.name)}`,
        `服务商：${normalizeProvider(displayValue(resource.provider))}`,
        `类型：${displayValue(resource.type)}`,
        `到期日：${displayValue(resource.expiryDate)}`
      ]
        .concat(changes.length ? ['变更项：', ...changes.map((c) => `• ${c}`)] : [])
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
