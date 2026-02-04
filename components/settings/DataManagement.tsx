import React, { useRef, useState } from 'react';
import { Download, Upload, Database, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { resourceService } from '../../services/resourceService';
import { Resource } from '../../types';

type ImportMode = 'overwrite' | 'merge';

interface ImportIssue {
  index: number;
  message: string;
}

const DataManagement: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('overwrite');
  const [preview, setPreview] = useState<{ total: number; valid: number; invalid: number; issues: ImportIssue[] } | null>(null);
  const [lastIssues, setLastIssues] = useState<ImportIssue[] | null>(null);

  const allowedTypes = new Set(['VPS', 'DOMAIN', 'PHONE_NUMBER', 'ACCOUNT']);

  const isValidDate = (value: any) => {
    if (!value) return true;
    if (typeof value !== 'string') return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(value);
    return !Number.isNaN(date.getTime());
  };

  const normalizeResource = (raw: any, issues: ImportIssue[], index: number): Resource | null => {
    if (!raw || typeof raw !== 'object') return null;
    if (!raw.name || !raw.type) return null;

    if (!allowedTypes.has(String(raw.type))) {
      issues.push({ index, message: `类型无效（${raw.type}）` });
      return null;
    }

    if (!isValidDate(raw.expiryDate) || !isValidDate(raw.startDate)) {
      issues.push({ index, message: '日期格式错误（需 YYYY-MM-DD）' });
      return null;
    }

    if (raw.cost !== undefined && !Number.isFinite(Number(raw.cost))) {
      issues.push({ index, message: '费用不是有效数字' });
      return null;
    }

    return {
      id: raw.id || crypto.randomUUID(),
      name: String(raw.name),
      provider: raw.provider ? String(raw.provider) : 'Unknown',
      expiryDate: raw.expiryDate || null,
      startDate: raw.startDate || null,
      cost: Number(raw.cost || 0),
      currency: raw.currency ? String(raw.currency) : '$',
      type: String(raw.type),
      status: raw.status ? String(raw.status) : 'Active',
      autoRenew: Boolean(raw.autoRenew),
      billingCycle: raw.billingCycle || null,
      notes: raw.notes || null,
      notificationSettings: raw.notificationSettings || null,
      tags: Array.isArray(raw.tags) ? raw.tags : []
    };
  };

  const previewImport = (list: any[]) => {
    const issues: ImportIssue[] = [];
    const valid: Resource[] = [];

    list.forEach((item, index) => {
      const normalized = normalizeResource(item, issues, index);
      if (!normalized) {
        return;
      }
      valid.push(normalized);
    });

    setPreview({
      total: list.length,
      valid: valid.length,
      invalid: issues.length,
      issues: issues.slice(0, 5)
    });
    setLastIssues(issues);

    return valid;
  };

  const downloadJson = (payload: any, filename: string) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    try {
      const data = await resourceService.fetchAll();
      const payload = {
        metadata: {
          version: 1,
          exportedAt: new Date().toISOString(),
          source: 'cyber-track'
        },
        resources: data
      };
      downloadJson(payload, `cloudtrack-backup-${new Date().toISOString().split('T')[0]}.json`);
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
        const parsed = JSON.parse(json) as any;
        const raw = Array.isArray(parsed) ? parsed : parsed?.resources;

        if (!Array.isArray(raw)) throw new Error('Invalid format');

        const validResources = previewImport(raw);
        if (validResources.length === 0) {
          setStatus({ type: 'error', msg: '没有可导入的数据，请检查文件格式。' });
          return;
        }

        const confirmMsg =
          importMode === 'overwrite'
            ? `确认要恢复 ${validResources.length} 条资源数据吗？这将覆盖当前数据。`
            : `确认要合并导入 ${validResources.length} 条资源数据吗？现有数据将保留。`;

        if (!window.confirm(confirmMsg)) {
          setImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        await resourceService.importData(validResources, importMode);
        setStatus({ type: 'success', msg: `成功导入 ${validResources.length} 条数据！页面将自动刷新。` });

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

          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-slate-500 dark:text-slate-400">导入模式</label>
            <select
              value={importMode}
              onChange={(e) => setImportMode(e.target.value as ImportMode)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300"
            >
              <option value="overwrite">覆盖（清空后导入）</option>
              <option value="merge">合并（保留现有数据）</option>
            </select>
          </div>
          <div className="mb-4 text-[11px] text-slate-500 dark:text-slate-400">
            合并模式会优先按 <span className="font-mono">name + type + provider</span> 匹配已有数据进行更新。
          </div>

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

          {preview && (
            <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <div>预检查：共 {preview.total} 条，合法 {preview.valid} 条，异常 {preview.invalid} 条</div>
              {preview.issues.length > 0 && (
                <div>示例问题：{preview.issues.map(i => `#${i.index + 1} ${i.message}`).join('；')}</div>
              )}
              {preview.invalid > 0 && lastIssues && (
                <button
                  onClick={() => downloadJson({ issues: lastIssues }, `cloudtrack-import-issues-${new Date().toISOString().split('T')[0]}.json`)}
                  className="text-indigo-600 dark:text-indigo-300 underline underline-offset-2"
                >
                  下载错误明细
                </button>
              )}
              {preview.issues.length > 0 && (
                <ul className="mt-2 space-y-1 text-[11px] text-rose-500">
                  {preview.issues.map(issue => (
                    <li key={`${issue.index}-${issue.message}`}>#{issue.index + 1} {issue.message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
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
