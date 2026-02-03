
import React, { useState, useEffect } from 'react';
import { Resource, ResourceType, Status } from '../../types';
import { X, Save, Bell, Settings2, LayoutGrid, Key } from 'lucide-react';
import InfrastructureForm from './forms/InfrastructureForm';
import AccountForm from './forms/AccountForm';

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (resource: Resource) => void;
  initialData?: Resource | null;
}

const AddResourceModal: React.FC<AddResourceModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'notifications'>('basic');
  // 'infrastructure' covers VPS, DOMAIN, PHONE_NUMBER. 'account' covers ACCOUNT.
  const [category, setCategory] = useState<'infrastructure' | 'account'>('infrastructure');

  // Notification State
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
        // Determine category based on type
        if (initialData.type === ResourceType.ACCOUNT) {
          setCategory('account');
        } else {
          setCategory('infrastructure');
        }

        // Load Notification Settings
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
        // Default new
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
    const resourceToSave: Resource = {
      id: initialData?.id || Date.now().toString(),
      name: data.name!,
      provider: data.provider!,
      expiryDate: data.expiryDate, // Can be undefined
      startDate: data.startDate, 
      cost: data.cost || 0,
      currency: data.currency!,
      type: data.type!,
      billingCycle: data.billingCycle, 
      status: initialData?.status || Status.ACTIVE, 
      autoRenew: data.autoRenew || false,
      notes: data.notes,
      tags: data.tags || [], // Ensure tags are included
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

  // Category Selector
  const CategorySelector = () => (
    <div className="flex gap-4 mb-6 border-b border-slate-100">
       <button
         type="button"
         onClick={() => setCategory('infrastructure')}
         className={`pb-3 text-sm font-medium transition-all relative ${
           category === 'infrastructure' 
            ? 'text-indigo-600' 
            : 'text-slate-500 hover:text-slate-700'
         }`}
       >
         <div className="flex items-center gap-2">
           <LayoutGrid size={16} /> 基础设施资产
         </div>
         {category === 'infrastructure' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full"></div>}
       </button>

       <button
         type="button"
         onClick={() => setCategory('account')}
         className={`pb-3 text-sm font-medium transition-all relative ${
           category === 'account' 
            ? 'text-amber-600' 
            : 'text-slate-500 hover:text-slate-700'
         }`}
       >
         <div className="flex items-center gap-2">
           <Key size={16} /> 账号与订阅
         </div>
         {category === 'account' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 rounded-t-full"></div>}
       </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in transform transition-all flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h3 className="font-semibold text-slate-800">
            {initialData ? '编辑资产' : '新增资产'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        {/* Main Tabs (Basic vs Notify) */}
        <div className="flex border-b border-slate-100 shrink-0 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'basic' ? 'text-slate-900 bg-white' : 'text-slate-500 bg-slate-50 hover:bg-slate-100'}`}
          >
            基本信息
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'notifications' ? 'text-slate-900 bg-white' : 'text-slate-500 bg-slate-50 hover:bg-slate-100'}`}
          >
            <Bell size={14} /> 通知设置
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6">
          
          {/* --- BASIC TAB --- */}
          <div className={activeTab === 'basic' ? 'block' : 'hidden'}>
            
            {/* Show category switcher only when creating new */}
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

          {/* --- NOTIFICATION TAB --- */}
          <div className={activeTab === 'notifications' ? 'block' : 'hidden'}>
            <div className="space-y-5">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <h4 className="text-sm font-medium text-slate-900">启用到期提醒</h4>
                  <p className="text-xs text-slate-500">关闭后将不再发送该资产的任何通知</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={notifySettings.enabled}
                    onChange={(e) => setNotifySettings({...notifySettings, enabled: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {notifySettings.enabled && (
                <div className="space-y-4 animate-fade-in">
                  {/* Strategy Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNotifySettings({...notifySettings, useGlobal: true})}
                      className={`p-3 rounded-lg border text-left transition-all ${notifySettings.useGlobal ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                    >
                      <div className="font-medium text-sm mb-1">跟随全局</div>
                      <div className="text-xs opacity-80">使用系统默认提醒策略</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotifySettings({...notifySettings, useGlobal: false})}
                      className={`p-3 rounded-lg border text-left transition-all ${!notifySettings.useGlobal ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                    >
                      <div className="font-medium text-sm flex items-center gap-1.5 mb-1">
                        自定义 <Settings2 size={14} />
                      </div>
                      <div className="text-xs opacity-80">单独设置此资产规则</div>
                    </button>
                  </div>

                  {/* Custom Settings Area */}
                  {!notifySettings.useGlobal && (
                    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4 shadow-sm animate-fade-in">
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
                            onChange={(e) => setNotifySettings({...notifySettings, reminderDays: parseInt(e.target.value)})}
                            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                          <div className="w-12 h-8 flex items-center justify-center bg-slate-100 rounded text-sm font-mono font-medium text-indigo-600 border border-slate-200">
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

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white shrink-0">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors"
            >
              取消
            </button>
            <button
              form="resourceForm" // Connects to the active form ID
              type="submit"
              className={`flex-1 px-4 py-2 text-white rounded-lg font-medium text-sm transition-colors shadow-sm flex items-center justify-center gap-2 ${category === 'account' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
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
