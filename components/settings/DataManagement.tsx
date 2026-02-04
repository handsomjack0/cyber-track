import React, { useRef, useState } from 'react';
import { Download, Upload, Database, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { resourceService } from '../../services/resourceService';
import { Resource } from '../../types';

const DataManagement: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleExport = async () => {
    try {
      const data = await resourceService.fetchAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cloudtrack-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
      setStatus({ type: 'error', msg: '导出失败，请重试' });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setStatus(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        const resources = JSON.parse(json) as Resource[];

        if (!Array.isArray(resources)) throw new Error('Invalid format');

        if (!window.confirm(`确认要恢复 ${resources.length} 条资源数据吗？这将覆盖当前数据。`)) {
          setImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        await resourceService.importData(resources);
        setStatus({ type: 'success', msg: `成功恢复 ${resources.length} 条数据！页面将自动刷新。` });

        setTimeout(() => window.location.reload(), 2000);
      } catch (err) {
        console.error(err);
        setStatus({ type: 'error', msg: '文件格式错误或导入失败' });
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white/90 dark:bg-slate-900/70 border border-white/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm animate-fade-in">
      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Database size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">数据管理</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            备份你的资产数据或从备份文件恢复。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-50/70 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Download size={18} className="text-indigo-600 dark:text-indigo-400" />
            导出备份
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            生成包含 VPS、域名和账号信息的 JSON 备份文件。
          </p>
          <button
            onClick={handleExport}
            className="w-full py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium shadow-sm"
          >
            下载 .json 文件
          </button>
        </div>

        <div className="bg-slate-50/70 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Upload size={18} className="text-indigo-600 dark:text-indigo-400" />
            恢复数据
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            从备份文件恢复数据。注意：这将 <span className="text-rose-500 font-medium">覆盖</span> 当前所有数据。
          </p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={handleImportClick}
            disabled={importing}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-sm flex items-center justify-center gap-2"
          >
            {importing ? <Loader2 size={16} className="animate-spin" /> : '选择备份文件'}
          </button>
        </div>
      </div>

      {status && (
        <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 text-sm ${
          status.type === 'success'
            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
            : 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300'
        }`}>
          {status.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {status.msg}
        </div>
      )}
    </div>
  );
};

export default DataManagement;

