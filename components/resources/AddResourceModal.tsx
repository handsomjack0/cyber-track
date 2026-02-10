import React, { useState, useEffect } from 'react';
import { Resource, ResourceType, Status } from '../../types';
import { X, Save, Bell, Settings2, LayoutGrid, Key } from 'lucide-react';
import InfrastructureForm from './forms/InfrastructureForm';
import AccountForm from './forms/AccountForm';

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (resource: Partial<Resource>) => void;
  initialData?: Resource | null;
}

const AddResourceModal: React.FC<AddResourceModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'notifications'>('basic');
  const [category, setCategory] = useState<'infrastructure' | 'account'>('infrastructure');

  const [notifySettings, setNotifySettings] = useState({
    enabled: true,
    useGlobal: true,
    reminderDays: 7,
    channels: {
      telegram: true,
      email: false,
      webhook: false
    }
  });

  useEffect(() => {
    if (isOpen) {
      setActiveTab('basic');
      if (initialData) {
        if (initialData.type === ResourceType.ACCOUNT) {
          setCategory('account');
        } else {
          setCategory('infrastructure');
        }

        if (initialData.notificationSettings) {
          setNotifySettings({
            enabled: initialData.notificationSettings.enabled,
            useGlobal: initialData.notificationSettings.useGlobal,
            reminderDays: initialData.notificationSettings.reminderDays ?? 7,
            channels: initialData.notificationSettings.channels ?? { telegram: true, email: false, webhook: false }
          });
        } else {
          setNotifySettings({
            enabled: true,
            useGlobal: true,
            reminderDays: 7,
            channels: { telegram: true, email: false, webhook: false }
          });
        }
      } else {
        setCategory('infrastructure');
        setNotifySettings({
          enabled: true,
          useGlobal: true,
          reminderDays: 7,
          channels: { telegram: true, email: false, webhook: false }
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleFormSubmit = (data: Partial<Resource>) => {
    const resourceToSave: Partial<Resource> = {
      ...(initialData?.id ? { id: initialData.id } : {}),
      name: data.name!,
      provider: data.provider!,
      expiryDate: data.expiryDate,
      startDate: data.startDate,
      cost: data.cost || 0,
      currency: data.currency!,
      type: data.type!,
      billingCycle: data.billingCycle,
      status: initialData?.status || Status.ACTIVE,
      autoRenew: data.autoRenew || false,
      notes: data.notes,
      tags: data.tags || [],
      notificationSettings: {
        enabled: notifySettings.enabled,
        useGlobal: notifySettings.useGlobal,
        reminderDays: notifySettings.useGlobal ? undefined : notifySettings.reminderDays,
        channels: notifySettings.useGlobal ? undefined : notifySettings.channels
      }
    };
    onSave(resourceToSave);
    onClose();
  };

  const CategorySelector = () => (
    <div className="flex gap-4 mb-6 border-b border-slate-100 dark:border-slate-800">
      <button
        type="button"
        onClick={() => setCategory('infrastructure')}
        className={`pb-3 text-sm font-medium transition-all relative ${
          category === 'infrastructure'
            ? 'text-sky-300'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
        }`}
      >
        <div className="flex items-center gap-2">
          <LayoutGrid size={16} /> 基础设施资源
        </div>
        {category === 'infrastructure' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400/70 rounded-t-full"></div>}
      </button>

      <button
        type="button"
        onClick={() => setCategory('account')}
        className={`pb-3 text-sm font-medium transition-all relative ${
          category === 'account'
            ? 'text-sky-300'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
        }`}
      >
        <div className="flex items-center gap-2">
          <Key size={16} /> 账号与订阅
        </div>
        {category === 'account' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400/70 rounded-t-full"></div>}
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white/90 dark:bg-slate-900/80 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in transform transition-all flex flex-col max-h-[90vh] border border-white/60 dark:border-slate-800/60">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/70 dark:bg-slate-900/70 shrink-0">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-sky-300 font-semibold">Resource</div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">
              {initialData ? '编辑资产' : '新增资产'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white/60 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'basic' ? 'text-slate-900 dark:text-white bg-white/70 dark:bg-slate-900/70' : 'text-slate-500 bg-slate-50/70 dark:bg-slate-800/30 hover:bg-slate-100/80'}`}
          >
            基本信息
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'notifications' ? 'text-slate-900 dark:text-white bg-white/70 dark:bg-slate-900/70' : 'text-slate-500 bg-slate-50/70 dark:bg-slate-800/30 hover:bg-slate-100/80'}`}
          >
            <Bell size={14} /> 通知设置
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <div className={activeTab === 'basic' ? 'block' : 'hidden'}>
            {!initialData && <CategorySelector />}

            {category === 'account' ? (
              <AccountForm
                initialData={initialData}
                onSubmit={handleFormSubmit}
              />
            ) : (
              <InfrastructureForm
                initialData={initialData}
                onSubmit={handleFormSubmit}
              />
            )}
          </div>

          <div className={activeTab === 'notifications' ? 'block' : 'hidden'}>
            <div className="space-y-5">
              <div className="flex items-center justify-between p-3 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <h4 className="text-sm font-medium text-slate-900 dark:text-slate-200">启用到期提醒</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">关闭后将不再发送该资源的通知</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notifySettings.enabled}
                    onChange={(e) => setNotifySettings({ ...notifySettings, enabled: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-200/30 rounded-full peer peer-checked:bg-sky-500"></div>
                </label>
              </div>

              {notifySettings.enabled && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNotifySettings({ ...notifySettings, useGlobal: true })}
                      className={`p-3 rounded-xl border text-left transition-all ${notifySettings.useGlobal ? 'border-sky-400/50 bg-sky-400/10 text-sky-200' : 'border-slate-200 hover:border-slate-300 text-slate-400'}`}
                    >
                      <div className="font-medium text-sm mb-1">跟随全局</div>
                      <div className="text-xs opacity-80">使用系统默认提醒策略</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotifySettings({ ...notifySettings, useGlobal: false })}
                      className={`p-3 rounded-xl border text-left transition-all ${!notifySettings.useGlobal ? 'border-sky-400/50 bg-sky-400/10 text-sky-200' : 'border-slate-200 hover:border-slate-300 text-slate-400'}`}
                    >
                      <div className="font-medium text-sm flex items-center gap-1.5 mb-1">
                        自定义 <Settings2 size={14} />
                      </div>
                      <div className="text-xs opacity-80">单独设置提醒规则</div>
                    </button>
                  </div>

                  {!notifySettings.useGlobal && (
                    <div className="bg-white/80 border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm animate-fade-in">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                          提前通知天数
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="1"
                            max="60"
                            value={notifySettings.reminderDays}
                            onChange={(e) => setNotifySettings({ ...notifySettings, reminderDays: parseInt(e.target.value) })}
                            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                          />
                          <div className="w-12 h-8 flex items-center justify-center bg-slate-100 rounded text-sm font-mono font-medium text-sky-300 border border-slate-200">
                            {notifySettings.reminderDays}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 shrink-0">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium text-sm transition-colors"
            >
              取消
            </button>
            <button
              form="resourceForm"
              type="submit"
              className="modal-primary flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {initialData ? '保存修改' : '立即创建'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddResourceModal;

