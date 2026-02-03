
import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Check, Server } from 'lucide-react';

interface PrivacyFieldProps {
  content: string;
  className?: string;
  compact?: boolean;
}

const PrivacyField: React.FC<PrivacyFieldProps> = ({ content, className = '', compact = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ipCopied, setIpCopied] = useState(false);

  // Regex to find IPv4 address
  const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;
  const ipMatch = content.match(ipRegex);
  const ipAddress = ipMatch ? ipMatch[0] : null;

  const handleCopy = (text: string, isIp = false) => {
    navigator.clipboard.writeText(text);
    if (isIp) {
      setIpCopied(true);
      setTimeout(() => setIpCopied(false), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!content) return null;

  return (
    <div className={`flex items-center gap-2 group ${className} max-w-full`}>
      <div 
        className={`
          font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 
          rounded px-2 py-0.5 flex items-center gap-2 overflow-hidden border border-slate-200 dark:border-slate-700
          ${compact ? 'text-[10px] h-6' : 'text-xs h-7'}
        `}
      >
        {isVisible ? (
          <span className="truncate min-w-0" title={content}>{content}</span>
        ) : (
          <span className="tracking-widest opacity-60">••••••</span>
        )}
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); setIsVisible(!isVisible); }}
          className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-400 transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-800"
          title={isVisible ? "隐藏内容" : "显示内容"}
        >
          {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); handleCopy(content); }}
          className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-400 transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-800"
          title="复制全部内容"
        >
          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
        </button>

        {ipAddress && (
           <button
             onClick={(e) => { e.stopPropagation(); handleCopy(ipAddress, true); }}
             className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-400 transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-800 relative"
             title={`复制检测到的 IP: ${ipAddress}`}
           >
             {ipCopied ? <Check size={14} className="text-emerald-500" /> : <Server size={14} />}
           </button>
        )}
      </div>
    </div>
  );
};

export default PrivacyField;
