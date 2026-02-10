import React, { useState, Suspense } from 'react';
import Sidebar from './components/layout/Sidebar';
import AddResourceModal from './components/resources/AddResourceModal';
import LoadingState from './components/common/LoadingState';
import LoginView from './components/auth/LoginView';
import { Resource, ResourceType } from './types/index';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useResourceManager } from './hooks/useResourceManager';

const DashboardView = React.lazy(() => import('./components/dashboard/DashboardView'));
const AnalyticsView = React.lazy(() => import('./components/analytics/AnalyticsView'));
const ResourceListView = React.lazy(() => import('./components/views/ResourceListView'));
const SettingsView = React.lazy(() => import('./components/settings/SettingsView'));

const AppContent: React.FC = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const { resources, isLoading, error, addResource, updateResource, deleteResource, refreshResources } = useResourceManager();

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

  const handleSaveResource = async (resourceData: Partial<Resource>) => {
    const isEdit = Boolean(resourceData.id) && resources.some(r => r.id === resourceData.id);

    try {
      if (isEdit) {
        await updateResource(resourceData as Resource);
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
    <div className="relative min-h-screen transition-colors duration-300">
      <div className="pointer-events-none absolute inset-0 blueprint-overlay" />
      <div className="pointer-events-none absolute left-6 top-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-sky-300">
        <div className="relative h-8 w-8">
          <span className="absolute left-1/2 top-0 h-full w-px bg-sky-400/60" />
          <span className="absolute left-0 top-1/2 h-px w-full bg-sky-400/60" />
          <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 border border-sky-400/60" />
        </div>
        <span>Origin 0,0</span>
      </div>
      <div className="pointer-events-none absolute right-8 top-8 text-[10px] uppercase tracking-[0.3em] text-sky-300">
        Grid 24px
      </div>
      <div className="pointer-events-none absolute right-8 bottom-8 flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-sky-300">
        <span>Scale 1:1</span>
        <div className="relative h-8 w-8">
          <span className="absolute left-1/2 top-0 h-full w-px bg-sky-400/60" />
          <span className="absolute left-0 top-1/2 h-px w-full bg-sky-400/60" />
          <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 border border-sky-400/60" />
        </div>
      </div>
      <div className="relative flex min-h-screen">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 p-6 lg:p-10 overflow-y-auto h-screen relative scroll-smooth no-scrollbar">
          <div className="blueprint-canvas relative min-h-full">
            <div className="blueprint-ruler top" />
            <div className="blueprint-ruler left" />
            {error && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-center justify-between gap-4 shadow-sm">
                <span>{error}</span>
                <button
                  onClick={() => refreshResources()}
                  className="px-3 py-1 rounded-md bg-white border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
            <Suspense fallback={<LoadingState />}>
              {renderContent()}
            </Suspense>
          </div>
        </main>
      </div>

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
