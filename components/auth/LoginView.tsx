
import React, { useState } from 'react';
import { Lock, ArrowRight, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError(false);
    
    const success = await login(input);
    
    if (!success) {
      setError(true);
      setLoading(false);
    }
    // If success, the AuthContext state updates and App renders the dashboard
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-fade-in">
        
        <div className="p-8 pb-6 text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">安全访问</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            请输入您的 API Secret 以访问控制台
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
          <div className="relative">
            <input
              type="password"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(false); }}
              placeholder="API Access Code"
              className={`w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none transition-all ${
                error 
                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20' 
                : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
              } text-slate-900 dark:text-white placeholder-slate-400`}
              autoFocus
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              <ShieldCheck size={18} />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg animate-fade-in">
              <AlertCircle size={16} />
              <span>验证失败：密码错误或服务不可用</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !input}
            className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 dark:hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : <span>进入系统</span>}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

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
