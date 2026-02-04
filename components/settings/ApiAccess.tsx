import React, { useState } from 'react';
import { Terminal, Copy, Check, ShieldCheck, Server, KeyRound } from 'lucide-react';

const ApiAccess: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const apiUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/v1/resources` : '/api/v1/resources';

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white/90 dark:bg-slate-900/70 border border-white/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm animate-fade-in">
      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Terminal size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">API 集成中心</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            使用 Cloudflare Access 保护的 API，将 cyberTrack 接入自动化流程。
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Base URL</label>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
              <Server size={16} className="text-slate-400" />
              <code className="flex-1 text-sm font-mono text-slate-700 dark:text-slate-300 truncate">{apiUrl}</code>
              <button onClick={() => handleCopy(apiUrl)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck size={12} /> Authentication
            </label>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-3 text-sm text-indigo-800 dark:text-indigo-200">
              API 由 Cloudflare Access 保护。
              <br />
              外部系统调用时，请创建 <strong>Service Token</strong> 并在请求中携带 Access 头。
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">API 参考</h3>
          <div className="space-y-3">
            <div className="group border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 flex items-center gap-3">
                <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-1 rounded text-xs font-bold font-mono">GET</span>
                <code className="text-sm text-slate-600 dark:text-slate-300 font-mono">/api/v1/resources</code>
                <span className="text-xs text-slate-400 ml-auto">获取资源列表</span>
              </div>
            </div>

            <div className="group border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 flex items-center gap-3 cursor-pointer">
                <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 px-2 py-1 rounded text-xs font-bold font-mono">POST</span>
                <code className="text-sm text-slate-600 dark:text-slate-300 font-mono">/api/v1/resources</code>
                <span className="text-xs text-slate-400 ml-auto">创建新资源</span>
              </div>
              <div className="p-4 bg-slate-900 dark:bg-black text-slate-300 text-xs font-mono overflow-x-auto">
<pre>{`curl -X POST ${apiUrl} \\r
  -H "Content-Type: application/json" \\r
  -H "CF-Access-Client-Id: <SERVICE_TOKEN_ID>" \\r
  -H "CF-Access-Client-Secret: <SERVICE_TOKEN_SECRET>" \\r
  -d '{
    "name": "New Server",
    "provider": "AWS",
    "expiryDate": "2024-12-31",
    "cost": 100,
    "type": "VPS"
  }'`}</pre>
              </div>
            </div>

            <div className="group border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 flex items-center gap-3">
                <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 px-2 py-1 rounded text-xs font-bold font-mono">DELETE</span>
                <code className="text-sm text-slate-600 dark:text-slate-300 font-mono">/api/v1/resources/:id</code>
                <span className="text-xs text-slate-400 ml-auto">删除资源</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <KeyRound size={16} className="text-indigo-500" />
            Service Token 可在 Cloudflare Zero Trust 的 Access 设置中创建。
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiAccess;

