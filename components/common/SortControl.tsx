
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
    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
      <select
        value={sortConfig.field}
        onChange={(e) => onSortChange(e.target.value as SortField)}
        className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none pl-2 pr-1 cursor-pointer"
      >
        {options.map((field) => (
          <option key={field} value={field}>
            按{getSortLabel(field)}
          </option>
        ))}
      </select>
      
      <button
        onClick={onDirectionToggle}
        className="p-1.5 hover:bg-slate-200 rounded-md text-slate-500 hover:text-indigo-600 transition-colors"
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
