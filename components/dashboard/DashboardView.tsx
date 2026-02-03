
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

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    resources.forEach(r => r.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [resources]);

  // Filter & Sort Resources
  const processedResources = useMemo(() => {
    let result = resources;

    // 1. Filter by Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.name.toLowerCase().includes(query) || 
        r.provider.toLowerCase().includes(query) ||
        r.notes?.toLowerCase().includes(query) ||
        r.tags?.some(t => t.toLowerCase().includes(query))
      );
    }

    // 2. Filter by Tag
    if (selectedTag) {
      result = result.filter(r => r.tags?.includes(selectedTag));
    }

    // 3. Sort
    return sortResources(result, sortConfig);
  }, [resources, searchQuery, sortConfig, selectedTag]);

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

  // Stats (Use original resources for stats, not filtered)
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
      
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">资产概览</h1>
          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
               <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></span> 
               总资产: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{resources.length}</span>
            </span>
            <span className="flex items-center gap-1.5">
               <span className={`w-2 h-2 rounded-full ${urgentCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
               紧急: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{urgentCount}</span>
            </span>
            {expiredCount > 0 && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-xs font-semibold">
                <AlertCircle size={12} /> {expiredCount} 已过期
              </span>
            )}
          </div>
        </div>

        {/* View Switcher & Controls */}
        <div className="flex flex-col lg:flex-row items-end lg:items-center gap-3 w-full lg:w-auto">
          
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="flex-1 lg:w-64">
               <SearchInput value={searchQuery} onChange={setSearchQuery} />
            </div>
            
            {/* Tag Filter Dropdown */}
            {allTags.length > 0 && (
              <div className="relative group">
                <select
                  value={selectedTag || ''}
                  onChange={(e) => setSelectedTag(e.target.value || null)}
                  className={`appearance-none pl-9 pr-8 py-2 rounded-xl border leading-5 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer
                    ${selectedTag ? 'border-indigo-500 text-indigo-600 font-medium' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}
                  `}
                >
                  <option value="">所有标签</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>#{tag}</option>
                  ))}
                </select>
                <Filter size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${selectedTag ? 'text-indigo-500' : 'text-slate-400'}`} />
                {selectedTag && (
                  <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none">
                     <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <SortControl 
              sortConfig={sortConfig} 
              onSortChange={handleSortChange} 
              onDirectionToggle={handleDirectionToggle}
            />

            <div className="bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center">
              <button 
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                title="卡片视图"
              >
                <Grid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                title="列表视图"
              >
                <List size={18} />
              </button>
              <button 
                onClick={() => setViewMode('heatmap')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'heatmap' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                title="日历热力图"
              >
                <Calendar size={18} />
              </button>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-2"></div>
              <button 
                onClick={onOpenAddModal}
                className="px-3 py-1.5 text-sm font-medium bg-slate-900 dark:bg-indigo-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors whitespace-nowrap"
              >
                + 新增
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tag Selection Indicator */}
      {selectedTag && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">正在筛选标签:</span>
          <button 
            onClick={() => setSelectedTag(null)}
            className="flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium hover:bg-indigo-100 transition-colors"
          >
            #{selectedTag} <X size={14} />
          </button>
        </div>
      )}

      {/* View Content */}
      <div className="min-h-[400px]">
        {processedResources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <p>未找到匹配 {searchQuery ? `"${searchQuery}"` : selectedTag ? `#${selectedTag}` : ''} 的资产</p>
            <button onClick={() => { setSearchQuery(''); setSelectedTag(null); }} className="text-indigo-500 hover:underline mt-2 text-sm">清除筛选</button>
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
