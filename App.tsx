
import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import DashboardView from './components/dashboard/DashboardView';
import AnalyticsView from './components/analytics/AnalyticsView';
import ResourceTable from './components/resources/ResourceTable';
import AddResourceModal from './components/resources/AddResourceModal';
import SettingsView from './components/settings/SettingsView';
import { Resource, ResourceType, Status } from './types';
import { ThemeProvider } from './context/ThemeContext';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  // Initialize with empty array for production
  const [resources, setResources] = useState<Resource[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这个资源吗？')) {
      setResources(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleSaveResource = (resource: Resource) => {
    setResources(prev => {
      // Check if updating existing
      const exists = prev.some(r => r.id === resource.id);
      if (exists) {
        return prev.map(r => r.id === resource.id ? resource : r);
      }
      // Or adding new
      return [...prev, resource];
    });
    // Reset editing state after save
    setEditingResource(null);
  };

  const openAddModal = () => {
    setEditingResource(null);
    setIsModalOpen(true);
  };

  const openEditModal = (resource: Resource) => {
    setEditingResource(resource);
    setIsModalOpen(true);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView 
            resources={resources} 
            onOpenAddModal={openAddModal} 
            onEditResource={openEditModal}
            onDeleteResource={handleDelete}
          />
        );
      case 'analytics':
        return <AnalyticsView resources={resources} />;
      case 'vps':
        return (
          <div className="max-w-7xl mx-auto space-y-6">
             <div className="flex justify-between items-end">
                <div>
                   <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">VPS 实例</h1>
                   <p className="text-slate-500 dark:text-slate-400 mt-1">管理所有虚拟主机和云服务器</p>
                </div>
                <button 
                  onClick={openAddModal}
                  className="bg-black dark:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors"
                >
                  添加 VPS
                </button>
             </div>
             <ResourceTable 
                title="VPS List" 
                resources={resources.filter(r => r.type === ResourceType.VPS)} 
                onDelete={handleDelete}
                onEdit={openEditModal}
                hideHeader
              />
          </div>
        );
      case 'domains':
        return (
          <div className="max-w-7xl mx-auto space-y-6">
             <div className="flex justify-between items-end">
                <div>
                   <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">域名资产</h1>
                   <p className="text-slate-500 dark:text-slate-400 mt-1">监控域名有效期及 SSL 证书</p>
                </div>
                <button 
                  onClick={openAddModal}
                  className="bg-black dark:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors"
                >
                  添加域名
                </button>
             </div>
             <ResourceTable 
                title="Domain List" 
                resources={resources.filter(r => r.type === ResourceType.DOMAIN)} 
                onDelete={handleDelete}
                onEdit={openEditModal}
                hideHeader
              />
          </div>
        );
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <DashboardView 
            resources={resources} 
            onOpenAddModal={openAddModal}
            onEditResource={openEditModal}
            onDeleteResource={handleDelete}
          />
        );
    }
  };

  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto h-screen relative scroll-smooth">
          {renderContent()}
        </main>

        <AddResourceModal 
          isOpen={isModalOpen} 
          onClose={() => { setIsModalOpen(false); setEditingResource(null); }} 
          onSave={handleSaveResource}
          initialData={editingResource}
        />
      </div>
    </ThemeProvider>
  );
};

export default App;
