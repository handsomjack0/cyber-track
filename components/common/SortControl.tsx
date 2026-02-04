import React from 'react';
import { ArrowDownWideNarrow, ArrowUpWideNarrow } from 'lucide-react';
import { SortConfig, SortField } from '../../types';
import { getSortLabel } from '../../utils/sortUtils';

interface SortControlProps {
  sortConfig: SortConfig;
  onSortChange: (field: SortField) => void;
  onDirectionToggle: () => void;
}

const SortControl: React.FC<SortControlProps> = ({ sortConfig, onSortChange, onDirectionToggle }) => {
  const options: SortField[] = ['expiryDate', 'name', 'provider', 'cost', 'status'];

  return (
    <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl px-2 py-1.5 shadow-sm">
      <select
        value={sortConfig.field}
        onChange={(e) => onSortChange(e.target.value as SortField)}
        className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none pl-2 pr-1 cursor-pointer"
      >
        {options.map((field) => (
          <option key={field} value={field}>
            按 {getSortLabel(field)}
          </option>
        ))}
      </select>

      <button
        onClick={onDirectionToggle}
        className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
        title={sortConfig.direction === 'asc' ? '当前：升序' : '当前：降序'}
      >
        {sortConfig.direction === 'asc' ? (
          <ArrowUpWideNarrow size={16} />
        ) : (
          <ArrowDownWideNarrow size={16} />
        )}
      </button>
    </div>
  );
};

export default SortControl;

