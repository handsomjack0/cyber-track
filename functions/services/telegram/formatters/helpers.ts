
export const getStatusEmoji = (days: number, hasDate: boolean) => {
  if (!hasDate) return '♾️'; // Infinite/Lifetime
  if (days < 0) return '🔴'; // Expired
  if (days <= 7) return '🆘'; // Very Urgent
  if (days <= 30) return '🟠'; // Urgent
  return '🟢'; // Healthy
};

export const getStatusText = (days: number, hasDate: boolean) => {
  if (!hasDate) return '长期有效';
  if (days < 0) return `已过期 ${Math.abs(days)} 天`;
  if (days === 0) return '今天到期';
  return `剩余 ${days} 天`;
};
