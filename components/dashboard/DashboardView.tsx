import React, { useState, useMemo } from 'react';
import { Resource, SortConfig, SortField } from '../../types';
import { List, Grid, Calendar, AlertCircle, Filter, X } from 'lucide-react';
import ResourceTable from '../resources/ResourceTable';
import CardView from './CardView';
import HeatmapView from './HeatmapView';
import SortControl from '../common/SortControl';
import SearchInput from '../common/SearchInput';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'expiryDate',
    direction: 'asc',
  });

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    resources.forEach(r => r.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [resources]);

  const processedResources = useMemo(() => {
    let result = resources;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.name.toLowerCase().includes(query) ||
        r.provider.toLowerCase().includes(query) ||
        r.notes?.toLowerCase().includes(query) ||
        r.tags?.some(t => t.toLowerCase().includes(query))
      );
    }

    if (selectedTag) {
      result = result.filter(r => r.tags?.includes(selectedTag));
    }

    return sortResources(result, sortConfig);
  }, [resources, searchQuery, sortConfig, selectedTag]);

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

  const urgentCount = resources.filter(r => {
    const days = getDaysRemaining(r.expiryDate);
    return days !== null && days <= 30 && days >= 0;
  }).length;

  const expiredCount = resources.filter(r => {
    const days = getDaysRemaining(r.expiryDate);
    return days !== null && days < 0;
  }).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-indigo-500 font-semibold">Dashboard</div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white mt-1">资产概览</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">你的资产结构、到期风险与成本分布在这里一目了然。</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2.5 text-sm font-semibold bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            + 新增资源
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/90 dark:bg-slate-900/70 border border-white/60 dark:border-slate-800/60 rounded-2xl p-5 shadow-sm">
          <div className="text-xs text-slate-400">总资产</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{resources.length}</div>
          <div className="mt-2 text-xs text-slate-500">全部资源数量</div>
        </div>
        <div className="bg-white/90 dark:bg-slate-900/70 border border-white/60 dark:border-slate-800/60 rounded-2xl p-5 shadow-sm">
          <div className="text-xs text-slate-400">预警</div>
          <div className="mt-2 text-2xl font-semibold text-amber-600">{urgentCount}</div>
          <div className="mt-2 text-xs text-slate-500">30 天内到期</div>
        </div>
        <div className="bg-white/90 dark:bg-slate-900/70 border border-white/60 dark:border-slate-800/60 rounded-2xl p-5 shadow-sm">
          <div className="text-xs text-slate-400">已过期</div>
          <div className="mt-2 text-2xl font-semibold text-rose-500">{expiredCount}</div>
          <div className="mt-2 text-xs text-slate-500">需要立即处理</div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-end lg:items-center gap-4">
        <div className="flex-1 flex items-center gap-3 w-full">
          <div className="flex-1 lg:max-w-md">
            <SearchInput value={searchQuery} onChange={setSearchQuery} />
          </div>
          {allTags.length > 0 && (
            <div className="relative group">
              <select
                value={selectedTag || ''}
                onChange={(e) => setSelectedTag(e.target.value || null)}
                className={`appearance-none pl-9 pr-8 py-2.5 rounded-2xl border leading-5 bg-white/90 dark:bg-slate-900/80 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40 transition-all cursor-pointer ${
                  selectedTag ? 'border-indigo-400 text-indigo-700 font-medium' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <option value="">所有标签</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>#{tag}</option>
                ))}
              </select>
              <Filter size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${selectedTag ? 'text-indigo-500' : 'text-slate-400'}`} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <SortControl
            sortConfig={sortConfig}
            onSortChange={handleSortChange}
            onDirectionToggle={handleDirectionToggle}
          />

          <div className="bg-white/90 dark:bg-slate-900/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center">
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'card' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              title="卡片视图"
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              title="列表视图"
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'heatmap' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              title="日历热力图"
            >
              <Calendar size={18} />
            </button>
          </div>
        </div>
      </div>

      {selectedTag && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">正在筛选标签</span>
          <button
            onClick={() => setSelectedTag(null)}
            className="flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium hover:bg-indigo-100 transition-colors"
          >
            #{selectedTag} <X size={14} />
          </button>
        </div>
      )}

      <div className="min-h-[400px]">
        {processedResources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <p>未找到匹配 {searchQuery ? `"${searchQuery}"` : selectedTag ? `#${selectedTag}` : ''} 的资源</p>
            <button onClick={() => { setSearchQuery(''); setSelectedTag(null); }} className="text-indigo-600 hover:underline mt-2 text-sm">清除筛选</button>
          </div>
        ) : (
          <>
            {viewMode === 'card' && <CardView resources={processedResources} onEdit={onEditResource} />}
            {viewMode === 'list' && (
              <div className="animate-fade-in">
                <ResourceTable
                  title="资产清单"
                  resources={processedResources}
                  onDelete={onDeleteResource}
                  onEdit={onEditResource}
                  hideHeader={false}
                  sortConfig={sortConfig}
                  onSort={handleSortChange}
                />
              </div>
            )}
            {viewMode === 'heatmap' && <HeatmapView resources={resources} />}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardView;

