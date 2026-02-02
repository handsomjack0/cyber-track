export const getDaysRemaining = (expiryDate: string) => {
  const today = new Date();
  const target = new Date(expiryDate);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getStatusStyles = (days: number) => {
  if (days < 0) return { bg: 'bg-slate-100', text: 'text-slate-400', border: 'border-slate-200', dot: 'bg-slate-400', label: '已过期' };
  if (days <= 7) return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', dot: 'bg-rose-500', label: '紧急' };
  if (days <= 30) return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', dot: 'bg-amber-500', label: '预警' };
  return { bg: 'bg-white', text: 'text-slate-900', border: 'border-slate-200', dot: 'bg-emerald-500', label: '正常' };
};