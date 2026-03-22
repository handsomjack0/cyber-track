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

  const { resources, isLoading, error, addResource, updateResource, renewResource, deleteResource, refreshResources } = useResourceManager();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  if (authLoading) return <LoadingState />;
  if (!isAuthenticated) return <LoginView />;

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this resource? This action cannot be undone.')) {
      try {
        await deleteResource(id);
      } catch (e) {
        alert(`Delete failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }
  };

  const handleRenew = async (resource: Resource) => {
    const cycleLabelMap: Record<string, string> = {
      Monthly: 'monthly',
      Quarterly: 'quarterly',
      Yearly: 'yearly'
    };
    const cycleLabel = resource.billingCycle ? (cycleLabelMap[resource.billingCycle] || resource.billingCycle) : 'current cycle';
    const confirmed = window.confirm(`Renew "${resource.name}" using the ${cycleLabel} cycle? This will advance the expiry date and reset reminder state.`);
    if (!confirmed) return;

    try {
      const updated = await renewResource(resource.id);
      alert(`Renewal complete. New expiry date: ${updated.expiryDate || '-'}.`);
    } catch (e) {
      alert(`Renewal failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  const handleSaveResource = async (resourceData: Partial<Resource>) => {
    const isEdit = Boolean(resourceData.id) && resources.some((r) => r.id === resourceData.id);

    try {
      if (isEdit) {
        await updateResource(resourceData as Resource);
      } else {
        await addResource(resourceData);
      }
      setIsModalOpen(false);
      setEditingResource(null);
    } catch (e) {
      alert(`Save failed: ${e instanceof Error ? e.message : 'Check your network or database configuration.'}`);
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
            title="VPS Instances"
            subtitle="Manage virtual machines and cloud servers."
            resources={resources}
            resourceType={ResourceType.VPS}
            onAdd={openAddModal}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onRenew={handleRenew}
            addButtonLabel="Add VPS"
          />
        );
      case 'domains':
        return (
          <ResourceListView
            title="Domains"
            subtitle="Track domain expiry and certificate schedules."
            resources={resources}
            resourceType={ResourceType.DOMAIN}
            onAdd={openAddModal}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onRenew={handleRenew}
            addButtonLabel="Add Domain"
          />
        );
      case 'accounts':
        return (
          <ResourceListView
            title="Accounts"
            subtitle="Manage subscriptions, licenses, and account-based services."
            resources={resources}
            resourceType={ResourceType.ACCOUNT}
            onAdd={openAddModal}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onRenew={handleRenew}
            addButtonLabel="Add Account"
          />
        );
      case 'cellphones':
        return (
          <ResourceListView
            title="Phone Numbers"
            subtitle="Manage number expiry dates and retention plans."
            resources={resources}
            resourceType={ResourceType.PHONE_NUMBER}
            onAdd={openAddModal}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onRenew={handleRenew}
            addButtonLabel="Add Number"
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
        onClose={() => {
          setIsModalOpen(false);
          setEditingResource(null);
        }}
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
