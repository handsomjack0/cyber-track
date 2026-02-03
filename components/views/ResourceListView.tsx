
import React, { useState } from 'react';
import { Resource, ResourceType } from '../../types';
import ResourceTable from '../resources/ResourceTable';
import SearchInput from '../common/SearchInput';

interface ResourceListViewProps {
  title: string;
  subtitle: string;
  resources: Resource[];
  resourceType: ResourceType;
  onAdd: () => void;
  onEdit: (resource: Resource) => void;
  onDelete: (id: string) => void;
  addButtonLabel: string;
}

const ResourceListView: React.FC<ResourceListViewProps> = ({ 
  title, subtitle, resources, resourceType, onAdd, onEdit, onDelete, addButtonLabel 
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter by Type AND Search Query
  const filteredResources = resources.filter(r => {
    const matchesType = r.type === resourceType;
    if (!matchesType) return false;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return r.name.toLowerCase().includes(query) || 
             r.provider.toLowerCase().includes(query);
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
             <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
             <p className="text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex-1 md:w-64">
              <SearchInput value={searchQuery} onChange={setSearchQuery} />
            </div>
            <button 
              onClick={onAdd}
              className="bg-black dark:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors whitespace-nowrap shadow-sm h-[42px]"
            >
              {addButtonLabel}
            </button>
          </div>
       </div>

       <ResourceTable 
          title={`${title} List`} 
          resources={filteredResources} 
          onDelete={onDelete}
          onEdit={onEdit}
          hideHeader
        />
    </div>
  );
};

export default ResourceListView;
