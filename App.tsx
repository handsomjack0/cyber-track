
import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import DashboardView from './components/dashboard/DashboardView';
import AnalyticsView from './components/analytics/AnalyticsView';
import ResourceListView from './components/views/ResourceListView';
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
    const isEdit = resources.some(r => r.id === resourceData.id);

    try {
      let savedResource: Resource;
      if (isEdit) {
        savedResource = await resourceService.update(resourceData);
        setResources(prev => prev.map(r => r.id === savedResource.id ? savedResource : r));
      } else {
        savedResource = await resourceService.create(resourceData);
        setResources(prev => [...prev, savedResource]);
      }
    } catch (e) {
      console.error(e);
      alert('保存失败');
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
          <ResourceListView 
            title="VPS 实例" 
            subtitle="管理所有虚拟主机和云服务器"
            resources={resources}
            resourceType={ResourceType.VPS}
            onAdd={openAddModal}
            onEdit={openEditModal}
            onDelete={handleDelete}
            addButtonLabel="添加 VPS"
          />
        );
      case 'domains':
        return (
          <ResourceListView 
            title="域名资产" 
            subtitle="监控域名有效期及 SSL 证书"
            resources={resources}
            resourceType={ResourceType.DOMAIN}
            onAdd={openAddModal}
            onEdit={openEditModal}
            onDelete={handleDelete}
            addButtonLabel="添加域名"
          />
        );
      case 'accounts':
        return (
          <ResourceListView 
            title="账号管理" 
            subtitle="管理会员订阅、软件授权及其他账号服务"
            resources={resources}
            resourceType={ResourceType.ACCOUNT}
            onAdd={openAddModal}
            onEdit={openEditModal}
            onDelete={handleDelete}
            addButtonLabel="添加账号"
          />
        );
      case 'cellphones':
        return (
          <ResourceListView 
            title="手机号码" 
            subtitle="管理手机号码有效期及保号套餐"
            resources={resources}
            resourceType={ResourceType.PHONE_NUMBER}
            onAdd={openAddModal}
            onEdit={openEditModal}
            onDelete={handleDelete}
            addButtonLabel="添加号码"
          />
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
