import React from 'react';
import { LayoutGrid, Server, Globe, Settings, Command, PieChart, Smartphone, Key } from 'lucide-react';
import ThemeToggle from '../common/ThemeToggle';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: '概览', icon: <LayoutGrid size={18} /> },
    { id: 'analytics', label: '数据分析', icon: <PieChart size={18} /> },
    { id: 'vps', label: 'VPS 实例', icon: <Server size={18} /> },
    { id: 'domains', label: '域名资产', icon: <Globe size={18} /> },
    { id: 'accounts', label: '账号管理', icon: <Key size={18} /> },
    { id: 'cellphones', label: '手机号码', icon: <Smartphone size={18} /> },
    { id: 'settings', label: '全局设置', icon: <Settings size={18} /> },
  ];

  return (
    <div className="w-20 lg:w-64 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border-r border-white/60 dark:border-slate-800/60 flex flex-col h-screen sticky top-0 z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
          <Command size={18} />
        </div>
        <div className="hidden lg:block">
          <div className="font-semibold text-slate-900 dark:text-white tracking-tight">cyberTrack</div>
          <div className="text-xs text-slate-400">Insight Console</div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 mt-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
              activeTab === item.id
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-200 font-semibold shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <div className={`${activeTab === item.id ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'}`}>
              {item.icon}
            </div>
            <span className="hidden lg:block text-sm">{item.label}</span>

            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 lg:hidden pointer-events-none whitespace-nowrap z-50">
              {item.label}
            </div>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/60 dark:border-slate-800/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/70 dark:hover:bg-slate-800/60 cursor-pointer transition-colors flex-1 overflow-hidden">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-500 flex items-center justify-center text-xs text-white font-semibold shrink-0 shadow-md">
            Admin
          </div>
          <div className="hidden lg:flex flex-col overflow-hidden">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">Administrator</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">Workspace</span>
          </div>
        </div>
        <div className="hidden lg:block">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

