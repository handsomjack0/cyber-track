import React from 'react';
import { Resource } from '../../types';
import AnalyticsCharts from './AnalyticsCharts';
import AIAssistant from './AIAssistant';
import { TrendingUp } from 'lucide-react';

interface AnalyticsViewProps {
  resources: Resource[];
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ resources }) => {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">深度分析</h1>
        <p className="text-slate-500 flex items-center gap-2">
          <TrendingUp size={16} />
          基于您的 {resources.length} 个资产生成的成本与到期分析报告
        </p>
      </div>

      {/* Charts Section */}
      <AnalyticsCharts resources={resources} />

      {/* AI Section */}
      <div className="border-t border-slate-200 pt-8">
        <h2 className="text-lg font-bold text-slate-900 mb-6">AI 智能顾问</h2>
        <AIAssistant resources={resources} />
      </div>
    </div>
  );
};

export default AnalyticsView;