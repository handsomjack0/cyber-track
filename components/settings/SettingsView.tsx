import React from 'react';
import NotificationSettings from './NotificationSettings';
import ApiAccess from './ApiAccess';
import DataManagement from './DataManagement';
import ExchangeRateSettings from './ExchangeRateSettings';

const SettingsView: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 animate-fade-in">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-indigo-500 font-semibold">Settings</div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white mt-1 blueprint-title">全局设置</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">管理通知、数据备份与 API 集成策略。</p>
      </div>

      <NotificationSettings />

      <div className="border-t border-slate-200/70 dark:border-slate-800/70 pt-10">
        <ExchangeRateSettings />
      </div>

      <div className="border-t border-slate-200/70 dark:border-slate-800/70 pt-10">
        <DataManagement />
      </div>

      <div className="border-t border-slate-200/70 dark:border-slate-800/70 pt-10">
        <ApiAccess />
      </div>
    </div>
  );
};

export default SettingsView;
