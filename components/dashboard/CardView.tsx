import React from 'react';
import { Server, Globe, Edit2, Smartphone, Key } from 'lucide-react';
import { Resource, ResourceType, BillingCycle } from '../../types';
import { getDaysRemaining, getStatusStyles } from '../../utils/resourceUtils';
import PrivacyField from '../common/PrivacyField';

interface CardViewProps {
  resources: Resource[];
  onEdit: (resource: Resource) => void;
}

const CardView: React.FC<CardViewProps> = ({ resources, onEdit }) => {
  const getIcon = (type: ResourceType) => {
    switch (type) {
      case ResourceType.VPS: return <Server size={18} />;
      case ResourceType.DOMAIN: return <Globe size={18} />;
      case ResourceType.PHONE_NUMBER: return <Smartphone size={18} />;
      case ResourceType.ACCOUNT: return <Key size={18} />;
      default: return <Server size={18} />;
    }
  };

  const getIconClass = (type: ResourceType) => {
    switch (type) {
      case ResourceType.VPS: return 'bg-slate-900 text-white dark:bg-white dark:text-slate-900';
      case ResourceType.DOMAIN: return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200';
      case ResourceType.PHONE_NUMBER: return 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200';
      case ResourceType.ACCOUNT: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200';
      default: return 'bg-slate-900 text-white';
    }
  };

  const getCycleLabel = (cycle?: BillingCycle) => {
    if (!cycle) return '/年';
    switch (cycle) {
      case BillingCycle.MONTHLY: return '/月';
      case BillingCycle.QUARTERLY: return '/季';
      case BillingCycle.YEARLY: return '/年';
      case BillingCycle.ONE_TIME: return '';
      default: return '/年';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
      {resources.map((item) => {
        const days = getDaysRemaining(item.expiryDate);
        const style = getStatusStyles(days);
        const isExpired = days !== null && days < 0;
        const isLifetime = days === null;

        return (
          <div
            key={item.id}
            className={`group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border ${style.border} ${isExpired ? 'bg-slate-50 dark:bg-slate-900/60 opacity-80' : 'bg-white/90 dark:bg-slate-900/70 shadow-sm'}`}
          >
            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                className="p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-slate-200 dark:border-slate-700 shadow-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 rounded-full transition-colors"
              >
                <Edit2 size={14} />
              </button>
            </div>

            <div className="flex justify-between items-start mb-6">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${getIconClass(item.type)}`}>
                {getIcon(item.type)}
              </div>
              <div className={`w-2.5 h-2.5 rounded-full ${style.dot} shadow-sm ring-4 ring-white/50 dark:ring-slate-800`} />
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className={`text-5xl font-semibold tracking-tight ${isExpired ? 'text-slate-400 dark:text-slate-600' : 'text-slate-900 dark:text-white'}`}>
                  {isLifetime ? '∞' : (isExpired ? 'Exp' : days)}
                </span>
                {!isExpired && !isLifetime && <span className="text-sm font-medium text-slate-400">天</span>}
              </div>
              <p className={`text-sm font-medium mt-1 ${isExpired ? 'text-rose-500' : 'text-slate-400'}`}>
                {isExpired ? `已过期 ${Math.abs(days || 0)} 天` : isLifetime ? '长期有效' : '剩余有效期'}
              </p>
            </div>

            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {item.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] rounded-md font-medium">
                    #{tag}
                  </span>
                ))}
                {item.tags.length > 3 && <span className="text-[10px] text-slate-400">+{item.tags.length - 3}</span>}
              </div>
            )}

            {item.notes && (
              <div className="mb-4">
                <PrivacyField content={item.notes} />
              </div>
            )}

            <div className="flex justify-between items-end border-t border-slate-100 dark:border-slate-800 pt-4 mt-auto">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{item.provider}</p>
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[120px]" title={item.name}>{item.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-medium text-slate-500 dark:text-slate-400">
                  {item.currency}{item.cost}
                  <span className="text-xs opacity-50 ml-0.5">{getCycleLabel(item.billingCycle)}</span>
                </p>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-100 dark:bg-slate-800">
              {days !== null && (
                <div
                  className={`h-full ${days <= 7 ? 'bg-rose-500' : days <= 30 ? 'bg-amber-400' : 'bg-indigo-500'}`}
                  style={{ width: `${Math.max(5, Math.min(100, (365 - days) / 365 * 100))}%` }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CardView;

