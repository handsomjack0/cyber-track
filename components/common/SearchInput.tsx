import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder = '搜索资源...' }) => {
  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        <Search size={16} className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
      </div>
      <input
        type="text"
        className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 dark:border-slate-800 rounded-2xl leading-5 bg-white/90 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 sm:text-sm transition-all shadow-sm"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;

