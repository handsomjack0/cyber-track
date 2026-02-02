
import React from 'react';
import { LayoutGrid, Server, Globe, Settings, Command, PieChart } from 'lucide-react';
import ThemeToggle from '../common/ThemeToggle';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: '概览', icon: <LayoutGrid size={20} /> },
    { id: 'analytics', label: '数据分析', icon: <PieChart size={20} /> },
    { id: 'vps', label: 'VPS 实例', icon: <Server size={20} /> },
    { id: 'domains', label: '域名资产', icon: <Globe size={20} /> },
    { id: 'settings', label: '全局设置', icon: <Settings size={20} /> },
  ];

  return (
    <div className="w-20 lg:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen sticky top-0 transition-colors duration-300 z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
          <Command size={18} />
        </div>
        <span className="font-bold text-lg tracking-tight hidden lg:block text-slate-900 dark:text-white">CloudTrack</span>
      </div>

      <nav className="flex-1 px-3 space-y-1 mt-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
              activeTab === item.id
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <div className={`${activeTab === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'}`}>
              {item.icon}
            </div>
            <span className="hidden lg:block text-sm">{item.label}</span>
            
            {/* Tooltip for mobile/collapsed state */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 lg:hidden pointer-events-none whitespace-nowrap z-50">
              {item.label}
            </div>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors flex-1 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs text-white font-medium shrink-0 shadow-md">
            Admin
          </div>
          <div className="hidden lg:flex flex-col overflow-hidden">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">Administrator</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">Pro Plan</span>
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
