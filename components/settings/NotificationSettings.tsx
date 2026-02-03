import React, { useState, useEffect } from 'react';
import { Bell, Clock, Save, Loader2, Zap, CheckCircle, AlertTriangle } from 'lucide-react';
import { AppSettings } from '../../types';
import { getSettings, saveSettings } from '../../services/settings/settingsService';
import TelegramChannel from './channels/TelegramChannel';
import EmailChannel from './channels/EmailChannel';
import WebhookChannel from './channels/WebhookChannel';

const NotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  
  // Trigger State
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<{count: number} | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await getSettings();
      setSettings(data);
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (settings) {
      await saveSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleManualTrigger = async () => {
    setTriggering(true);
    setTriggerResult(null);
    try {
      // Use the demo secret for frontend-initiated triggers (in prod use real auth)
      const res = await fetch('/api/cron/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'demo-secret' 
        }
      });
      const data = await res.json();
      if (data.success) {
        setTriggerResult({ count: data.notifications_sent });
      }
    } catch (e) {
      console.error(e);
      alert('触发失败');
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Manual Trigger Card */}
      <div className="bg-gradient-to-r from-indigo-500 to-violet-600 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Zap className="text-yellow-300" fill="currentColor" />
            立即检查到期资产
          </h3>
          <p className="text-indigo-100 text-sm mt-1 max-w-lg">
            系统通常会自动检查（需配置 Cron）。您也可以点击此按钮立即扫描所有资产，并向符合条件的接收端发送通知。
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={handleManualTrigger}
            disabled={triggering}
            className="bg-white text-indigo-600 hover:bg-indigo-50 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-70 flex items-center gap-2"
          >
            {triggering ? <Loader2 className="animate-spin" size={16} /> : <Bell size={16} />}
            {triggering ? '扫描中...' : '运行检查 & 发送提醒'}
          </button>
          {triggerResult && (
             <div className="text-xs bg-white/20 px-3 py-1 rounded-full flex items-center gap-1.5 animate-fade-in">
               <CheckCircle size={12} />
               已发送 {triggerResult.count} 条提醒
             </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="text-indigo-600 dark:text-indigo-400" size={20} />
              通知渠道配置
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              配置您希望接收到期提醒的方式和频率。
            </p>
          </div>
          <button 
            onClick={handleSave}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm
              ${saved ? 'bg-green-600 text-white' : 'bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-700'}`}
          >
            {saved ? '已保存' : '保存配置'}
            {!saved && <Save size={16} />}
          </button>
        </div>

        {/* Global Reminder Setting */}
        <div className="mb-8">
           <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
             <Clock size={16} />
             提前通知时间 (默认策略)
           </label>
           <div className="flex items-center gap-3">
             <input 
                type="range" 
                min="1" 
                max="30" 
                value={settings.reminderDays}
                onChange={(e) => setSettings({...settings, reminderDays: parseInt(e.target.value)})}
                className="w-64 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
             />
             <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 w-8 text-center">{settings.reminderDays}</span>
             <span className="text-sm text-slate-500 dark:text-slate-400">天前发送提醒</span>
           </div>
           <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
             <AlertTriangle size={12} />
             单个资产可以单独覆盖此设置。系统还会在到期前 3天、1天 和 过期当天 自动发送紧急提醒。
           </p>
        </div>

        {/* Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <TelegramChannel 
             config={settings.telegram} 
             onChange={(cfg) => setSettings({...settings, telegram: cfg})} 
           />
           <EmailChannel 
             config={settings.email} 
             onChange={(cfg) => setSettings({...settings, email: cfg})} 
           />
           <WebhookChannel 
             config={settings.webhook} 
             onChange={(cfg) => setSettings({...settings, webhook: cfg})} 
           />
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
