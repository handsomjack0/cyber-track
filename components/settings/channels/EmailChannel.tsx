import React from 'react';
import { Mail } from 'lucide-react';
import { EmailConfig } from '../../../types';

interface EmailChannelProps {
  config: EmailConfig;
  onChange: (config: EmailConfig) => void;
}

const EmailChannel: React.FC<EmailChannelProps> = ({ config, onChange }) => {
  return (
    <div className={`border rounded-xl p-6 transition-all ${config.enabled ? 'bg-white/90 dark:bg-slate-900/70 border-sky-400/30 dark:border-slate-800 shadow-sm' : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/60 opacity-80'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-500 text-white rounded-lg flex items-center justify-center">
            <Mail size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">邮件通知</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">发送提醒至指定邮箱（需要后端支持）</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={config.enabled}
            onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-400/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
        </label>
      </div>

      {config.enabled && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">接收邮箱地址</label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-sky-400/40 focus:border-transparent bg-white dark:bg-slate-900/70"
              placeholder="admin@example.com"
              value={config.email}
              onChange={(e) => onChange({ ...config, email: e.target.value })}
            />
          </div>
          <div className="flex items-start gap-2 text-xs text-sky-300 bg-sky-400/10 dark:bg-amber-900/20 p-3 rounded-lg">
            <span>⚠️</span>
            <p>提示：当前为前端演示，邮件发送需要后端服务支持。</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailChannel;

