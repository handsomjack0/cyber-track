
import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import DashboardView from './components/dashboard/DashboardView';
import AnalyticsView from './components/analytics/AnalyticsView';
import ResourceTable from './components/resources/ResourceTable';
import AddResourceModal from './components/resources/AddResourceModal';
import SettingsView from './components/settings/SettingsView';
import { Resource, ResourceType } from './types';
import { ThemeProvider } from './context/ThemeContext';
import { resourceService } from './services/resourceService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  // Load resources on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const data = await resourceService.fetchAll();
      setResources(data);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('确定要删除这个资源吗？')) {
      // Optimistic update
      const original = [...resources];
      setResources(prev => prev.filter(r => r.id !== id));
      
      try {
        await resourceService.delete(id);
      } catch (e) {
        alert('删除失败，数据已回滚');
        setResources(original);
      }
    }
  };

  const handleSaveResource = async (resourceData: Resource) => {
    // Determine if it's an edit or add based on if we have editingResource or ID existence
    // Ideally the modal returns the full object.
    
    // Optimistic UI update requires knowing if it's new or existing
    const isEdit = resources.some(r => r.id === resourceData.id);

    try {
      let savedResource: Resource;
      if (isEdit) {
        savedResource = await resourceService.update(resourceData);
        setResources(prev => prev.map(r => r.id === savedResource.id ? savedResource : r));
      } else {
        // For new resources, the ID might be temp, backend generates one or confirms it
        // But our current backend trusts client ID or generates one.
        // Let's assume we pass the data without ID for create if it was purely backend gen,
        // but here we used Date.now() in modal.
        savedResource = await resourceService.create(resourceData);
        setResources(prev => [...prev, savedResource]);
      }
    } catch (e) {
      console.error(e);
      alert('保存失败');
      // In a real app, we would reload data here
    }

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
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full text-slate-400 gap-2">
           <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
           加载资源中...
        </div>
      );
    }

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
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
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
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
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
