
import React, { useState } from 'react';
import { Send, CheckCircle, AlertCircle, Loader2, ShieldCheck, Bot, Terminal } from 'lucide-react';
import { TelegramConfig } from '../../../types';
import { sendTelegramTestMessage } from '../../../services/notifications/telegramService';

interface TelegramChannelProps {
  config: TelegramConfig;
  onChange: (config: TelegramConfig) => void;
}

const TelegramChannel: React.FC<TelegramChannelProps> = ({ config, onChange }) => {
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleTest = async () => {
    setTesting(true);
    setTestStatus('idle');
    try {
      await sendTelegramTestMessage(config);
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 3000);
    } catch (e) {
      console.error(e);
      setTestStatus('error');
    } finally {
      setTesting(false);
    }
  };

  // Get current host for display purposes
  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://your-project.pages.dev';
  const webhookUrl = `${currentHost}/api/webhook`;

  return (
    <div className={`border rounded-xl p-6 transition-all ${config.enabled ? 'bg-white border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-80'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-500 text-white rounded-lg flex items-center justify-center">
            <Send size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Telegram Bot</h3>
            <p className="text-xs text-slate-500">Cloudflare Function 安全代理发送</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={config.enabled}
            onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      {config.enabled && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Security Alert */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
            <div className="flex gap-2 items-start">
              <ShieldCheck className="text-indigo-600 shrink-0 mt-0.5" size={16} />
              <div className="text-xs text-indigo-800">
                <p className="font-semibold mb-1">后端配置指南</p>
                <p>Bot Token 不再通过前端保存。请在 Cloudflare Pages 项目的 <strong>Settings &gt; Environment variables</strong> 中添加：</p>
                <code className="block bg-white px-2 py-1 mt-1 rounded border border-indigo-200 font-mono text-indigo-600">
                  TELEGRAM_BOT_TOKEN
                </code>
              </div>
            </div>
          </div>

          {/* Chat ID Config */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Chat ID (接收通知)</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                placeholder="123456789"
                value={config.chatId}
                onChange={(e) => onChange({ ...config, chatId: e.target.value })}
              />
              <button
                onClick={handleTest}
                disabled={!config.chatId || testing}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors
                  ${testStatus === 'success' ? 'bg-green-100 text-green-700' : 
                    testStatus === 'error' ? 'bg-red-100 text-red-700' : 
                    'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {testing ? <Loader2 size={16} className="animate-spin" /> : 
                 testStatus === 'success' ? <CheckCircle size={16} /> : 
                 testStatus === 'error' ? <AlertCircle size={16} /> : 
                 <Send size={16} />}
                {testStatus === 'success' ? '发送成功' : testStatus === 'error' ? '发送失败' : '测试通知'}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">在 Telegram 搜索 <span className="font-mono">@userinfobot</span> 获取 ID。</p>
          </div>

          {/* Webhook Configuration Section */}
          <div className="border-t border-slate-100 pt-6">
            <h4 className="font-medium text-slate-900 flex items-center gap-2 mb-3">
              <Bot size={18} className="text-sky-500" />
              启用双向指令交互 (可选)
            </h4>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                要使 Bot 能够响应 <code className="bg-slate-200 px-1 rounded">/status</code> 或 <code className="bg-slate-200 px-1 rounded">/list</code> 等指令，您需要将 Bot 的 Webhook 设置为本站点的 API 地址。
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">1. 您的 Webhook 地址</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-white border border-slate-300 rounded px-2 py-1.5 text-xs font-mono text-slate-600 break-all select-all">
                      {webhookUrl}
                    </code>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">2. 设置指令 (复制并访问)</label>
                  <div className="mt-1 bg-slate-900 rounded-lg p-3 group relative">
                    <code className="text-xs font-mono text-green-400 break-all">
                      https://api.telegram.org/bot<span className="text-yellow-400">&lt;YOUR_BOT_TOKEN&gt;</span>/setWebhook?url={webhookUrl}
                    </code>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Terminal size={14} className="text-slate-500" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    请将 <span className="text-slate-600 font-mono">&lt;YOUR_BOT_TOKEN&gt;</span> 替换为您真实的 Token，并在浏览器中访问该链接以激活 Webhook。
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default TelegramChannel;
