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
  const [rateMeta, setRateMeta] = useState<{ source?: string; updatedAt?: string } | null>(null);

  useEffect(() => {
    const fetchRates = async () => {
      const data = await getExchangeRates();
      setRates(data.rates);
      setRateMeta({ source: data.source, updatedAt: data.updatedAt });
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-indigo-500 font-semibold">Analytics</div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white mt-1 blueprint-title">深度分析</h1>
          <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-2">
            <TrendingUp size={16} />
            基于你当前的 {resources.length} 个资源，生成成本与到期分布。
          </p>
        </div>
      </div>

      <div className="relative">
        <div className="blueprint-connector hidden md:block" />
      <CostOverview resources={resources} rates={rates} rateMeta={rateMeta} />
      </div>

      <AnalyticsCharts resources={resources} rates={rates} />

      <div className="border-t border-slate-200/70 dark:border-slate-800/70 pt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white blueprint-title">AI 资产顾问</h2>
          <span className="text-xs text-slate-400">基于实时数据生成洞察</span>
        </div>
        <AIAssistant resources={resources} />
      </div>
    </div>
  );
};

export default AnalyticsView;

