
import { Resource } from '../types/index';

const API_BASE = '/api/v1/resources';
const API_BULK = '/api/v1/resources/bulk';

const getHeaders = () => {
  const token = localStorage.getItem('cloudtrack_access_token') || '';
  return {
    'Content-Type': 'application/json',
    'x-api-key': token
  };
};

export const resourceService = {
  fetchAll: async (): Promise<Resource[]> => {
    try {
      const res = await fetch(API_BASE, { headers: getHeaders() });
      if (res.status === 401) {
        throw new Error('Unauthorized');
      }
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      return json.data || [];
    } catch (error) {
      console.error('Fetch error:', error);
      // If unauthorized, we might want to trigger a logout, but for now allow the error to bubble or return empty
      if ((error as Error).message === 'Unauthorized') {
         window.location.reload(); // Simple way to reset state if token is invalid
      }
      throw error;
    }
  },

  create: async (resource: Partial<Resource>): Promise<Resource> => {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(resource)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create resource');
    return json.data;
  },

  update: async (resource: Resource): Promise<Resource> => {
    const res = await fetch(`${API_BASE}/${resource.id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(resource)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update resource');
    return json.data;
  },

  delete: async (id: string): Promise<boolean> => {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
       const json = await res.json();
       throw new Error(json.error || 'Failed to delete');
    }
    return res.ok;
  },

  importData: async (resources: Resource[]): Promise<boolean> => {
    try {
      const res = await fetch(API_BULK, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ resources, mode: 'overwrite' })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Import failed');
      return true;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
};
