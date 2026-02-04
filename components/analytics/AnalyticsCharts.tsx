import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Resource } from '../../types';
import { convertToCNY, calculateYearlyCost } from '../../utils/currency/conversion';

interface AnalyticsChartsProps {
  resources: Resource[];
  rates: Record<string, number>;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#3b82f6', '#60a5fa', '#94a3b8'];

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ resources, rates }) => {
  const costByProvider = resources.reduce((acc, curr) => {
    const yearlyCostRaw = calculateYearlyCost(curr);
    const costCNY = convertToCNY(yearlyCostRaw, curr.currency, rates);

    const existing = acc.find(i => i.name === curr.provider);
    if (existing) {
      existing.value += costCNY;
    } else {
      acc.push({ name: curr.provider, value: costCNY });
    }
    return acc;
  }, [] as { name: string; value: number }[]).sort((a, b) => b.value - a.value);

  const expiryByMonth = resources.reduce((acc, curr) => {
    if (!curr.expiryDate) return acc;

    const date = new Date(curr.expiryDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const existing = acc.find(i => i.dateKey === key);

    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ dateKey: key, count: 1 });
    }
    return acc;
  }, [] as { dateKey: string; count: number }[])
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
    .slice(0, 12);

  const costByTagMap = new Map<string, number>();
  let untaggedCost = 0;

  resources.forEach(curr => {
    const yearlyCostRaw = calculateYearlyCost(curr);
    const costCNY = convertToCNY(yearlyCostRaw, curr.currency, rates);

    if (curr.tags && curr.tags.length > 0) {
      curr.tags.forEach(tag => {
        costByTagMap.set(tag, (costByTagMap.get(tag) || 0) + costCNY);
      });
    } else {
      untaggedCost += costCNY;
    }
  });

  const costByTag = Array.from(costByTagMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  if (untaggedCost > 0) {
    costByTag.push({ name: '无标签', value: untaggedCost });
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white dark:bg-slate-900 p-3 border border-slate-100 dark:border-slate-800 shadow-xl rounded-xl text-xs">
          <p className="font-semibold text-slate-800 dark:text-slate-100 mb-1">{data.name || data.payload.dateKey}</p>
          <p className="text-slate-500 dark:text-slate-400">
            {data.dataKey === 'value'
              ? `年费用: ¥${data.value.toFixed(0)}`
              : `到期数量: ${data.value} 项`}
          </p>
        </div>
      );
    }
    return null;
  };

  const totalCost = costByProvider.reduce((a, b) => a + b.value, 0);

  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/90 dark:bg-slate-900/70 p-6 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-sm flex flex-col">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-6">
            服务商费用分布（折合人民币/年）
          </h3>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={costByProvider}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {costByProvider.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-xs text-slate-400 font-medium">Total Yearly</div>
                <div className="text-xl font-bold text-slate-800 dark:text-white">
                  ¥{totalCost.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 justify-center max-h-20 overflow-y-auto custom-scrollbar">
            {costByProvider.map((item, index) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                {item.name} ({totalCost > 0 ? ((item.value / totalCost) * 100).toFixed(0) : 0}%)
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/90 dark:bg-slate-900/70 p-6 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-sm flex flex-col">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-6">
            未来 12 个月到期分布
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expiryByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                <XAxis
                  dataKey="dateKey"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => val.split('-')[1] + '月'}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <RechartsTooltip
                  cursor={{ fill: 'var(--tw-prose-invert-bg)', opacity: 0.1 }}
                  content={<CustomTooltip />}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {expiryByMonth.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.count > 1 ? '#f43f5e' : '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-auto text-xs text-center text-slate-400">
            基于当前资源到期日的月度统计
          </div>
        </div>
      </div>

      {costByTag.length > 0 && (
        <div className="bg-white/90 dark:bg-slate-900/70 p-6 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-sm flex flex-col">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-6">
            TOP 标签成本排行（折合人民币/年）
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costByTag} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.1} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  width={80}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip
                  cursor={{ fill: 'var(--tw-prose-invert-bg)', opacity: 0.1 }}
                  content={<CustomTooltip />}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {costByTag.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === '无标签' ? '#94a3b8' : COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsCharts;
