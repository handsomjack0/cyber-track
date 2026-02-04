import React from 'react';
import { Wallet, TrendingUp, RefreshCw } from 'lucide-react';
import { Resource } from '../../../types';
import { convertToCNY, calculateYearlyCost } from '../../../utils/currency/conversion';

interface CostOverviewProps {
  resources: Resource[];
  rates: Record<string, number>;
  rateMeta?: { source?: string; updatedAt?: string } | null;
}

const CostOverview: React.FC<CostOverviewProps> = ({ resources, rates, rateMeta }) => {
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
      <div className="bg-white/90 dark:bg-slate-900/70 rounded-2xl p-6 border border-white/60 dark:border-slate-800/60 shadow-sm blueprint-card">
        <span className="blueprint-dimension" data-dim="MONTHLY" />
        <div className="flex items-start justify-between mb-4">
          <div className="p-2 rounded-lg border border-sky-400/40 bg-sky-400/10 text-sky-300">
            <Wallet size={20} />
          </div>
          <span className="text-xs font-medium text-slate-400">预计支出</span>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">每月固定成本 (CNY)</p>
          <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            ¥{stats.totalMonthly.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
            <span className="text-lg opacity-60 font-normal">.{(stats.totalMonthly % 1).toFixed(2).substring(2)}</span>
          </h3>
        </div>
      </div>

      <div className="bg-white/90 dark:bg-slate-900/70 rounded-2xl p-6 border border-white/60 dark:border-slate-800/60 shadow-sm blueprint-card">
        <span className="blueprint-dimension" data-dim="YEARLY" />
        <div className="flex items-start justify-between mb-4">
          <div className="p-2 rounded-lg border border-sky-400/40 bg-sky-400/10 text-sky-300">
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

      <div className="bg-white/90 dark:bg-slate-900/70 rounded-2xl p-6 border border-white/60 dark:border-slate-800/60 shadow-sm flex flex-col justify-between blueprint-card">
        <span className="blueprint-dimension" data-dim="FX" />
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 rounded-lg border border-sky-400/40 bg-sky-400/10 text-sky-300">
              <RefreshCw size={20} />
            </div>
            <span className="text-xs font-medium text-sky-200/80">实时汇率</span>
          </div>

        <div className="space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">基准货币: 人民币 (CNY)</p>
          {rateMeta?.source && (
            <p className="text-[11px] text-slate-400 mt-1">
              来源: {rateMeta.source}
              {rateMeta.updatedAt ? ` · 更新时间: ${new Date(rateMeta.updatedAt).toLocaleString()}` : ''}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            {['USD', 'EUR', 'GBP', 'HKD'].map(code => (
              <div key={code} className="flex items-center justify-between bg-slate-900/40 px-3 py-2 rounded-lg border border-sky-400/20">
                <span className="text-xs font-bold text-sky-200/90">{code}</span>
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
