import React from 'react';
import { Wallet, TrendingUp, RefreshCw } from 'lucide-react';
import { Resource } from '../../../types';
import { convertToCNY, calculateYearlyCost } from '../../../utils/currency/conversion';

interface CostOverviewProps {
  resources: Resource[];
  rates: Record<string, number>;
}

const CostOverview: React.FC<CostOverviewProps> = ({ resources, rates }) => {
  const stats = resources.reduce((acc, curr) => {
    const yearlyRaw = calculateYearlyCost(curr);
    const yearlyCNY = convertToCNY(yearlyRaw, curr.currency, rates);
    const monthlyCNY = yearlyCNY / 12;

    acc.totalYearly += yearlyCNY;
    acc.totalMonthly += monthlyCNY;

    return acc;
  }, { totalYearly: 0, totalMonthly: 0 });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/20">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Wallet size={20} className="text-white" />
          </div>
          <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded text-indigo-100">
            预计支出
          </span>
        </div>
        <div>
          <p className="text-indigo-100 text-sm font-medium mb-1">每月固定成本 (CNY)</p>
          <h3 className="text-3xl font-bold tracking-tight">
            ¥{stats.totalMonthly.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
            <span className="text-lg opacity-60 font-normal">.{(stats.totalMonthly % 1).toFixed(2).substring(2)}</span>
          </h3>
        </div>
      </div>

      <div className="bg-white/90 dark:bg-slate-900/70 rounded-2xl p-6 border border-white/60 dark:border-slate-800/60 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
            <TrendingUp size={20} />
          </div>
          <span className="text-xs font-medium text-slate-400">Recurring</span>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">年度订阅成本 (CNY)</p>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            ¥{stats.totalYearly.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
          </h3>
          <p className="text-xs text-slate-400 mt-2">
            包含所有 VPS、域名与订阅服务的年度经常性开销
          </p>
        </div>
      </div>

      <div className="bg-white/90 dark:bg-slate-900/70 rounded-2xl p-6 border border-white/60 dark:border-slate-800/60 shadow-sm flex flex-col justify-between">
        <div className="flex items-start justify-between mb-2">
          <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-lg text-sky-600 dark:text-sky-400">
            <RefreshCw size={20} />
          </div>
          <span className="text-xs font-medium text-slate-400">实时汇率</span>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">基准货币: 人民币 (CNY)</p>
          <div className="grid grid-cols-2 gap-2">
            {['USD', 'EUR', 'GBP', 'HKD'].map(code => (
              <div key={code} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{code}</span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {rates[code] ? `≈${rates[code].toFixed(2)}` : '-'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostOverview;
