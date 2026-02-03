
import React, { useEffect, useState } from 'react';
import { Resource } from '../../types';
import AnalyticsCharts from './AnalyticsCharts';
import CostOverview from './overview/CostOverview';
import AIAssistant from './AIAssistant';
import { TrendingUp, Loader2 } from 'lucide-react';
import { getExchangeRates } from '../../services/currency/exchangeRateService';

interface AnalyticsViewProps {
  resources: Resource[];
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ resources }) => {
  const [rates, setRates] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    const fetchRates = async () => {
      const data = await getExchangeRates();
      setRates(data);
    };
    fetchRates();
  }, []);

  if (!rates) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">深度分析</h1>
        <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <TrendingUp size={16} />
          基于您的 {resources.length} 个资产生成的成本与到期分析报告
        </p>
      </div>

      {/* Cost Overview Cards */}
      <CostOverview resources={resources} rates={rates} />

      {/* Charts Section */}
      <AnalyticsCharts resources={resources} rates={rates} />

      {/* AI Section */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">AI 智能顾问</h2>
        <AIAssistant resources={resources} />
      </div>
    </div>
  );
};

export default AnalyticsView;
