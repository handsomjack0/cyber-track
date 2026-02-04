import React, { useState, useEffect } from 'react';
import { Bell, Clock, Save, Loader2, AlertTriangle, AlertCircle } from 'lucide-react';
import { AppSettings } from '../../types';
import { getSettings, saveSettings } from '../../services/settings/settingsService';
import TelegramChannel from './channels/TelegramChannel';
import EmailChannel from './channels/EmailChannel';
import WebhookChannel from './channels/WebhookChannel';

const NotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await getSettings();
      setSettings(data);
      setLoading(false);
      setHasChanges(false);
    };
    load();
  }, []);

  const handleChange = (newSettings: AppSettings) => {
    setSettings(newSettings);
    setHasChanges(true);
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setSaveStatus('idle');

    try {
      await saveSettings(settings);
      setSaveStatus('success');
      setHasChanges(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e) {
      console.error(e);
      setSaveStatus('error');
      alert('保存失败：无法连接到后端数据库，但已保存到本地缓存。');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-sky-300" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white/90 dark:bg-slate-900/70 p-6 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-sm relative">
        {hasChanges && (
          <div className="absolute top-0 right-0 -mt-2 -mr-2 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-500"></span>
          </div>
        )}

        <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="text-sky-300 dark:text-sky-300" size={20} />
              通知通道配置
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              配置你希望接收提醒的方式与频率。
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || (!hasChanges && saveStatus !== 'success')}
            className={`px-6 py-2.5 rounded-2xl text-sm font-semibold flex items-center gap-2 transition-all shadow-sm
              ${saveStatus === 'success'
                ? 'bg-indigo-600 text-white ring-2 ring-sky-300/40 dark:ring-indigo-900'
                : saveStatus === 'error'
                  ? 'bg-rose-600 text-white'
                  : hasChanges
                    ? 'bg-sky-400/30 hover:bg-sky-400/40 text-white shadow-sky-300/20 translate-y-0'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> :
             saveStatus === 'success' ? <CheckCircleIcon /> :
             saveStatus === 'error' ? <AlertCircle size={16} /> :
             <Save size={16} />}

            {saving ? '保存中...' :
             saveStatus === 'success' ? '已保存' :
             saveStatus === 'error' ? '保存失败' :
             '保存配置'}
          </button>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
            <Clock size={16} />
            提前通知时间（默认策略）
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="30"
              value={settings.reminderDays}
              onChange={(e) => handleChange({ ...settings, reminderDays: parseInt(e.target.value) })}
              className="w-64 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <span className="font-mono font-bold text-sky-300 dark:text-sky-300 w-8 text-center">{settings.reminderDays}</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">天前发送提醒</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <AlertTriangle size={12} />
            单个资产可以单独覆盖此设置。系统也会在到期前 3 天、1 天及当天自动提醒。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TelegramChannel
            config={settings.telegram}
            onChange={(cfg) => handleChange({ ...settings, telegram: cfg })}
          />
          <EmailChannel
            config={settings.email}
            onChange={(cfg) => handleChange({ ...settings, email: cfg })}
          />
          <WebhookChannel
            config={settings.webhook}
            onChange={(cfg) => handleChange({ ...settings, webhook: cfg })}
          />
        </div>
      </div>
    </div>
  );
};

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);

export default NotificationSettings;


