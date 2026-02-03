
import React, { useState, useEffect } from 'react';
import { Resource, ResourceType } from '../../../types';
import { StickyNote, Server, Globe, Smartphone, Tag } from 'lucide-react';
import TagInput from '../../common/TagInput';

interface InfrastructureFormProps {
  initialData: Resource | null;
  onSubmit: (data: Partial<Resource>) => void;
}

const InfrastructureForm: React.FC<InfrastructureFormProps> = ({ initialData, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    expiryDate: '',
    cost: '',
    currency: '$',
    type: ResourceType.VPS,
    autoRenew: false,
    notes: '',
    tags: [] as string[]
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
        tags: initialData.tags || []
      });
    } else {
      // Default to VPS if new
      setFormData(prev => ({ ...prev, type: ResourceType.VPS }));
    }
  }, [initialData]);

  // Dynamic config based on type
  const formConfig = {
    [ResourceType.VPS]: {
      nameLabel: '服务器名称 / IP',
      namePlaceholder: '例如：Production Server, 192.168.1.1',
      providerLabel: '云服务商',
      providerPlaceholder: '例如：AWS, DigitalOcean, Aliyun',
      icon: <Server size={14} />
    },
    [ResourceType.DOMAIN]: {
      nameLabel: '域名',
      namePlaceholder: '例如：google.com, my-blog.net',
      providerLabel: '域名注册商',
      providerPlaceholder: '例如：GoDaddy, Namecheap, Cloudflare',
      icon: <Globe size={14} />
    },
    [ResourceType.PHONE_NUMBER]: {
      nameLabel: '手机号码',
      namePlaceholder: '例如：+1 888 123 4567',
      providerLabel: '运营商',
      providerPlaceholder: '例如：T-Mobile, Google Voice, China Mobile',
      icon: <Smartphone size={14} />
    },
    [ResourceType.ACCOUNT]: { // Fallback
      nameLabel: '名称',
      namePlaceholder: '',
      providerLabel: '提供商',
      providerPlaceholder: '',
      icon: <Server size={14} />
    }
  };

  const currentConfig = formConfig[formData.type] || formConfig[ResourceType.VPS];

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
      tags: formData.tags
    });
  };

  return (
    <form id="resourceForm" onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
      
      {/* Type Selection inside Form */}
      <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-lg mb-4">
        {[ResourceType.VPS, ResourceType.DOMAIN, ResourceType.PHONE_NUMBER].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFormData({...formData, type: t})}
            className={`py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-all ${
              formData.type === t 
                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            {formConfig[t].icon}
            {t === ResourceType.VPS && 'VPS/主机'}
            {t === ResourceType.DOMAIN && '域名'}
            {t === ResourceType.PHONE_NUMBER && '手机号'}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{currentConfig.nameLabel}</label>
        <input
          required
          type="text"
          placeholder={currentConfig.namePlaceholder}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-shadow"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{currentConfig.providerLabel}</label>
          <input
            required
            type="text"
            placeholder={currentConfig.providerPlaceholder}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-shadow"
            value={formData.provider}
            onChange={(e) => setFormData({...formData, provider: e.target.value})}
          />
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">续费金额</label>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">货币单位</label>
            <select 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white transition-shadow"
              value={formData.currency}
              onChange={(e) => setFormData({...formData, currency: e.target.value})}
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
          <Tag size={14} className="text-slate-400" /> 标签 / 分组
        </label>
        <TagInput 
          tags={formData.tags} 
          onChange={(newTags) => setFormData({...formData, tags: newTags})} 
          placeholder="输入标签 (如: Dev, VPN) 并回车"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
          <StickyNote size={14} className="text-slate-400" /> 备注
        </label>
        <textarea
          rows={2}
          placeholder="填写 IP 地址、SSH 端口、DNS 解析等信息..."
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-shadow"
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="autoRenew"
          className="rounded text-indigo-600 focus:ring-indigo-500"
          checked={formData.autoRenew}
          onChange={(e) => setFormData({...formData, autoRenew: e.target.checked})}
        />
        <label htmlFor="autoRenew" className="text-sm text-slate-600">已开启自动续费</label>
      </div>
    </form>
  );
};

export default InfrastructureForm;
