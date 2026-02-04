import React, { useState, useEffect } from 'react';
import { Resource, ResourceType, BillingCycle } from '../../../types';
import { CalendarClock, CreditCard, StickyNote, Calendar } from 'lucide-react';

interface AccountResourceFormProps {
  initialData: Resource | null;
  onSubmit: (data: Partial<Resource>) => void;
}

const AccountResourceForm: React.FC<AccountResourceFormProps> = ({ initialData, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    expiryDate: '',
    startDate: '',
    cost: '',
    currency: '$',
    billingCycle: BillingCycle.MONTHLY,
    autoRenew: true,
    notes: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        provider: initialData.provider,
        expiryDate: initialData.expiryDate || '',
        startDate: initialData.startDate || '',
        cost: initialData.cost.toString(),
        currency: initialData.currency,
        billingCycle: initialData.billingCycle || BillingCycle.MONTHLY,
        autoRenew: initialData.autoRenew,
        notes: initialData.notes || '',
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, startDate: today }));
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      provider: formData.provider,
      expiryDate: formData.expiryDate || undefined,
      startDate: formData.startDate,
      cost: parseFloat(formData.cost) || 0,
      currency: formData.currency,
      type: ResourceType.ACCOUNT,
      billingCycle: formData.billingCycle,
      autoRenew: formData.autoRenew,
      notes: formData.notes,
    });
  };

  return (
    <form id="resourceForm" onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800 flex gap-2">
        <CreditCard size={16} className="shrink-0" />
        <p>用于管理 Netflix、Spotify、ChatGPT 等订阅服务或一次性软件授权。</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">账号 / 应用名称</label>
        <input
          required
          type="text"
          placeholder="例如：ChatGPT Plus, Netflix 4K, Adobe CC"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm transition-shadow"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">平台 / 服务商</label>
          <input
            required
            type="text"
            placeholder="例如：OpenAI"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm transition-shadow"
            value={formData.provider}
            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">订阅周期</label>
          <select
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white transition-shadow"
            value={formData.billingCycle}
            onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as BillingCycle })}
          >
            <option value={BillingCycle.MONTHLY}>按月订阅</option>
            <option value={BillingCycle.QUARTERLY}>按季订阅</option>
            <option value={BillingCycle.YEARLY}>按年订阅</option>
            <option value={BillingCycle.ONE_TIME}>一次性（永久）</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
            <Calendar size={14} className="text-slate-400" />
            开始日期 <span className="text-rose-500">*</span>
          </label>
          <input
            required
            type="date"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm transition-shadow font-medium"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
            <CalendarClock size={14} className="text-slate-400" />
            {formData.billingCycle === BillingCycle.ONE_TIME ? '过期/失效日期' : '下次扣费日期'}
            <span className="text-slate-400 font-normal ml-1 text-xs">(选填)</span>
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm transition-shadow text-slate-600"
            value={formData.expiryDate}
            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">订阅价格</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-slate-500 text-sm">{formData.currency}</span>
            <input
              required
              type="number"
              step="0.01"
              className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm transition-shadow"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">货币单位</label>
          <select
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white transition-shadow"
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
          placeholder="填写授权码、登录邮箱、用途等备注信息..."
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm transition-shadow"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="autoRenew"
          className="rounded text-amber-600 focus:ring-amber-500"
          checked={formData.autoRenew}
          onChange={(e) => setFormData({ ...formData, autoRenew: e.target.checked })}
        />
        <label htmlFor="autoRenew" className="text-sm text-slate-600">已开启自动续费</label>
      </div>
    </form>
  );
};

export default AccountResourceForm;
