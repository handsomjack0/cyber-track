
import { Resource, SortConfig } from '../types';

export const sortResources = (resources: Resource[], config: SortConfig): Resource[] => {
  return [...resources].sort((a, b) => {
    const { field, direction } = config;
    let aVal: any = a[field];
    let bVal: any = b[field];

    // Handle date comparison specifically
    if (field === 'expiryDate') {
      // Treat missing dates as far future (Infinity) or far past (0) depending on needs.
      // Usually "No expiry" means active forever, so let's put them at the end of ASC sort.
      aVal = a.expiryDate ? new Date(a.expiryDate).getTime() : 9999999999999;
      bVal = b.expiryDate ? new Date(b.expiryDate).getTime() : 9999999999999;
    }
    
    // Handle string case-insensitive comparison
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) {
      return direction === 'asc' ? -1 : 1;
    }
    if (aVal > bVal) {
      return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
};

export const getSortLabel = (field: string): string => {
  switch (field) {
    case 'name': return '名称';
    case 'provider': return '服务商';
    case 'expiryDate': return '到期日';
    case 'cost': return '费用';
    case 'status': return '状态';
    default: return field;
  }
};
