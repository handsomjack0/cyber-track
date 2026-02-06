import React, { useEffect, useState } from 'react';
import { RefreshCw, Save, Trash2, AlertTriangle, CheckCircle, Coins } from 'lucide-react';
import { getExchangeRates, setExchangeRateOverride, clearExchangeRateOverride } from '../../services/currency/exchangeRateService';

type RateMap = Record<string, number>;

const defaultCodes = ['CNY', 'USD', 'EUR', 'GBP', 'HKD', 'JPY'];

const ExchangeRateSettings: React.FC = () => {
  const [rates, setRates] = useState<RateMap>({});
  const [meta, setMeta] = useState<{ source?: string; updatedAt?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const loadRates = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const data = await getExchangeRates();
      const next: RateMap = {};
      defaultCodes.forEach(code => {
        if (data.rates[code]) next[code] = data.rates[code];
      });
      setRates(next);
      setMeta({ source: data.source, updatedAt: data.updatedAt });
    } catch (e) {
      setStatus({ type: 'error', msg: '获取汇率失败' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRates();
  }, []);

  const handleSave = async () => {
    try {
      await setExchangeRateOverride(rates);
      setStatus({ type: 'success', msg: '已保存自定义汇率（优先生效）' });
    } catch (e: any) {
      setStatus({ type: 'error', msg: e.message || '保存失败' });
    }
  };

  const handleClear = async () => {
    try {
      await clearExchangeRateOverride();
      setStatus({ type: 'success', msg: '已清除自定义汇率，恢复自动更新' });
      await loadRates();
    } catch (e: any) {
      setStatus({ type: 'error', msg: e.message || '清除失败' });
    }
  };

  return (
    <div className="bg-white/90 dark:bg-slate-900/70 border border-white/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm animate-fade-in">
      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Coins size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">汇率设置</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            默认自动更新。可选手动覆盖，避免 API 不稳定带来的波动。
          </p>
          {meta?.source && (
            <p className="text-[11px] text-slate-400 mt-1">
              当前来源: {meta.source}
              {meta.updatedAt ? ` · 更新时间: ${new Date(meta.updatedAt).toLocaleString()}` : ''}
            </p>
          )}
        </div>
      </div>

      {meta?.source === 'fallback' && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 text-amber-700 text-xs flex items-center gap-2">
          <AlertTriangle size={14} />
          当前使用回退汇率，可能不是最新。可点击“刷新”重试或手动覆盖。
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {defaultCodes.map(code => (
          <div key={code} className="bg-slate-50/70 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
            <label className="text-xs text-slate-500 dark:text-slate-400">{code}</label>
            <input
              type="number"
              step="0.0001"
              value={rates[code] ?? ''}
              onChange={(e) => setRates(prev => ({ ...prev, [code]: Number(e.target.value) }))}
              className="mt-2 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-6">
        <button
          onClick={handleSave}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-sm flex items-center gap-2"
        >
          <Save size={16} />
          保存覆盖
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-semibold shadow-sm flex items-center gap-2"
        >
          <Trash2 size={16} />
          清除覆盖
        </button>
        <button
          onClick={loadRates}
          className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-semibold shadow-sm flex items-center gap-2"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          刷新
        </button>
      </div>

      {status && (
        <div className={`mt-5 p-4 rounded-xl flex items-center gap-3 text-sm ${
          status.type === 'success'
            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
            : 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300'
        }`}>
          {status.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {status.msg}
        </div>
      )}
    </div>
  );
};

export default ExchangeRateSettings;
