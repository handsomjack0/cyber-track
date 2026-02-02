
import React, { useState, useMemo } from 'react';
import { Resource, SortConfig, SortField } from '../../types';
import { List, Grid, Calendar, AlertCircle, HardDrive, Globe2, ShieldAlert } from 'lucide-react';
import ResourceTable from '../resources/ResourceTable';
import CardView from './CardView';
import HeatmapView from './HeatmapView';
import SortControl from '../common/SortControl';
import { getDaysRemaining } from '../../utils/resourceUtils';
import { sortResources } from '../../utils/sortUtils';

interface DashboardViewProps {
  resources: Resource[];
  onOpenAddModal: () => void;
  onEditResource: (resource: Resource) => void;
  onDeleteResource: (id: string) => void;
}

type ViewMode = 'card' | 'list' | 'heatmap';

const DashboardView: React.FC<DashboardViewProps> = ({ resources, onOpenAddModal, onEditResource, onDeleteResource }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'expiryDate',
    direction: 'asc',
  });

  // Calculate sorted resources
  const sortedResources = useMemo(() => {
    return sortResources(resources, sortConfig);
  }, [resources, sortConfig]);

  // Handle Sort Change
  const handleSortChange = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleDirectionToggle = () => {
    setSortConfig(prev => ({
      ...prev,
      direction: prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Stats
  const urgentCount = resources.filter(r => {
    const days = getDaysRemaining(r.expiryDate);
    return days <= 30 && days >= 0;
  }).length;
  
  const expiredCount = resources.filter(r => getDaysRemaining(r.expiryDate) < 0).length;
  const vpsCount = resources.filter(r => r.type === 'VPS').length;
  const domainCount = resources.filter(r => r.type === 'DOMAIN').length;

  const StatCard = ({ label, value, icon: Icon, colorClass, borderClass }: any) => (
    <div className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border ${borderClass} shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-0.5">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header & Stats */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
             <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">资产概览</h1>
             <p className="text-slate-500 dark:text-slate-400 mt-1">欢迎回来，这是您的基础设施运行状态。</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
                onClick={onOpenAddModal}
                className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
              >
                + 新增资产
            </button>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            label="VPS 实例" 
            value={vpsCount} 
            icon={HardDrive} 
            colorClass="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
            borderClass="border-slate-100 dark:border-slate-800"
          />
          <StatCard 
            label="域名资产" 
            value={domainCount} 
            icon={Globe2} 
            colorClass="bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
            borderClass="border-slate-100 dark:border-slate-800"
          />
          <StatCard 
            label="30天内到期" 
            value={urgentCount} 
            icon={AlertCircle} 
            colorClass={`${urgentCount > 0 ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'}`}
            borderClass="border-slate-100 dark:border-slate-800"
          />
          <StatCard 
            label="已过期" 
            value={expiredCount} 
            icon={ShieldAlert} 
            colorClass={`${expiredCount > 0 ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400' : 'bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}
            borderClass="border-slate-100 dark:border-slate-800"
          />
        </div>
      </div>

      {/* Controls Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="px-2">
          <SortControl 
            sortConfig={sortConfig} 
            onSortChange={handleSortChange}
            onDirectionToggle={handleDirectionToggle}
          />
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button 
            onClick={() => setViewMode('card')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            title="卡片视图"
          >
            <Grid size={18} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            title="列表视图"
          >
            <List size={18} />
          </button>
          <button 
            onClick={() => setViewMode('heatmap')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'heatmap' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            title="日历热力图"
          >
            <Calendar size={18} />
          </button>
        </div>
      </div>

      {/* View Content */}
      <div className="min-h-[400px]">
        {viewMode === 'card' && <CardView resources={sortedResources} onEdit={onEditResource} />}
        {viewMode === 'list' && (
           <div className="animate-fade-in">
              <ResourceTable 
                resources={sortedResources} 
                title="资产清单" 
                onDelete={onDeleteResource} 
                onEdit={onEditResource}
                hideHeader 
                sortConfig={sortConfig}
                onSort={handleSortChange}
              />
           </div>
        )}
        {viewMode === 'heatmap' && <HeatmapView resources={sortedResources} />}
      </div>
      
    </div>
  );
};

export default DashboardView;
