
import React from 'react';
import { Calendar } from 'lucide-react';
import { Resource, ResourceType } from '../../types';

interface HeatmapViewProps {
  resources: Resource[];
}

const HeatmapView: React.FC<HeatmapViewProps> = ({ resources }) => {
  // Generate next 52 weeks roughly
  const today = new Date();
  const weeks = 53;
  const days = 7;
  
  // Helper to check if a resource expires on a specific date offset
  const getResourceForDay = (dayOffset: number) => {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() + dayOffset);
    const dateStr = checkDate.toISOString().split('T')[0];
    // Only check resources that HAVE an expiry date
    return resources.filter(r => r.expiryDate && r.expiryDate === dateStr);
  };

  const grid = [];
  for (let i = 0; i < weeks * days; i++) {
     grid.push(i);
  }

  const getDotColor = (type: ResourceType) => {
    switch (type) {
      case ResourceType.VPS: return 'bg-blue-400';
      case ResourceType.DOMAIN: return 'bg-purple-400';
      case ResourceType.PHONE_NUMBER: return 'bg-teal-400';
      case ResourceType.ACCOUNT: return 'bg-amber-400';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm animate-fade-in overflow-x-auto">
      <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
        <Calendar size={18} className="text-slate-400" />
        年度到期热力图
      </h3>
      
      <div className="min-w-max">
        <div className="grid grid-rows-7 grid-flow-col gap-1.5 w-max">
          {grid.map((dayOffset) => {
            const expiringItems = getResourceForDay(dayOffset);
            const hasExpiry = expiringItems.length > 0;
            const isUrgent = dayOffset < 30 && hasExpiry;
            
            return (
              <div 
                key={dayOffset}
                className={`w-3.5 h-3.5 rounded-sm transition-all duration-200 relative group
                  ${hasExpiry 
                    ? (isUrgent ? 'bg-rose-500 shadow-sm shadow-rose-200' : 'bg-indigo-500') 
                    : 'bg-slate-100 hover:bg-slate-200'
                  }`}
              >
                {hasExpiry && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none shadow-xl">
                    <div className="font-semibold mb-1">
                      {new Date(Date.now() + dayOffset * 86400000).toLocaleDateString()}
                    </div>
                    {expiringItems.map(r => (
                      <div key={r.id} className="flex items-center gap-2 text-slate-300">
                        <span className={`w-1.5 h-1.5 rounded-full ${getDotColor(r.type)}`}></span>
                        {r.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-4 text-xs text-slate-400 font-medium">
           <div className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-100 rounded-sm"></div> 无事件</div>
           <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-500 rounded-sm"></div> 即将到期</div>
           <div className="flex items-center gap-1"><div className="w-3 h-3 bg-rose-500 rounded-sm"></div> 30天内紧急</div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapView;
