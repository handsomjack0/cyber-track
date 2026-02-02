import React, { useState } from 'react';
import { Resource } from '../types';
import { analyzePortfolio } from '../services/geminiService';
import { Sparkles, Bot, RefreshCw } from 'lucide-react';

interface AIAssistantProps {
  resources: Resource[];
}

const AIAssistant: React.FC<AIAssistantProps> = ({ resources }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await analyzePortfolio(resources);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
              <Sparkles className="text-yellow-300" />
              AI Portfolio Advisor
            </h2>
            <p className="text-indigo-100 max-w-xl">
              Use Gemini AI to analyze your VPS and Domain portfolio. Get insights on costs, 
              find consolidation opportunities, and ensure you never miss a renewal.
            </p>
          </div>
          <button 
            onClick={handleAnalyze}
            disabled={loading}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <RefreshCw className="animate-spin" /> : <Bot />}
            {loading ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>
      </div>

      {analysis && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
             <Bot className="text-violet-600" size={20} />
             <h3 className="font-semibold text-slate-800">Gemini Insights</h3>
          </div>
          <div className="p-8 prose prose-slate max-w-none">
             <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-mono text-sm">
                {analysis}
             </div>
          </div>
        </div>
      )}

      {!analysis && !loading && (
        <div className="text-center py-12 text-slate-400">
          <Bot size={48} className="mx-auto mb-4 opacity-20" />
          <p>Click "Run Analysis" to generate a report.</p>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;