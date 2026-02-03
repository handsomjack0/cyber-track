
import React from 'react';
import { Resource, ResourceType, SortConfig, SortField, BillingCycle } from '../../types';
import { Server, Globe, Trash2, Edit2, ArrowUp, ArrowDown, Bell, BellOff, Smartphone, Key, StickyNote } from 'lucide-react';
import { getDaysRemaining, getStatusStyles } from '../../utils/resourceUtils';

interface ResourceTableProps {
  resources: Resource[];
  title: string;
  onDelete: (id: string) => void;
  onEdit: (resource: Resource) => void;
  hideHeader?: boolean;
  sortConfig?: SortConfig;
  onSort?: (field: SortField) => void;
}

const ResourceTable: React.FC<ResourceTableProps> = ({ 
  resources, 
  title, 
  onDelete, 
  onEdit, 
  hideHeader,
  sortConfig,
  onSort 
}) => {
  
  const StatusPill = ({ days, cycle }: { days: number | null, cycle?: BillingCycle }) => {
    const style = getStatusStyles(days);
    
    // Customize text for lifetime or undefined
    if (cycle === BillingCycle.ONE_TIME || days === null) {
       return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-slate-50 text-slate-500 border-slate-200">
          长期 / 无期限
        </span>
       );
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}>
        {style.label === '正常' || style.label === '紧急' || style.label === '预警' 
          ? `剩余 ${days} 天` 
          : style.label
        }
      </span>
    );
  };

  const getResourceIcon = (type: ResourceType) => {
    switch(type) {
      case ResourceType.VPS: return <Server size={16} />;
      case ResourceType.DOMAIN: return <Globe size={16} />;
      case ResourceType.PHONE_NUMBER: return <Smartphone size={16} />;
      case ResourceType.ACCOUNT: return <Key size={16} />;
      default: return <Server size={16} />;
    }
  };

  const getResourceIconClass = (type: ResourceType) => {
    switch(type) {
      case ResourceType.VPS: return 'bg-slate-100 text-slate-600';
      case ResourceType.DOMAIN: return 'bg-indigo-50 text-indigo-600';
      case ResourceType.PHONE_NUMBER: return 'bg-teal-50 text-teal-600';
      case ResourceType.ACCOUNT: return 'bg-amber-50 text-amber-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const SortableHeader = ({ field, label, align = 'left' }: { field: SortField, label: string, align?: 'left' | 'right' }) => {
    const isActive = sortConfig?.field === field;
    return (
      <th 
        className={`px-6 py-4 font-semibold cursor-pointer group hover:bg-slate-50 transition-colors ${align === 'right' ? 'text-right' : 'text-left'}`}
        onClick={() => onSort && onSort(field)}
      >
        <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
          {label}
          <div className={`text-slate-400 flex flex-col transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
            {isActive && sortConfig?.direction === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
          </div>
        </div>
      </th>
    );
  };

  const NotificationBadge = ({ resource }: { resource: Resource }) => {
    const settings = resource.notificationSettings;
    const isEnabled = settings?.enabled ?? true;
    if (!isEnabled) {
      return (
        <span title="通知已关闭" className="inline-flex">
          <BellOff size={14} className="text-slate-300" />
        </span>
      );
    }
    return null;
  };

  const CycleBadge = ({ cycle }: { cycle?: BillingCycle }) => {
    if (!cycle) return null;
    const map = {
      [BillingCycle.MONTHLY]: { label: '月付', color: 'text-sky-600 bg-sky-50' },
      [BillingCycle.QUARTERLY]: { label: '季付', color: 'text-blue-600 bg-blue-50' },
      [BillingCycle.YEARLY]: { label: '年付', color: 'text-indigo-600 bg-indigo-50' },
      [BillingCycle.ONE_TIME]: { label: '买断', color: 'text-emerald-600 bg-emerald-50' },
    };
    const c = map[cycle] || map[BillingCycle.MONTHLY];
    return <span className={`text-[10px] px-1.5 py-0.5 rounded ml-2 ${c.color}`}>{c.label}</span>;
  };

  return (
    <div className={`bg-white rounded-2xl ${!hideHeader ? 'border border-slate-200 shadow-sm' : ''} overflow-visible`}>
      {!hideHeader && (
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
          <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">count: {resources.length}</span>
        </div>
      )}
      <div className="overflow-x-auto rounded-b-2xl">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-medium text-slate-400 uppercase tracking-wider bg-slate-50/50">
              <SortableHeader field="name" label="资源名称" />
              <SortableHeader field="provider" label="服务商" />
              <SortableHeader field="status" label="状态" />
              <SortableHeader field="expiryDate" label="下次续费/到期" />
              <SortableHeader field="cost" label="费用" align="right" />
              <th className="px-6 py-4 font-semibold text-right w-24">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {resources.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center">
                      <Server size={20} className="opacity-20" />
                    </div>
                    <span>清单空空如也</span>
                  </div>
                </td>
              </tr>
            ) : (
              resources.map((resource) => {
                const days = getDaysRemaining(resource.expiryDate);
                return (
                  <tr key={resource.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${getResourceIconClass(resource.type)}`}>
                          {getResourceIcon(resource.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <p className="font-semibold text-slate-900">{resource.name}</p>
                             <NotificationBadge resource={resource} />
                          </div>
                          <div className="flex items-center mt-0.5 gap-2">
                             <p className="text-xs text-slate-400 font-mono">ID: {resource.id.slice(0, 4)}</p>
                             {resource.type === ResourceType.ACCOUNT && <CycleBadge cycle={resource.billingCycle} />}
                             {resource.notes && <StickyNote size={12} className="text-slate-300" />}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600 font-medium text-sm">{resource.provider}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusPill days={days} cycle={resource.billingCycle} />
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">
                      {resource.expiryDate || '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-medium text-slate-900">
                      {resource.currency}{resource.cost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                        <button 
                          onClick={() => onEdit(resource)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => onDelete(resource.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResourceTable;
