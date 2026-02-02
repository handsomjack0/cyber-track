import React, { useState } from 'react';
import { Resource } from '../types';
import { List, Grid, Calendar, AlertCircle } from 'lucide-react';
import ResourceTable from './ResourceTable';
import CardView from './dashboard/CardView';
import HeatmapView from './dashboard/HeatmapView';
import { getDaysRemaining } from '../utils/resourceUtils';

interface DashboardProps {
  resources: Resource[];
  onOpenAddModal: () => void;
}

type ViewMode = 'card' | 'list' | 'heatmap';

const Dashboard: React.FC<DashboardProps> = ({ resources, onOpenAddModal }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  // Stats
  const urgentCount = resources.filter(r => {
    const days = getDaysRemaining(r.expiryDate);
    return days <= 30 && days >= 0;
  }).length;
  
  const expiredCount = resources.filter(r => getDaysRemaining(r.expiryDate) < 0).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">资产概览</h1>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
               <span className="w-2 h-2 rounded-full bg-slate-300"></span> 
               总资产: <span className="font-mono font-medium text-slate-700">{resources.length}</span>
            </span>
            <span className="flex items-center gap-1.5">
               <span className={`w-2 h-2 rounded-full ${urgentCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
               紧急: <span className="font-mono font-medium text-slate-700">{urgentCount}</span>
            </span>
            {expiredCount > 0 && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-xs font-semibold">
                <AlertCircle size={12} /> {expiredCount} 已过期
              </span>
            )}
          </div>
        </div>

        {/* View Switcher */}
        <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex items-center">
          <button 
            onClick={() => setViewMode('card')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            title="卡片视图"
          >
            <Grid size={18} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            title="列表视图"
          >
            <List size={18} />
          </button>
          <button 
            onClick={() => setViewMode('heatmap')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'heatmap' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            title="日历热力图"
          >
            <Calendar size={18} />
          </button>
          <div className="w-px h-4 bg-slate-200 mx-2"></div>
          <button 
            onClick={onOpenAddModal}
            className="px-3 py-1.5 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            + 新增
          </button>
        </div>
      </div>

      {/* View Content */}
      <div className="min-h-[400px]">
        {viewMode === 'card' && <CardView resources={resources} onEdit={() => {}} />}
        {viewMode === 'list' && (
           <div className="animate-fade-in">
              <ResourceTable resources={resources} title="资产清单" onDelete={() => {}} hideHeader />
           </div>
        )}
        {viewMode === 'heatmap' && <HeatmapView resources={resources} />}
      </div>
      
    </div>
  );
};

export default Dashboard;