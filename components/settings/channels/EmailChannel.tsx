
import React from 'react';
import { Mail } from 'lucide-react';
import { EmailConfig } from '../../../types';

interface EmailChannelProps {
  config: EmailConfig;
  onChange: (config: EmailConfig) => void;
}

const EmailChannel: React.FC<EmailChannelProps> = ({ config, onChange }) => {
  return (
    <div className={`border rounded-xl p-6 transition-all ${config.enabled ? 'bg-white border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-80'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-500 text-white rounded-lg flex items-center justify-center">
            <Mail size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">邮件通知</h3>
            <p className="text-xs text-slate-500">发送提醒至指定邮箱 (需后端服务支持)</p>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">接收邮箱地址</label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="admin@example.com"
              value={config.email}
              onChange={(e) => onChange({ ...config, email: e.target.value })}
            />
          </div>
          <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg">
             <span>⚠️</span>
             <p>注意：由于是纯前端演示，无法直接通过 SMTP 发送邮件。真实环境中此配置将提交给后端服务。</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailChannel;
