
import React from 'react';
import { Resource, ResourceType, SortConfig, SortField } from '../../types';
import { Server, Globe, Trash2, Edit2, ArrowUp, ArrowDown, Bell, BellOff } from 'lucide-react';
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
  
  const StatusPill = ({ days }: { days: number }) => {
    const style = getStatusStyles(days);
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}>
        {style.label === '正常' || style.label === '紧急' || style.label === '预警' 
          ? `剩余 ${days} 天` 
          : style.label
        }
      </span>
    );
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
    const isGlobal = settings?.useGlobal ?? true;
    const reminderDays = settings?.reminderDays;

    if (!isEnabled) {
      return (
        <div className="group/notify relative flex items-center justify-center cursor-help">
          <BellOff size={14} className="text-slate-300" />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded shadow-lg opacity-0 group-hover/notify:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-10">
            通知已关闭
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
          </div>
        </div>
      );
    }

    if (!isGlobal) {
       return (
        <div className="group/notify relative flex items-center justify-center cursor-help">
          <Bell size={14} className="text-indigo-500 fill-indigo-50" />
           <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded shadow-lg opacity-0 group-hover/notify:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-10">
            自定义: 提前 {reminderDays} 天
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
          </div>
        </div>
       );
    }

    return (
      <div className="group/notify relative flex items-center justify-center cursor-help">
        <Bell size={14} className="text-slate-300 hover:text-slate-500 transition-colors" />
         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded shadow-lg opacity-0 group-hover/notify:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-10">
          全局设置
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
        </div>
      </div>
    );
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
              <SortableHeader field="expiryDate" label="到期日" />
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
                        <div className={`p-2 rounded-lg shrink-0 ${resource.type === ResourceType.VPS ? 'bg-slate-100 text-slate-600' : 'bg-indigo-50 text-indigo-600'}`}>
                          {resource.type === ResourceType.VPS ? <Server size={16} /> : <Globe size={16} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <p className="font-semibold text-slate-900">{resource.name}</p>
                             <NotificationBadge resource={resource} />
                          </div>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {resource.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600 font-medium text-sm">{resource.provider}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusPill days={days} />
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">
                      {resource.expiryDate}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-medium text-slate-900">
                      {resource.currency}{resource.cost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                        <button 
                          onClick={() => onEdit(resource)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors relative group/btn"
                        >
                          <Edit2 size={16} />
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover/btn:opacity-100 pointer-events-none transition-opacity z-20">编辑</span>
                        </button>
                        <button 
                          onClick={() => onDelete(resource.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors relative group/btn"
                        >
                          <Trash2 size={16} />
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover/btn:opacity-100 pointer-events-none transition-opacity z-20">删除</span>
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
