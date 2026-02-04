import React from 'react';
import { Webhook } from 'lucide-react';
import { WebhookConfig } from '../../../types';

interface WebhookChannelProps {
  config: WebhookConfig;
  onChange: (config: WebhookConfig) => void;
}

const WebhookChannel: React.FC<WebhookChannelProps> = ({ config, onChange }) => {
  return (
    <div className={`border rounded-xl p-6 transition-all ${config.enabled ? 'bg-white/90 dark:bg-slate-900/70 border-indigo-200 dark:border-slate-800 shadow-sm' : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/60 opacity-80'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center">
            <Webhook size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Webhook</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">推送到 Discord、Slack 或自定义 API</p>
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
        <div className="space-y-4 animate-fade-in">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Webhook URL</label>
            <input
              type="url"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono bg-white dark:bg-slate-900/70"
              placeholder="https://discord.com/api/webhooks/..."
              value={config.url}
              onChange={(e) => onChange({ ...config, url: e.target.value })}
            />
          </div>
          <div className="text-xs text-slate-400">
            系统会向该地址发送包含到期信息的 JSON POST 请求。
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookChannel;
