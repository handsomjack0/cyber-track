
import React, { useState } from 'react';
import { Lock, ArrowRight, Loader2, AlertCircle, ShieldCheck, Smartphone, Wrench } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [accessCode, setAccessCode] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'secret' | '2fa'>('secret');
  
  const [loading, setLoading] = useState(false);
  const [fixLoading, setFixLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSecretSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    // 第一次尝试登录，不带 OTP
    const result = await login(accessCode);
    
    setLoading(false);
    
    if (result.success) {
      return;
    }
    
    if (result.require2fa) {
      setStep('2fa');
    } else {
      setErrorMsg(result.error || '密码错误或数据库连接失败');
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;
    
    setLoading(true);
    setErrorMsg('');
    
    const result = await login(accessCode, otp);
    
    setLoading(false);
    
    if (!result.success) {
      setErrorMsg(result.error || '验证码错误');
    }
  };

  // 一键修复数据库结构
  const handleFixDatabase = async () => {
    if (!accessCode) {
      setErrorMsg('请先输入 API Secret 才能执行修复');
      return;
    }
    if (!window.confirm('确定要初始化/修复数据库表结构吗？此操作是安全的。')) return;

    setFixLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/setup/init-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: accessCode })
      });
      const data = await res.json();
      
      if (data.success) {
        setSuccessMsg(data.message);
      } else {
        setErrorMsg(data.error || '修复失败');
      }
    } catch (e) {
      setErrorMsg('请求失败，请检查网络');
    } finally {
      setFixLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-fade-in">
        
        <div className="p-8 pb-6 text-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transition-colors ${step === '2fa' ? 'bg-indigo-500 shadow-indigo-500/30' : 'bg-slate-900 shadow-slate-500/30'}`}>
            {step === '2fa' ? <Smartphone className="text-white" size={32} /> : <Lock className="text-white" size={32} />}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {step === '2fa' ? '双重验证' : '安全访问'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {step === '2fa' ? '验证码已发送至您的 Telegram Bot' : '请输入 API Secret 以访问管理控制台'}
          </p>
        </div>

        {step === 'secret' ? (
          <form onSubmit={handleSecretSubmit} className="px-8 pb-8 space-y-4">
            <div className="relative">
              <input
                type="password"
                value={accessCode}
                onChange={(e) => { setAccessCode(e.target.value); setErrorMsg(''); setSuccessMsg(''); }}
                placeholder="API Access Code"
                className={`w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none transition-all ${
                  errorMsg
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20' 
                  : 'border-slate-200 dark:border-slate-700 focus:border-slate-900 focus:ring-2 focus:ring-slate-500/20'
                } text-slate-900 dark:text-white placeholder-slate-400`}
                autoFocus
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                <ShieldCheck size={18} />
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg animate-fade-in">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}
            
            {successMsg && (
              <div className="flex items-center gap-2 text-emerald-600 text-sm bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg animate-fade-in">
                <ShieldCheck size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !accessCode}
              className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" /> : <span>验证身份</span>}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="px-8 pb-8 space-y-4 animate-fade-in">
            <div className="relative">
              <input
                type="text"
                value={otp}
                onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setErrorMsg(''); }}
                placeholder="6位验证码"
                maxLength={6}
                className={`w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none transition-all text-center tracking-widest font-mono text-lg ${
                  errorMsg
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20' 
                  : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                } text-slate-900 dark:text-white placeholder-slate-400`}
                autoFocus
              />
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg animate-fade-in">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" /> : <span>确认登录</span>}
            </button>
            
            <button 
              type="button"
              onClick={() => { setStep('secret'); setErrorMsg(''); }}
              className="w-full text-slate-400 hover:text-slate-600 text-sm py-2"
            >
              返回上一步
            </button>
          </form>
        )}

        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 text-center border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
          <p className="text-xs text-slate-400">
            Cloudflare Pages Zero Trust Access
          </p>
          {/* 这里是修复按钮，只有在 secret 输入框有值时才建议点击，或者点击后提示输入 */}
          <button 
             onClick={handleFixDatabase}
             disabled={fixLoading}
             className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1 mt-1 transition-colors"
          >
             {fixLoading ? <Loader2 size={12} className="animate-spin" /> : <Wrench size={12} />}
             遇到数据库错误? 点击修复
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
