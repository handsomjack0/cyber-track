
import { Resource, ResourceType } from '../../../utils/storage';

const getDaysRemaining = (expiryDate?: string) => {
  if (!expiryDate) return 9999; 
  const today = new Date();
  const target = new Date(expiryDate);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getStatusEmoji = (days: number, hasDate: boolean) => {
  if (!hasDate) return '♾️'; // Infinite/Lifetime
  if (days < 0) return '🔴'; // Expired
  if (days <= 7) return '🆘'; // Very Urgent
  if (days <= 30) return '🟠'; // Urgent
  return '🟢'; // Healthy
};

const getStatusText = (days: number, hasDate: boolean) => {
  if (!hasDate) return '长期有效';
  if (days < 0) return `已过期 ${Math.abs(days)} 天`;
  if (days === 0) return '今天到期';
  return `剩余 ${days} 天`;
};

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
