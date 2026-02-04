import React from 'react';
import { Lock, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LoginView: React.FC = () => {
  const { refreshAuth, loading } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-fade-in">
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg bg-slate-900 shadow-slate-500/30">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            访问受保护
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            该页面由 Cloudflare Access 保护，请先完成 SSO 登录。
          </p>
        </div>

        <div className="px-8 pb-8">
          <button
            type="button"
            onClick={() => refreshAuth()}
            disabled={loading}
            className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '检查中...' : '我已登录，重新检测'}
            {!loading && <RefreshCw size={18} />}
          </button>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 text-center border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-400">
            Cloudflare Pages Zero Trust Access
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
