import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
  ReferenceLine
} from 'recharts';
import { Resource } from '../../types';
import { convertToCNY, calculateYearlyCost } from '../../utils/currency/conversion';

interface AnalyticsChartsProps {
  resources: Resource[];
  rates: Record<string, number>;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#3b82f6', '#60a5fa', '#94a3b8'];
const TOP_PROVIDER_LIMIT = 5;
const TOP_TAG_LIMIT = 8;

const formatMonthLabel = (dateKey: string) => `${dateKey.split('-')[1]}月`;

const buildNext12Months = () => {
  const now = new Date();
  const months = [] as { dateKey: string; count: number }[];
  for (let i = 0; i < 12; i += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    months.push({ dateKey: key, count: 0 });
  }
  return months;
};

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ resources, rates }) => {
  const costByProviderRaw = resources.reduce((acc, curr) => {
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

  const expiryByMonthSeed = buildNext12Months();
  const expiryByMonth = resources.reduce((acc, curr) => {
    if (!curr.expiryDate) return acc;

    const date = new Date(curr.expiryDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const existing = acc.find(i => i.dateKey === key);

    if (existing) {
      existing.count += 1;
    }
    return acc;
  }, expiryByMonthSeed);

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

  const costByTagRaw = Array.from(costByTagMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (untaggedCost > 0) {
    costByTagRaw.push({ name: '无标签', value: untaggedCost });
  }

  const totalCost = costByProviderRaw.reduce((a, b) => a + b.value, 0);

  const costByProvider = (() => {
    if (costByProviderRaw.length <= TOP_PROVIDER_LIMIT) return costByProviderRaw;
    const topItems = costByProviderRaw.slice(0, TOP_PROVIDER_LIMIT);
    const otherValue = costByProviderRaw.slice(TOP_PROVIDER_LIMIT).reduce((acc, item) => acc + item.value, 0);
    return [...topItems, { name: '其他', value: otherValue }];
  })();

  const costByTag = (() => {
    if (costByTagRaw.length <= TOP_TAG_LIMIT) return costByTagRaw;
    const topItems = costByTagRaw.slice(0, TOP_TAG_LIMIT);
    const otherValue = costByTagRaw.slice(TOP_TAG_LIMIT).reduce((acc, item) => acc + item.value, 0);
    return [...topItems, { name: '其他', value: otherValue }];
  })();

  const maxExpiry = Math.max(...expiryByMonth.map(item => item.count), 1);
  const peakMonths = expiryByMonth.filter(item => item.count === maxExpiry);
  const peakKeys = new Set(peakMonths.map(item => item.dateKey));
  const peakLabel = peakMonths.length
    ? peakMonths.map(item => formatMonthLabel(item.dateKey)).join('、')
    : '-';

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const dataName = data.name || data.payload.dateKey;
      const isValue = data.dataKey === 'value';
      const value = data.value ?? 0;
      const percent = isValue && totalCost > 0 ? ((value / totalCost) * 100).toFixed(1) : null;
      return (
        <div className="bg-white/95 dark:bg-slate-900/95 p-3 border border-slate-100/60 dark:border-slate-800/60 shadow-xl rounded-xl text-xs space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-100">{dataName}</p>
          {isValue ? (
            <>
              <p className="text-slate-500 dark:text-slate-400">
                年费用: ￥{Math.round(Number(value)).toLocaleString('zh-CN')}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                占比: {percent ?? '0.0'}%
              </p>
            </>
          ) : (
            <p className="text-slate-500 dark:text-slate-400">
              到期数量: {value} 项
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const topProvider = costByProvider[0];
  const topProviderPercent = topProvider && totalCost > 0
    ? ((topProvider.value / totalCost) * 100).toFixed(0)
    : '0';

  const renderPeakFlag = (props: any) => {
    const { x, y, index } = props;
    const data = expiryByMonth[index];
    if (!data || data.count <= 0 || !peakKeys.has(data.dateKey)) return null;
    return (
      <text
        x={x}
        y={y - 6}
        textAnchor="middle"
        fill="#f43f5e"
        fontSize={10}
        fontWeight={600}
      >
        峰值
      </text>
    );
  };

  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/90 dark:bg-slate-900/70 p-6 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-sm flex flex-col blueprint-card">
          <span className="blueprint-dimension" data-dim="PROVIDER" />
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-6">
            服务商费用分布（折合人民币/年）
          </h3>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {costByProvider.map((entry, index) => (
                    <linearGradient
                      key={`pie-grad-${index}`}
                      id={`pie-grad-${index}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.6} />
                    </linearGradient>
                  ))}
                  <filter id="pie-glow" x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <Pie
                  data={costByProvider}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  filter="url(#pie-glow)"
                >
                  {costByProvider.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`url(#pie-grad-${index})`}
                      stroke="rgba(255,255,255,0.18)"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-xs text-slate-400 font-medium">Total Yearly</div>
                <div className="text-xl font-bold text-slate-800 dark:text-white">
                  ￥{totalCost.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>
            {topProvider && (
              <div className="absolute left-4 top-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/60 px-3 py-2 text-xs shadow-sm">
                <div className="text-slate-400">Top 服务商</div>
                <div className="text-slate-800 dark:text-slate-100 font-semibold">
                  {topProvider.name} · {topProviderPercent}%
                </div>
              </div>
            )}
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

        <div className="bg-white/90 dark:bg-slate-900/70 p-6 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-sm flex flex-col blueprint-card">
          <span className="blueprint-dimension" data-dim="EXPIRY" />
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
                  tickFormatter={(val) => formatMonthLabel(val)}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <ReferenceLine y={maxExpiry} stroke="#64748b" strokeDasharray="4 4" opacity={0.25} />
                <RechartsTooltip
                  cursor={{ fill: 'var(--tw-prose-invert-bg)', opacity: 0.1 }}
                  content={<CustomTooltip />}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {expiryByMonth.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={peakKeys.has(entry.dateKey) ? '#f43f5e' : entry.count > 0 ? '#cbd5e1' : '#94a3b8'}
                      stroke={peakKeys.has(entry.dateKey) ? 'rgba(244,63,94,0.6)' : 'transparent'}
                      strokeWidth={peakKeys.has(entry.dateKey) ? 1 : 0}
                    />
                  ))}
                  <LabelList dataKey="count" position="top" fill="#94a3b8" fontSize={10} formatter={(val: number) => (val > 0 ? val : '')} />
                  <LabelList content={renderPeakFlag} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-auto text-xs text-center text-slate-400">
            峰值月份: {peakLabel} · 基于当前资源到期日的月度统计
          </div>
        </div>
      </div>

      {costByTag.length > 0 && (
        <div className="bg-white/90 dark:bg-slate-900/70 p-6 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-sm flex flex-col blueprint-card">
          <span className="blueprint-dimension" data-dim="TAGCOST" />
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
                <Bar
                  dataKey="value"
                  radius={[0, 4, 4, 0]}
                  barSize={18}
                  background={{ fill: 'rgba(148,163,184,0.12)', radius: 6 }}
                >
                  {costByTag.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === '无标签' ? '#94a3b8' : COLORS[index % COLORS.length]} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="right"
                    fill="#94a3b8"
                    fontSize={10}
                    formatter={(val: number) => `￥${Math.round(val).toLocaleString('zh-CN')}`}
                  />
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
