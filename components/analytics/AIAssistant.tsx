import React, { useState } from 'react';
import { Resource } from '../../types';
import { analyzePortfolio, AiProvider } from '../../services/geminiService';
import { Sparkles, Bot, RefreshCw, ChevronRight, FileText, BarChart3 } from 'lucide-react';

interface AIAssistantProps {
  resources: Resource[];
}

const AIAssistant: React.FC<AIAssistantProps> = ({ resources }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<AiProvider>('openai');
  const [model, setModel] = useState('gpt-4o-mini');
  const [cacheNote, setCacheNote] = useState<string | null>(null);

  const providerModels: Record<AiProvider, { label: string; value: string }[]> = {
    openai: [
      { label: 'gpt-4o-mini (推荐)', value: 'gpt-4o-mini' },
      { label: 'gpt-4o', value: 'gpt-4o' },
      { label: 'gpt-4.1-mini', value: 'gpt-4.1-mini' }
    ],
    deepseek: [
      { label: 'deepseek-chat', value: 'deepseek-chat' },
      { label: 'deepseek-reasoner', value: 'deepseek-reasoner' }
    ],
    openrouter: [
      { label: 'openrouter/auto', value: 'openrouter/auto' },
      { label: 'openai/gpt-4o-mini', value: 'openai/gpt-4o-mini' },
      { label: 'deepseek/deepseek-chat', value: 'deepseek/deepseek-chat' }
    ],
    github: [
      { label: 'gpt-4o-mini', value: 'gpt-4o-mini' },
      { label: 'phi-3-mini', value: 'phi-3-mini' },
      { label: 'mistral-small', value: 'mistral-small' }
    ],
    custom: [
      { label: '自定义模型', value: 'custom-model' }
    ],
    gemini: [
      { label: 'gemini-1.5-flash', value: 'gemini-1.5-flash' },
      { label: 'gemini-1.5-pro', value: 'gemini-1.5-pro' }
    ]
  };

  const handleProviderChange = (next: AiProvider) => {
    setProvider(next);
    const models = providerModels[next];
    if (models && models.length > 0) {
      setModel(models[0].value);
    } else {
      setModel('');
    }
  };

  const hashResources = (items: Resource[]) => {
    const input = JSON.stringify(items.map(r => ({
      id: r.id,
      name: r.name,
      provider: r.provider,
      expiryDate: r.expiryDate,
      cost: r.cost,
      currency: r.currency,
      type: r.type,
      status: r.status,
      tags: r.tags || []
    })));
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
      hash = (hash * 31 + input.charCodeAt(i)) | 0;
    }
    return String(hash);
  };

  const getCacheKey = () => `ai_analysis:${provider}:${model}:${hashResources(resources)}`;

  const readCache = () => {
    try {
      const raw = localStorage.getItem(getCacheKey());
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { analysis: string; ts: number };
      const age = Date.now() - parsed.ts;
      const ttl = 24 * 60 * 60 * 1000;
      if (age > ttl) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const writeCache = (text: string) => {
    try {
      localStorage.setItem(getCacheKey(), JSON.stringify({ analysis: text, ts: Date.now() }));
    } catch {
      // ignore storage errors
    }
  };

  const handleAnalyze = async () => {
    if (resources.length === 0) return;
    setLoading(true);
    setAnalysis(null);
    setCacheNote(null);
    try {
      const result = await analyzePortfolio(resources, provider, model);
      setAnalysis(result);
      writeCache(result);
    } catch (error) {
      const cached = readCache();
      if (cached?.analysis) {
        setAnalysis(cached.analysis);
        setCacheNote('已显示上次缓存结果（当前请求失败）。');
      } else {
        setAnalysis('无法生成分析报告，请稍后再试。');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/90 dark:bg-slate-900/70 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-sm overflow-hidden animate-fade-in blueprint-card">
      <span className="blueprint-dimension" data-dim="ASSIST" />
      <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-slate-900/50 border-b border-slate-200/20">
        <div className="flex gap-5">
          <div className="w-12 h-12 rounded-xl border border-sky-400/40 bg-sky-400/10 text-sky-200 flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles size={24} />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              AI 资产顾问
              <span className="inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase ring-1 ring-inset ring-indigo-600/10">
                {provider.toUpperCase()}
              </span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-lg leading-relaxed">
              深度分析你的 {resources.length} 个资源，提供成本优化建议、到期风险提醒与整合策略。未配置的 AI 平台不会影响其他功能。
            </p>
            {cacheNote && (
              <p className="text-xs text-slate-400 mt-1">{cacheNote}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as AiProvider)}
              className="appearance-none px-3 py-2 rounded-xl border border-sky-400/30 bg-slate-900/60 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
            >
              <option value="openai">OpenAI</option>
              <option value="deepseek">DeepSeek</option>
              <option value="github">GitHub Models</option>
              <option value="openrouter">OpenRouter</option>
              <option value="custom">自建公益站</option>
              <option value="gemini">Gemini</option>
            </select>
            <div className="relative">
              <input
                list={`ai-models-${provider}`}
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="输入模型名"
                className="appearance-none px-3 py-2 rounded-xl border border-sky-400/30 bg-slate-900/60 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400/30 w-[200px]"
              />
              <datalist id={`ai-models-${provider}`}>
                {providerModels[provider].map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </datalist>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || resources.length === 0}
            className={`group relative px-6 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 flex items-center gap-2.5 shadow-sm overflow-hidden
              ${loading || resources.length === 0
                ? 'bg-slate-800/60 text-slate-400 cursor-not-allowed'
                : 'bg-sky-400/20 text-sky-100 border border-sky-400/40 hover:bg-sky-400/30 hover:shadow-md hover:-translate-y-0.5'
              }`}
          >
            <div className="absolute inset-0 bg-sky-200/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            {loading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>分析中...</span>
              </>
            ) : (
              <>
                <Bot size={18} className={resources.length > 0 ? 'text-sky-200' : ''} />
                <span>{analysis ? '重新生成报告' : '开始分析'}</span>
                <ChevronRight size={16} className="opacity-50 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>

      <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />

      <div className="min-h-[200px] bg-white/80 dark:bg-slate-900/70">
        {loading && (
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-slate-100 dark:border-slate-800" />
              <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
              <Bot size={24} className="absolute inset-0 m-auto text-indigo-500" />
            </div>
            <div className="space-y-2">
              <p className="text-slate-900 dark:text-white font-medium">正在生成分析报告...</p>
              <p className="text-slate-400 text-xs">正在请求 Gemini 模型分析你的资产组合</p>
            </div>
          </div>
        )}

        {!loading && !analysis && (
          <div className="py-16 flex flex-col items-center justify-center text-center opacity-70">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-5 text-slate-300 dark:text-slate-600">
              <BarChart3 size={40} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">暂无分析报告</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
              点击上方按钮，获得 AI 驱动的优化建议。
            </p>
          </div>
        )}

        {analysis && !loading && (
          <div className="p-6 md:p-8 animate-fade-in bg-slate-50/60 dark:bg-black/20">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm ring-1 ring-slate-900/5">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">资产分析报告</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">基于实时数据生成</p>
                </div>
                <span className="text-xs text-slate-400 ml-auto font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                  {new Date().toLocaleDateString()}
                </span>
              </div>

              <div className="prose prose-slate dark:prose-invert prose-sm max-w-none">
                <div className="whitespace-pre-wrap leading-relaxed text-slate-600 dark:text-slate-300 font-sans">
                  {analysis}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;

