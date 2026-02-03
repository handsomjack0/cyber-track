
import React from 'react';
import NotificationSettings from './NotificationSettings';
import ApiAccess from './ApiAccess';
import DataManagement from './DataManagement';

const SettingsView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">全局设置</h1>
        <p className="text-slate-500 dark:text-slate-400">管理应用偏好、通知服务及 API 集成</p>
      </div>
      
      <NotificationSettings />
      
      <div className="border-t border-slate-200 dark:border-slate-800 pt-10">
        <DataManagement />
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-10">
        <ApiAccess />
      </div>
    </div>
  );
};

export default SettingsView;
