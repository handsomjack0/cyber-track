import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, TooltipProps } from 'recharts';
import { Resource } from '../../types';

interface AnalyticsSectionProps {
  resources: Resource[];
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ resources }) => {
  // 1. 数据处理：按服务商汇总成本
  const costByProvider = resources.reduce((acc, curr) => {
    const existing = acc.find(i => i.name === curr.provider);
    if (existing) {
      existing.value += curr.cost;
    } else {
      acc.push({ name: curr.provider, value: curr.cost });
    }
    return acc;
  }, [] as { name: string; value: number }[]).sort((a, b) => b.value - a.value);

  // 2. 数据处理：按月份汇总到期数量
  const expiryByMonth = resources.reduce((acc, curr) => {
    const date = new Date(curr.expiryDate);
    // 格式化为 "2023-10"
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const existing = acc.find(i => i.dateKey === key);
    
    if (existing) {
      existing.count += 1;
      existing.totalCost += curr.cost;
    } else {
      acc.push({ dateKey: key, count: 1, totalCost: curr.cost });
    }
    return acc;
  }, [] as { dateKey: string; count: number; totalCost: number }[])
  .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
  // 只取未来/最近的月份展示，避免太长，或者展示全部
  .slice(0, 12); 

  // 自定义 Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl text-xs">
          <p className="font-semibold text-slate-800 mb-1">{payload[0].name || payload[0].payload.dateKey}</p>
          <p className="text-slate-500">
            {payload[0].dataKey === 'value' ? `费用: $${payload[0].value.toFixed(2)}` : `数量: ${payload[0].value} 个`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-fade-in">
      
      {/* 图表 1: 成本分布 */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">年度费用分布 (按服务商)</h3>
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
              <div className="text-xs text-slate-400 font-medium">Total</div>
              <div className="text-xl font-bold text-slate-800">
                ${costByProvider.reduce((a, b) => a + b.value, 0).toFixed(0)}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {costByProvider.map((item, index) => (
            <div key={item.name} className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-md">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
              {item.name} ({((item.value / costByProvider.reduce((a, b) => a + b.value, 0)) * 100).toFixed(0)}%)
            </div>
          ))}
        </div>
      </div>

      {/* 图表 2: 到期时间轴 */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">到期时间分布 (按月)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={expiryByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
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
                cursor={{fill: '#f8fafc'}}
                content={<CustomTooltip />}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {expiryByMonth.map((entry, index) => {
                   // 高亮显示数量多的月份
                   return <Cell key={`cell-${index}`} fill={entry.count > 1 ? '#f43f5e' : '#cbd5e1'} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-xs text-center text-slate-400">
          展示包含过期及未来到期的月份分布
        </div>
      </div>

    </div>
  );
};

export default AnalyticsSection;