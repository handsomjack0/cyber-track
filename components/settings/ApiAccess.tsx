
import React, { useState } from 'react';
import { Terminal, Copy, Check, Lock, Server } from 'lucide-react';

const ApiAccess: React.FC = () => {
  const [copied, setCopied] = useState(false);
  
  // In a real scenario, this might come from a prop or be hidden, 
  // but for a static dashboard, we guide the user where to find it.
  const apiUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/v1/resources` : '/api/v1/resources';

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm animate-fade-in">
      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="w-10 h-10 bg-emerald-500 text-white rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Terminal size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">API 集成中心</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            使用 RESTful API 将 CloudTrack 集成到您的 CI/CD 或监控系统中。
          </p>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* Endpoint & Auth */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Base URL</label>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
              <Server size={16} className="text-slate-400" />
              <code className="flex-1 text-sm font-mono text-slate-700 dark:text-slate-300 truncate">{apiUrl}</code>
              <button onClick={() => handleCopy(apiUrl)} className="text-slate-400 hover:text-indigo-500 transition-colors">
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
             <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
               <Lock size={12} /> Authentication
             </label>
             <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-200">
                请在请求头中添加 <code className="bg-white dark:bg-black/30 px-1.5 py-0.5 rounded font-mono font-bold">x-api-key</code>。
                <br/>
                API Key 需要在 Cloudflare 环境变量中配置 <code className="font-mono">API_SECRET</code>。
             </div>
          </div>
        </div>

        {/* Documentation */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">API 参考文档</h3>
          <div className="space-y-3">
            
            {/* GET */}
            <div className="group border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 flex items-center gap-3">
                <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-1 rounded text-xs font-bold font-mono">GET</span>
                <code className="text-sm text-slate-600 dark:text-slate-300 font-mono">/api/v1/resources</code>
                <span className="text-xs text-slate-400 ml-auto">获取资产列表</span>
              </div>
            </div>

            {/* POST */}
            <div className="group border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 flex items-center gap-3 cursor-pointer">
                <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-1 rounded text-xs font-bold font-mono">POST</span>
                <code className="text-sm text-slate-600 dark:text-slate-300 font-mono">/api/v1/resources</code>
                <span className="text-xs text-slate-400 ml-auto">创建新资产</span>
              </div>
              <div className="p-4 bg-slate-900 dark:bg-black text-slate-300 text-xs font-mono overflow-x-auto">
<pre>{`curl -X POST ${apiUrl} \\
  -H "x-api-key: YOUR_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "New Server",
    "provider": "AWS",
    "expiryDate": "2024-12-31",
    "cost": 100,
    "type": "VPS"
  }'`}</pre>
              </div>
            </div>

             {/* DELETE */}
             <div className="group border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 flex items-center gap-3">
                <span className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 px-2 py-1 rounded text-xs font-bold font-mono">DELETE</span>
                <code className="text-sm text-slate-600 dark:text-slate-300 font-mono">/api/v1/resources/:id</code>
                <span className="text-xs text-slate-400 ml-auto">删除资产</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default ApiAccess;
