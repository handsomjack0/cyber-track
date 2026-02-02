import React, { useState } from 'react';
import { Resource, ResourceType, Status } from '../types';
import { X } from 'lucide-react';

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (resource: Resource) => void;
}

const AddResourceModal: React.FC<AddResourceModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    expiryDate: '',
    cost: '',
    currency: '$',
    type: ResourceType.VPS,
    autoRenew: false,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple ID generation
    const newResource: Resource = {
      id: Date.now().toString(),
      name: formData.name,
      provider: formData.provider,
      expiryDate: formData.expiryDate,
      cost: parseFloat(formData.cost) || 0,
      currency: formData.currency,
      type: formData.type,
      status: Status.ACTIVE,
      autoRenew: formData.autoRenew,
    };

    onAdd(newResource);
    onClose();
    // Reset form
    setFormData({
      name: '',
      provider: '',
      expiryDate: '',
      cost: '',
      currency: '$',
      type: ResourceType.VPS,
      autoRenew: false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-800">新增资产</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">名称 / 域名</label>
            <input
              required
              type="text"
              placeholder="例如：Production Server 或 google.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                value={formData.provider}
                onChange={(e) => setFormData({...formData, provider: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">类型</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
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
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
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
                    className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    value={formData.cost}
                    onChange={(e) => setFormData({...formData, cost: e.target.value})}
                  />
                </div>
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">货币符号</label>
                <select 
                   className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
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

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors shadow-sm"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddResourceModal;