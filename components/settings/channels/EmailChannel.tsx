import React, { useState } from 'react';
import { Mail, Send, CheckCircle, AlertCircle, Loader2, Info } from 'lucide-react';
import { EmailConfig } from '../../../types';
import { sendEmailTestMessage } from '../../../services/notifications/emailService';

interface EmailChannelProps {
  config: EmailConfig;
  onChange: (config: EmailConfig) => void;
}

const EmailChannel: React.FC<EmailChannelProps> = ({ config, onChange }) => {
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleTest = async () => {
    setTesting(true);
    setTestStatus('idle');
    try {
      await sendEmailTestMessage(config);
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 3000);
    } catch (e: any) {
      console.error(e);
      setTestStatus('error');
      if (e.message?.includes('RESEND_API_KEY') || e.message?.includes('RESEND_FROM')) {
        alert('测试失败：后端未配置 RESEND_API_KEY / RESEND_FROM。请在 Cloudflare 设置中添加。');
      }
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className={`border rounded-xl p-6 transition-all ${config.enabled ? 'bg-white/90 dark:bg-slate-900/70 border-sky-400/30 dark:border-slate-800 shadow-sm' : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/60 opacity-80'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-500 text-white rounded-lg flex items-center justify-center">
            <Mail size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">邮件通知</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">发送提醒至指定邮箱（Resend API）</p>
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
            <div className="flex gap-2">
              <input
                type="email"
                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-sky-400/40 focus:border-transparent bg-white dark:bg-slate-900/70"
                placeholder="admin@example.com"
                value={config.email}
                onChange={(e) => onChange({ ...config, email: e.target.value })}
              />
              <button
                onClick={handleTest}
                disabled={!config.email || testing}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors
                  ${testStatus === 'success' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    testStatus === 'error' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                {testing ? <Loader2 size={16} className="animate-spin" /> :
                  testStatus === 'success' ? <CheckCircle size={16} /> :
                  testStatus === 'error' ? <AlertCircle size={16} /> :
                  <Send size={16} />}
                {testStatus === 'success' ? '发送成功' : testStatus === 'error' ? '发送失败' : '发送测试'}
              </button>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 dark:text-slate-400">
              <Info size={12} />
              <span>邮件由 Resend 发送，请确保后端已配置 RESEND_API_KEY 与 RESEND_FROM。</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailChannel;
