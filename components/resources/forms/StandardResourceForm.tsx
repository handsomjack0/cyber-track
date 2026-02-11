import React, { useState, useEffect } from 'react';
import { Resource, ResourceType } from '../../../types';
import { StickyNote } from 'lucide-react';

interface StandardResourceFormProps {
  initialData: Resource | null;
  onSubmit: (data: Partial<Resource>) => void;
}

const StandardResourceForm: React.FC<StandardResourceFormProps> = ({ initialData, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    expiryDate: '',
    cost: '',
    currency: '$',
    type: ResourceType.VPS,
    autoRenew: false,
    notes: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        provider: initialData.provider,
        expiryDate: initialData.expiryDate || '',
        cost: initialData.cost.toString(),
        currency: initialData.currency,
        type: initialData.type,
        autoRenew: initialData.autoRenew,
        notes: initialData.notes || '',
      });
    } else {
      setFormData(prev => ({ ...prev, type: ResourceType.VPS }));
    }
  }, [initialData]);

  const handleTypeChange = (type: ResourceType) => {
    setFormData({ ...formData, type });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      provider: formData.provider,
      expiryDate: formData.expiryDate,
      cost: parseFloat(formData.cost) || 0,
      currency: formData.currency,
      type: formData.type,
      autoRenew: formData.autoRenew,
      notes: formData.notes,
    });
  };

  return (
    <form id="resourceForm" onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">名称 / 域名 / 号码</label>
        <input
          required
          type="text"
          placeholder="例如：Production Server, google.com, +1 888..."
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/40 text-sm transition-shadow"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">服务商</label>
          <input
            required
            type="text"
            placeholder="例如：AWS, Namecheap"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/40 text-sm transition-shadow"
            value={formData.provider}
            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">资源类型</label>
          <select
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/40 text-sm bg-white transition-shadow"
            value={formData.type}
            onChange={(e) => handleTypeChange(e.target.value as ResourceType)}
          >
            <option value={ResourceType.VPS}>VPS 主机</option>
            <option value={ResourceType.DOMAIN}>域名</option>
            <option value={ResourceType.PHONE_NUMBER}>手机号码</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">到期时间</label>
        <input
          required
          type="date"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/40 text-sm transition-shadow"
          value={formData.expiryDate}
          onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">续费金额</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-slate-500 text-sm">{formData.currency}</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/40 text-sm transition-shadow"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">货币单位</label>
          <select
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/40 text-sm bg-white transition-shadow"
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          >
            <option value="$">$ (USD)</option>
            <option value="¥">¥ (CNY)</option>
            <option value="€">€ (EUR)</option>
            <option value="£">£ (GBP)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
          <StickyNote size={14} className="text-slate-400" /> 备注
        </label>
        <textarea
          rows={2}
          placeholder="填写 IP 地址、SSH 端口、用途等..."
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/40 text-sm transition-shadow"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="autoRenew"
          className="rounded text-sky-300 focus:ring-sky-400/40"
          checked={formData.autoRenew}
          onChange={(e) => setFormData({ ...formData, autoRenew: e.target.checked })}
        />
        <label htmlFor="autoRenew" className="text-sm text-slate-600">已开启自动续费</label>
      </div>
    </form>
  );
};

export default StandardResourceForm;

