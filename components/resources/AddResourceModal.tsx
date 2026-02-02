
import React, { useState, useEffect } from 'react';
import { Resource, ResourceType, Status } from '../../types';
import { X, Save, Bell, Settings2 } from 'lucide-react';

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (resource: Resource) => void;
  initialData?: Resource | null;
}

const AddResourceModal: React.FC<AddResourceModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  // Basic Info State
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    expiryDate: '',
    cost: '',
    currency: '$',
    type: ResourceType.VPS,
    autoRenew: false,
  });

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

  // Tab State for cleaner UI
  const [activeTab, setActiveTab] = useState<'basic' | 'notifications'>('basic');

  useEffect(() => {
    if (isOpen) {
      // Reset Tab
      setActiveTab('basic');

      if (initialData) {
        setFormData({
          name: initialData.name,
          provider: initialData.provider,
          expiryDate: initialData.expiryDate,
          cost: initialData.cost.toString(),
          currency: initialData.currency,
          type: initialData.type,
          autoRenew: initialData.autoRenew,
        });

        // Load Notification Settings if exist, else default
        if (initialData.notificationSettings) {
          setNotifySettings({
            enabled: initialData.notificationSettings.enabled,
            useGlobal: initialData.notificationSettings.useGlobal,
            reminderDays: initialData.notificationSettings.reminderDays ?? 7,
            channels: initialData.notificationSettings.channels ?? { telegram: true, email: false, webhook: false }
          });
        } else {
          // Default for existing items without settings
          setNotifySettings({
            enabled: true,
            useGlobal: true,
            reminderDays: 7,
            channels: { telegram: true, email: false, webhook: false }
          });
        }
      } else {
        // Reset for new item
        setFormData({
          name: '',
          provider: '',
          expiryDate: '',
          cost: '',
          currency: '$',
          type: ResourceType.VPS,
          autoRenew: false,
        });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const resourceToSave: Resource = {
      id: initialData?.id || Date.now().toString(),
      name: formData.name,
      provider: formData.provider,
      expiryDate: formData.expiryDate,
      cost: parseFloat(formData.cost) || 0,
      currency: formData.currency,
      type: formData.type,
      status: initialData?.status || Status.ACTIVE, 
      autoRenew: formData.autoRenew,
      notificationSettings: {
        enabled: notifySettings.enabled,
        useGlobal: notifySettings.useGlobal,
        // Only save details if not using global
        reminderDays: notifySettings.useGlobal ? undefined : notifySettings.reminderDays,
        channels: notifySettings.useGlobal ? undefined : notifySettings.channels
      }
    };

    onSave(resourceToSave);
    onClose();
  };

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
        
        {/* Tabs */}
        <div className="flex border-b border-slate-100 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'basic' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700'}`}
          >
            基本信息
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'notifications' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Bell size={14} /> 通知设置
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6">
          <form id="resourceForm" onSubmit={handleSubmit} className="space-y-4">
            
            {/* --- BASIC TAB --- */}
            <div className={activeTab === 'basic' ? 'block' : 'hidden'}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">名称 / 域名</label>
                  <input
                    required
                    type="text"
                    placeholder="例如：Production Server 或 google.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-shadow"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">服务商</label>
                    <input
                      required
                      type="text"
                      placeholder="例如：AWS"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-shadow"
                      value={formData.provider}
                      onChange={(e) => setFormData({...formData, provider: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">类型</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white transition-shadow"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as ResourceType})}
                    >
                      <option value={ResourceType.VPS}>VPS 主机</option>
                      <option value={ResourceType.DOMAIN}>域名</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">到期时间</label>
                  <input
                    required
                    type="date"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-shadow"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">费用</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-500 text-sm">{formData.currency}</span>
                        <input
                          required
                          type="number"
                          step="0.01"
                          className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-shadow"
                          value={formData.cost}
                          onChange={(e) => setFormData({...formData, cost: e.target.value})}
                        />
                      </div>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">货币符号</label>
                      <select 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white transition-shadow"
                        value={formData.currency}
                        onChange={(e) => setFormData({...formData, currency: e.target.value})}
                      >
                        <option value="$">$ (USD)</option>
                        <option value="¥">¥ (CNY)</option>
                        <option value="€">€ (EUR)</option>
                      </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="autoRenew"
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                    checked={formData.autoRenew}
                    onChange={(e) => setFormData({...formData, autoRenew: e.target.checked})}
                  />
                  <label htmlFor="autoRenew" className="text-sm text-slate-600">已开启自动续费</label>
                </div>
              </div>
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
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {notifySettings.enabled && (
                  <div className="space-y-4 animate-fade-in">
                    
                    {/* Strategy Selection */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setNotifySettings({...notifySettings, useGlobal: true})}
                        className={`p-3 rounded-lg border text-left transition-all ${notifySettings.useGlobal 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                      >
                        <div className="font-medium text-sm mb-1">跟随全局</div>
                        <div className="text-xs opacity-80">使用系统默认提醒策略</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNotifySettings({...notifySettings, useGlobal: false})}
                        className={`p-3 rounded-lg border text-left transition-all ${!notifySettings.useGlobal 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
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

                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            通知渠道
                          </label>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                                checked={notifySettings.channels.telegram}
                                onChange={(e) => setNotifySettings({
                                  ...notifySettings, 
                                  channels: {...notifySettings.channels, telegram: e.target.checked}
                                })}
                              />
                              <span className="text-sm text-slate-700">Telegram Bot</span>
                            </label>
                            
                            <label className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                                checked={notifySettings.channels.email}
                                onChange={(e) => setNotifySettings({
                                  ...notifySettings, 
                                  channels: {...notifySettings.channels, email: e.target.checked}
                                })}
                              />
                              <span className="text-sm text-slate-700">Email</span>
                            </label>

                            <label className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                                checked={notifySettings.channels.webhook}
                                onChange={(e) => setNotifySettings({
                                  ...notifySettings, 
                                  channels: {...notifySettings.channels, webhook: e.target.checked}
                                })}
                              />
                              <span className="text-sm text-slate-700">Webhook</span>
                            </label>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </form>
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
              form="resourceForm"
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
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
