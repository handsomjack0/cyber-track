
import React, { useState } from 'react';
import { Resource } from '../../types';
import { analyzePortfolio } from '../../services/geminiService';
import { Sparkles, Bot, RefreshCw, ChevronRight, FileText, BarChart3 } from 'lucide-react';

interface AIAssistantProps {
  resources: Resource[];
}

const AIAssistant: React.FC<AIAssistantProps> = ({ resources }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (resources.length === 0) return;
    setLoading(true);
    setAnalysis(null);
    try {
      const result = await analyzePortfolio(resources);
      setAnalysis(result);
    } catch (error) {
      setAnalysis("无法生成分析报告，请稍后再试。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in">
      {/* Header Area */}
      <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-800/20 dark:to-slate-900">
        <div className="flex gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20 text-white transform transition-transform hover:scale-105">
            <Sparkles size={28} />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              AI 智能资产顾问
              <span className="inline-flex items-center rounded-full bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 text-xs font-bold text-violet-700 dark:text-violet-300 uppercase ring-1 ring-inset ring-violet-600/10">
                Gemini 2.0
              </span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-lg leading-relaxed">
              深度分析您的 {resources.length} 个资产，提供成本优化建议、续费风险预警及资源整合策略。
            </p>
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading || resources.length === 0}
          className={`group relative px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2.5 shadow-sm overflow-hidden
            ${loading || resources.length === 0
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' 
              : 'bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-700 hover:shadow-md hover:-translate-y-0.5'
            }`}
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          {loading ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              <span>正在分析...</span>
            </>
          ) : (
            <>
              <Bot size={18} className={resources.length > 0 ? "text-violet-200" : ""} />
              <span>{analysis ? '重新生成报告' : '开始智能分析'}</span>
              <ChevronRight size={16} className="opacity-50 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />

      {/* Content Area */}
      <div className="min-h-[200px] bg-white dark:bg-slate-900">
        
        {loading && (
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
            <div className="relative">
               <div className="w-16 h-16 rounded-full border-4 border-slate-100 dark:border-slate-800" />
               <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
               <Bot size={24} className="absolute inset-0 m-auto text-violet-500" />
            </div>
            <div className="space-y-2">
              <p className="text-slate-900 dark:text-white font-medium">正在生成分析报告...</p>
              <p className="text-slate-400 text-xs">正在请求 Google Gemini 模型分析您的资产组合</p>
            </div>
          </div>
        )}

        {!loading && !analysis && (
          <div className="py-16 flex flex-col items-center justify-center text-center opacity-60">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-5 text-slate-300 dark:text-slate-600">
              <BarChart3 size={40} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              暂无分析报告
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
              点击上方按钮，获取 AI 驱动的资产优化建议
            </p>
          </div>
        )}

        {analysis && !loading && (
          <div className="p-6 md:p-8 animate-fade-in bg-slate-50/50 dark:bg-black/20">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm ring-1 ring-slate-900/5">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
                  <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg text-violet-600 dark:text-violet-400">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">资产分析报告</h3>
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
