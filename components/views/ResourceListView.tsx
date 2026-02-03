
import React from 'react';
import { Resource, ResourceType } from '../../types';
import ResourceTable from '../resources/ResourceTable';

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
  const filteredResources = resources.filter(r => r.type === resourceType);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
       <div className="flex justify-between items-end">
          <div>
             <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
             <p className="text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
          </div>
          <button 
            onClick={onAdd}
            className="bg-black dark:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors"
          >
            {addButtonLabel}
          </button>
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
