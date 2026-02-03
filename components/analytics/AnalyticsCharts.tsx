
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, TooltipProps } from 'recharts';
import { Resource } from '../../types';
import { convertToCNY, calculateYearlyCost } from '../../utils/currency/conversion';

interface AnalyticsChartsProps {
  resources: Resource[];
  rates: Record<string, number>;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ resources, rates }) => {
  
  // 1. 数据处理：按服务商汇总成本 (转换为 CNY)
  const costByProvider = resources.reduce((acc, curr) => {
    // 统一转换为年度成本再转 CNY，以公平比较不同周期的产品
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

  // 2. 数据处理：按月份汇总到期数量
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

  // 自定义 Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white dark:bg-slate-900 p-3 border border-slate-100 dark:border-slate-800 shadow-xl rounded-xl text-xs">
          <p className="font-semibold text-slate-800 dark:text-slate-100 mb-1">{data.name || data.payload.dateKey}</p>
          <p className="text-slate-500 dark:text-slate-400">
            {data.dataKey === 'value' 
              ? `年费用: ¥${data.value.toFixed(0)}` 
              : `到期数量: ${data.value} 个`}
          </p>
        </div>
      );
    }
    return null;
  };

  const totalCost = costByProvider.reduce((a, b) => a + b.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      
      {/* 图表 1: 成本分布 */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-6">
          服务商费用分布 (折合人民币/年)
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
          {/* 中间总金额 */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-xs text-slate-400 font-medium">Total Yearly</div>
              <div className="text-xl font-bold text-slate-800 dark:text-white">
                ¥{totalCost.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center max-h-20 overflow-y-auto custom-scrollbar">
          {costByProvider.map((item, index) => (
            <div key={item.name} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
              {item.name} ({totalCost > 0 ? ((item.value / totalCost) * 100).toFixed(0) : 0}%)
            </div>
          ))}
        </div>
      </div>

      {/* 图表 2: 到期时间轴 */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-6">
          未来 12 个月到期分布
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={expiryByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
              <XAxis 
                dataKey="dateKey" 
                tick={{fontSize: 10, fill: '#94a3b8'}} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={(val) => val.split('-')[1] + '月'}
              />
              <YAxis 
                tick={{fontSize: 10, fill: '#94a3b8'}} 
                axisLine={false} 
                tickLine={false}
                allowDecimals={false}
              />
              <RechartsTooltip 
                cursor={{fill: 'var(--tw-prose-invert-bg)', opacity: 0.1}}
                content={<CustomTooltip />}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {expiryByMonth.map((entry, index) => {
                   return <Cell key={`cell-${index}`} fill={entry.count > 1 ? '#f43f5e' : '#cbd5e1'} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-auto text-xs text-center text-slate-400">
          基于当前资源到期日的月度统计
        </div>
      </div>

    </div>
  );
};

export default AnalyticsCharts;
