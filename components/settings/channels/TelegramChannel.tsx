import React, { useState } from 'react';
import { Send, CheckCircle, AlertCircle, Loader2, ShieldCheck, Bot, Zap, Info } from 'lucide-react';
import { TelegramConfig } from '../../../types';
import { sendTelegramTestMessage } from '../../../services/notifications/telegramService';

interface TelegramChannelProps {
  config: TelegramConfig;
  onChange: (config: TelegramConfig) => void;
}

const TelegramChannel: React.FC<TelegramChannelProps> = ({ config, onChange }) => {
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [setupLoading, setSetupLoading] = useState(false);
  const [setupStatus, setSetupStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [setupMsg, setSetupMsg] = useState('');
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectStatus, setInspectStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [inspectMsg, setInspectMsg] = useState('');
  const [inspectData, setInspectData] = useState<any>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestStatus('idle');
    try {
      await sendTelegramTestMessage(config);
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 3000);
    } catch (e: any) {
      console.error(e);
      setTestStatus('error');
      if (e.message?.includes('TELEGRAM_BOT_TOKEN')) {
        alert('测试失败：后端未配置 TELEGRAM_BOT_TOKEN 环境变量。请在 Cloudflare 设置中添加。');
      }
    } finally {
      setTesting(false);
    }
  };

  const handleAutoSetup = async () => {
    setSetupLoading(true);
    setSetupStatus('idle');
    setSetupMsg('');

    try {
      const response = await fetch('/api/telegram/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: window.location.origin })
      });

      const data = await response.json();

      if (data.ok) {
        const results = [data.commands?.default, data.commands?.private, data.commands?.group].filter(Boolean);
        const commandsOk = results.length > 0 && results.every((r: any) => r.ok !== false);
        setSetupStatus(commandsOk ? 'success' : 'error');
        setSetupMsg(commandsOk ? 'Webhook 激活成功，并已注册指令菜单！' : 'Webhook 成功，但指令菜单注册失败，请稍后重试。');
      } else {
        setSetupStatus('error');
        if (data.description?.includes('TELEGRAM_BOT_TOKEN')) {
          setSetupMsg('错误：未检测到 Token。请在 Cloudflare 项目设置中添加 TELEGRAM_BOT_TOKEN 并重新部署。');
        } else {
          setSetupMsg(data.description || '配置失败，请检查日志');
        }
      }
    } catch (e) {
      setSetupStatus('error');
      setSetupMsg('网络请求失败');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleInspectCommands = async () => {
    setInspectLoading(true);
    setInspectStatus('idle');
    setInspectMsg('');
    setInspectData(null);

    try {
      const response = await fetch('/api/telegram/commands');
      const data = await response.json();

      if (data.ok) {
        setInspectStatus('success');
        setInspectData(data.commands);
        setInspectMsg('已获取当前指令菜单。');
      } else {
        setInspectStatus('error');
        setInspectMsg(data.description || '获取失败，请检查后端日志');
      }
    } catch (e) {
      setInspectStatus('error');
      setInspectMsg('网络请求失败');
    } finally {
      setInspectLoading(false);
    }
  };

  return (
    <div className={`border rounded-xl p-6 transition-all ${config.enabled ? 'bg-white/90 dark:bg-slate-900/70 border-sky-400/30 dark:border-slate-800 shadow-sm' : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/60 opacity-80'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-500 text-white rounded-lg flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Send size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Telegram Bot</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">通过 Cloudflare Function 安全代理发送</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={config.enabled}
            onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
          />
          <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-400/20 dark:peer-focus:ring-sky-400/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
        </label>
      </div>

      {config.enabled && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-sky-400/10 dark:bg-indigo-900/20 border border-sky-400/30 dark:border-sky-400/30 rounded-lg p-3">
            <div className="flex gap-2 items-start">
              <ShieldCheck className="text-sky-300 dark:text-sky-300 shrink-0 mt-0.5" size={16} />
              <div className="text-xs text-sky-200 dark:text-sky-200">
                <p className="font-semibold mb-1">后端配置指南（Bot Token）</p>
                <p>Bot Token 是最高权限密钥，<strong>禁止</strong>在前端保存。请在 Cloudflare Pages 的 <strong>Settings &gt; Environment variables</strong> 中添加：</p>
                <code className="block bg-white dark:bg-slate-900 px-2 py-1 mt-1 rounded border border-sky-400/30 dark:border-sky-400/30 font-mono text-sky-300 dark:text-sky-300 select-all">
                  TELEGRAM_BOT_TOKEN
                </code>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Chat ID（接收者 ID）</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                placeholder="例如：123456789"
                value={config.chatId}
                onChange={(e) => onChange({ ...config, chatId: e.target.value })}
              />
              <button
                onClick={handleTest}
                disabled={!config.chatId || testing}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors
                  ${testStatus === 'success' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    testStatus === 'error' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                {testing ? <Loader2 size={16} className="animate-spin" /> :
                  testStatus === 'success' ? <CheckCircle size={16} /> :
                  testStatus === 'error' ? <AlertCircle size={16} /> :
                  <Send size={16} />}
                {testStatus === 'success' ? '发送成功' : testStatus === 'error' ? '发送失败' : '测试通知'}
              </button>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 dark:text-slate-400">
              <Info size={12} />
              <span>Chat ID 仅用于标识接收者，属于公开信息，可放心保存。</span>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
            <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <Bot size={18} className="text-sky-500" />
              启用双向指令交互（可选）
            </h4>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                如需 Bot 响应 <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">/status</code> 等指令，需要注册 Webhook。
                <br />
                系统会自动使用当前 Token 和站点地址进行配置。
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleAutoSetup}
                  disabled={setupLoading}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 shadow-sm transition-all
                    ${setupStatus === 'success' ? 'bg-blue-600 hover:bg-blue-700' :
                      'bg-slate-900 dark:bg-sky-500 hover:bg-slate-800 dark:hover:bg-sky-600 disabled:opacity-70 disabled:cursor-not-allowed'}`}
                >
                  {setupLoading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                  {setupLoading ? '配置中...' : setupStatus === 'success' ? '已重新激活' : '一键激活 Webhook'}
                </button>
              </div>

              {setupMsg && (
                <div className={`mt-3 text-xs flex items-center gap-1.5 ${setupStatus === 'success' ? 'text-blue-600 dark:text-blue-400' : 'text-rose-500 dark:text-rose-400'}`}>
                  {setupStatus === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  {setupMsg}
                </div>
              )}
            </div>

            <div className="mt-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                一键检测 Telegram 侧已注册的指令菜单，便于排查 “/ 不显示” 的问题。
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleInspectCommands}
                  disabled={inspectLoading}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 shadow-sm transition-all
                    ${inspectStatus === 'success' ? 'bg-blue-600 hover:bg-blue-700' :
                      'bg-slate-900 dark:bg-sky-500 hover:bg-slate-800 dark:hover:bg-sky-600 disabled:opacity-70 disabled:cursor-not-allowed'}`}
                >
                  {inspectLoading ? <Loader2 size={16} className="animate-spin" /> : <Info size={16} />}
                  {inspectLoading ? '检测中...' : '检测指令菜单'}
                </button>
              </div>

              {inspectMsg && (
                <div className={`mt-3 text-xs flex items-center gap-1.5 ${inspectStatus === 'success' ? 'text-blue-600 dark:text-blue-400' : 'text-rose-500 dark:text-rose-400'}`}>
                  {inspectStatus === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  {inspectMsg}
                </div>
              )}

              {inspectData && (
                <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <div>default: {inspectData.default?.result?.length ?? 0} 条指令</div>
                  <div>private: {inspectData.private?.result?.length ?? 0} 条指令</div>
                  <div>group: {inspectData.group?.result?.length ?? 0} 条指令</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelegramChannel;

