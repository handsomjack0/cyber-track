
import { Resource } from '../types';

const API_BASE = '/api/v1/resources';
const API_BULK = '/api/v1/resources/bulk';
// Note: In production, this secret should be handled via a proper auth context
const API_SECRET = 'demo-secret'; 

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': API_SECRET
};

export const resourceService = {
  fetchAll: async (): Promise<Resource[]> => {
    try {
      const res = await fetch(API_BASE, { headers });
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      return json.data || [];
    } catch (error) {
      console.error('Fetch error:', error);
      return [];
    }
  },

  create: async (resource: Partial<Resource>): Promise<Resource> => {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers,
      body: JSON.stringify(resource)
    });
    if (!res.ok) throw new Error('Failed to create');
    const json = await res.json();
    return json.data;
  },

  update: async (resource: Resource): Promise<Resource> => {
    const res = await fetch(`${API_BASE}/${resource.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(resource)
    });
    if (!res.ok) throw new Error('Failed to update');
    const json = await res.json();
    return json.data;
  },

  delete: async (id: string): Promise<boolean> => {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers
    });
    return res.ok;
  },

  importData: async (resources: Resource[]): Promise<boolean> => {
    try {
      const res = await fetch(API_BULK, {
        method: 'POST',
        headers,
        body: JSON.stringify({ resources, mode: 'overwrite' })
      });
      if (!res.ok) throw new Error('Import failed');
      return true;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
};
