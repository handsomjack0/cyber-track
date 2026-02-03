
import React from 'react';
import { Server, Globe, Edit2, Smartphone, Key, StickyNote } from 'lucide-react';
import { Resource, ResourceType, BillingCycle } from '../../types';
import { getDaysRemaining, getStatusStyles } from '../../utils/resourceUtils';

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
      case ResourceType.VPS: return 'bg-black text-white';
      case ResourceType.DOMAIN: return 'bg-indigo-100 text-indigo-600';
      case ResourceType.PHONE_NUMBER: return 'bg-teal-100 text-teal-600';
      case ResourceType.ACCOUNT: return 'bg-amber-100 text-amber-600';
      default: return 'bg-black text-white';
    }
  };

  const getCycleLabel = (cycle?: BillingCycle) => {
    if (!cycle) return '/y';
    switch (cycle) {
      case BillingCycle.MONTHLY: return '/mo';
      case BillingCycle.QUARTERLY: return '/qtr';
      case BillingCycle.YEARLY: return '/yr';
      case BillingCycle.ONE_TIME: return '';
      default: return '/y';
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
            className={`group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border ${style.border} ${isExpired ? 'bg-slate-50 opacity-75' : 'bg-white shadow-lg'}`}
          >
            {/* Action Buttons (Visible on Hover) */}
            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
               <button 
                 onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                 className="p-2 bg-white/90 backdrop-blur border border-slate-200 shadow-sm text-slate-500 hover:text-indigo-600 rounded-full transition-colors"
               >
                 <Edit2 size={14} />
               </button>
            </div>

            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${getIconClass(item.type)}`}>
                {getIcon(item.type)}
              </div>
              <div className={`w-2.5 h-2.5 rounded-full ${style.dot} shadow-sm ring-4 ring-white/50`} />
            </div>

            {/* Content */}
            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className={`text-5xl font-bold tracking-tighter ${isExpired ? 'text-slate-400' : 'text-slate-900'}`}>
                  {isLifetime ? '∞' : (isExpired ? 'Exp' : days)}
                </span>
                {!isExpired && !isLifetime && <span className="text-sm font-medium text-slate-400">天</span>}
              </div>
              <p className={`text-sm font-medium mt-1 ${isExpired ? 'text-red-500' : 'text-slate-400'}`}>
                {isExpired ? `已过期 ${Math.abs(days || 0)} 天` : isLifetime ? '长期有效' : '剩余有效期'}
              </p>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{item.provider}</p>
                <div className="flex items-center gap-1.5">
                   <p className="font-semibold text-slate-700 truncate max-w-[120px]" title={item.name}>{item.name}</p>
                   {item.notes && <StickyNote size={12} className="text-slate-300" />}
                </div>
              </div>
              <div className="text-right">
                 <p className="text-sm font-mono font-medium text-slate-500">
                    {item.currency}{item.cost}
                    <span className="text-xs opacity-50 ml-0.5">{getCycleLabel(item.billingCycle)}</span>
                 </p>
              </div>
            </div>

            {/* Progress Bar Decor */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-100">
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
