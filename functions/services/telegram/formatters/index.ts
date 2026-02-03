
import { Resource } from '../../../utils/storage';
import { getDaysRemaining } from '../../../utils/time';
import { getStatusEmoji, getStatusText } from './helpers';

// --- Specific Formatters ---

const formatVPS = (r: Resource, days: number): string => {
  const statusIcon = getStatusEmoji(days, !!r.expiryDate);
  const statusText = getStatusText(days, !!r.expiryDate);
  
  return `${statusIcon} 🖥️ <b>${r.name}</b>\n` +
         `   ├ 🏢 服务商: ${r.provider}\n` +
         `   ├ ⏳ 状态: ${statusText}\n` +
         `   └ 💰 续费: ${r.currency}${r.cost}`;
};

const formatDomain = (r: Resource, days: number): string => {
  const statusIcon = getStatusEmoji(days, !!r.expiryDate);
  const statusText = getStatusText(days, !!r.expiryDate);

  return `${statusIcon} 🌐 <b>${r.name}</b>\n` +
         `   ├ 🏷️ 注册商: ${r.provider}\n` +
         `   ├ ⏳ 到期: ${r.expiryDate || '长期'}\n` +
         `   └ 📉 倒计时: ${statusText}`;
};

const formatAccount = (r: Resource, days: number): string => {
  const statusIcon = getStatusEmoji(days, !!r.expiryDate);
  
  // Map billing cycle to readable text
  const cycleMap: Record<string, string> = {
    'Monthly': '月付',
    'Quarterly': '季付',
    'Yearly': '年付',
    'OneTime': '买断'
  };
  const cycle = r.billingCycle ? (cycleMap[r.billingCycle] || r.billingCycle) : '未知周期';

  return `${statusIcon} 🔑 <b>${r.name}</b>\n` +
         `   ├ 🏢 平台: ${r.provider}\n` +
         `   ├ 🔄 周期: ${cycle}\n` +
         `   └ 💰 价格: ${r.currency}${r.cost}`;
};

const formatPhone = (r: Resource, days: number): string => {
  const statusIcon = getStatusEmoji(days, !!r.expiryDate);
  const statusText = getStatusText(days, !!r.expiryDate);

  return `${statusIcon} 📱 <b>${r.name}</b>\n` +
         `   ├ 📡 运营商: ${r.provider}\n` +
         `   └ 📅 有效期: ${statusText}`;
};

// --- Main Formatter Dispatcher ---

export const formatResourceItem = (r: Resource): string => {
  const days = getDaysRemaining(r.expiryDate);
  
  switch (r.type) {
    case 'VPS':
      return formatVPS(r, days);
    case 'DOMAIN':
      return formatDomain(r, days);
    case 'ACCOUNT':
      return formatAccount(r, days);
    case 'PHONE_NUMBER':
      return formatPhone(r, days);
    default:
      return formatVPS(r, days);
  }
};
