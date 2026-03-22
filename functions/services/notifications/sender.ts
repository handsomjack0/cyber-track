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
  return `\n\n<b>Changes</b>\n${changes.map((item) => `- ${escapeHtml(item)}`).join('\n')}`;
}

function normalizeProvider(provider: string) {
  return provider.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

function getExpiryStatusText(resource: Resource, daysRemaining: number) {
  if (resource.autoRenew) {
    if (daysRemaining < 0) return `Auto-renew enabled. Expired ${Math.abs(daysRemaining)} day(s) ago. Confirm upstream renewal status.`;
    if (daysRemaining === 0) return 'Auto-renew enabled. Renewal should happen today; confirm billing result.';
    return `Auto-renew enabled. ${daysRemaining} day(s) remaining before next billing checkpoint.`;
  }

  if (daysRemaining < 0) return `Expired ${Math.abs(daysRemaining)} day(s) ago.`;
  if (daysRemaining === 0) return 'Expires today.';
  return `${daysRemaining} day(s) remaining.`;
}

function getNotificationTitle(resource: Resource) {
  return resource.autoRenew ? 'Auto-renew checkpoint' : 'Renewal reminder';
}

export async function sendResourceNotification(
  env: Env,
  resource: Resource,
  settings: AppSettings,
  daysRemaining: number
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
  const safeStatus = escapeHtml(getExpiryStatusText(resource, daysRemaining));
  const title = getNotificationTitle(resource);

  const message = [
    `<b>${escapeHtml(title)}</b>`,
    '',
    `Asset: <b>${safeName}</b>`,
    `Provider: <b>${safeProvider}</b>`,
    `Type: <b>${safeType}</b>`,
    `Expiry: <b>${safeExpiryDate}</b>`,
    `Cost: <b>${safeCost}</b>`,
    `Status: <b>${safeStatus}</b>`,
    `Auto Renew: <b>${resource.autoRenew ? 'On' : 'Off'}</b>`
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
      const subject = `cyberTrack ${title}: ${resource.name}`;
      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h3>${escapeHtml(title)}: ${safeName}</h3>
          <ul>
            <li><strong>Provider:</strong> ${safeProvider}</li>
            <li><strong>Type:</strong> ${safeType}</li>
            <li><strong>Expiry:</strong> ${safeExpiryDate}</li>
            <li><strong>Cost:</strong> ${safeCost}</li>
            <li><strong>Status:</strong> ${safeStatus}</li>
            <li><strong>Auto Renew:</strong> ${resource.autoRenew ? 'On' : 'Off'}</li>
          </ul>
        </div>
      `;
      const text = [
        `${title}: ${displayValue(resource.name)}`,
        `Provider: ${normalizeProvider(displayValue(resource.provider))}`,
        `Type: ${displayValue(resource.type)}`,
        `Expiry: ${displayValue(resource.expiryDate)}`,
        `Cost: ${displayValue(resource.currency)}${displayValue(resource.cost)}`,
        `Status: ${getExpiryStatusText(resource, daysRemaining)}`,
        `Auto Renew: ${resource.autoRenew ? 'On' : 'Off'}`
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
          event: resource.autoRenew ? 'auto_renew_checkpoint' : 'expiration_alert',
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
    created: { icon: '[create]', label: 'Resource created' },
    updated: { icon: '[update]', label: 'Resource updated' },
    deleted: { icon: '[delete]', label: 'Resource deleted' }
  };

  const meta = actionMeta[action];
  const safeName = escapeHtml(displayValue(resource.name));
  const safeProvider = escapeHtml(normalizeProvider(displayValue(resource.provider)));
  const safeType = escapeHtml(displayValue(resource.type));
  const safeExpiryDate = escapeHtml(displayValue(resource.expiryDate));

  const message = [
    `${meta.icon} <b>${meta.label}</b>`,
    '',
    `Asset: <b>${safeName}</b>`,
    `Provider: <b>${safeProvider}</b>`,
    `Type: <b>${safeType}</b>`,
    `Expiry: <b>${safeExpiryDate}</b>${formatChangeList(changes)}`
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
      const subject = `cyberTrack ${meta.label}: ${resource.name}`;
      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h3>${meta.label}: ${safeName}</h3>
          <ul>
            <li><strong>Provider:</strong> ${safeProvider}</li>
            <li><strong>Type:</strong> ${safeType}</li>
            <li><strong>Expiry:</strong> ${safeExpiryDate}</li>
          </ul>
          ${changes.length ? `<p><strong>Changes:</strong><br/>${changes.map((c) => `- ${escapeHtml(c)}`).join('<br/>')}</p>` : ''}
        </div>
      `;
      const text = [
        `${meta.label}: ${displayValue(resource.name)}`,
        `Provider: ${normalizeProvider(displayValue(resource.provider))}`,
        `Type: ${displayValue(resource.type)}`,
        `Expiry: ${displayValue(resource.expiryDate)}`
      ]
        .concat(changes.length ? ['Changes:', ...changes.map((c) => `- ${c}`)] : [])
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
