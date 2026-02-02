import React from 'react';
import { Resource, Status, ResourceType } from '../types';
import { Server, Globe, MoreHorizontal } from 'lucide-react';
import { getDaysRemaining, getStatusStyles } from '../utils/resourceUtils';

interface ResourceTableProps {
  resources: Resource[];
  title: string;
  onDelete: (id: string) => void;
  hideHeader?: boolean;
}

const ResourceTable: React.FC<ResourceTableProps> = ({ resources, title, onDelete, hideHeader }) => {
  
  const StatusPill = ({ days }: { days: number }) => {
    // Reuse the style logic from utils, but adapt slightly for the pill format if needed
    // or just use the style object directly.
    const style = getStatusStyles(days);
    
    // Mapping style object to pill specific classes
    // The util returns border/bg/text/dot. We can reuse them.
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}>
        {style.label === '正常' || style.label === '紧急' || style.label === '预警' 
          ? `剩余 ${days} 天` 
          : style.label
        }
      </span>
    );
  };

  return (
    <div className={`bg-white rounded-2xl ${!hideHeader ? 'border border-slate-200 shadow-sm' : ''} overflow-hidden`}>
      {!hideHeader && (
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
          <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">count: {resources.length}</span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-medium text-slate-400 uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">资源名称</th>
              <th className="px-6 py-4 font-semibold">服务商</th>
              <th className="px-6 py-4 font-semibold">状态</th>
              <th className="px-6 py-4 font-semibold">到期日</th>
              <th className="px-6 py-4 font-semibold text-right">费用</th>
              <th className="px-6 py-4 font-semibold w-10"></th>
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
                  <tr key={resource.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${resource.type === ResourceType.VPS ? 'bg-slate-100 text-slate-600' : 'bg-indigo-50 text-indigo-600'}`}>
                          {resource.type === ResourceType.VPS ? <Server size={16} /> : <Globe size={16} />}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{resource.name}</p>
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
                      <button 
                        onClick={() => onDelete(resource.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal size={16} />
                      </button>
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