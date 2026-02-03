
import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import DashboardView from './components/dashboard/DashboardView';
import AnalyticsView from './components/analytics/AnalyticsView';
import ResourceListView from './components/views/ResourceListView';
import AddResourceModal from './components/resources/AddResourceModal';
import SettingsView from './components/settings/SettingsView';
import LoadingState from './components/common/LoadingState';
import LoginView from './components/auth/LoginView';
import { Resource, ResourceType } from './types/index';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useResourceManager } from './hooks/useResourceManager';

// Separate content component to use Auth Context
const AppContent: React.FC = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Logic separated into custom hook
  const { resources, isLoading, addResource, updateResource, deleteResource } = useResourceManager();
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  if (authLoading) return <LoadingState />;
  if (!isAuthenticated) return <LoginView />;

  const handleDelete = async (id: string) => {
    if (window.confirm('确定要删除这个资源吗？此操作不可恢复。')) {
      try {
        await deleteResource(id);
      } catch (e) {
        alert(`删除操作失败: ${e instanceof Error ? e.message : '未知错误'}`);
      }
    }
  };

  const handleSaveResource = async (resourceData: Resource) => {
    const isEdit = resources.some(r => r.id === resourceData.id);

    try {
      if (isEdit) {
        await updateResource(resourceData);
      } else {
        await addResource(resourceData);
      }
      setIsModalOpen(false);
      setEditingResource(null);
    } catch (e) {
      alert(`保存失败: ${e instanceof Error ? e.message : '请检查网络连接或数据库配置'}`);
      console.error(e);
    }
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
      return <LoadingState />;
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
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto h-screen relative scroll-smooth no-scrollbar">
        {renderContent()}
      </main>

      <AddResourceModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingResource(null); }} 
        onSave={handleSaveResource}
        initialData={editingResource}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
