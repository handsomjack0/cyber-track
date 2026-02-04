
import { Resource } from '../types/index';
import { requestJson } from '../utils/apiClient';

const API_BASE = '/api/v1/resources';
const API_BULK = '/api/v1/resources/bulk';

const getHeaders = () => {
  return {
    'Content-Type': 'application/json'
  };
};

export const resourceService = {
  fetchAll: async (): Promise<Resource[]> => {
    try {
      const res = await requestJson<{ data?: Resource[]; error?: string }>(API_BASE, {
        headers: getHeaders(),
        timeoutMs: 10000
      });
      if (!res.ok) {
        throw new Error(res.data?.error || 'Failed to fetch');
      }
      return res.data?.data || [];
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  },

  create: async (resource: Partial<Resource>): Promise<Resource> => {
    const res = await requestJson<{ data?: Resource; error?: string }>(API_BASE, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(resource),
      timeoutMs: 10000
    });
    if (!res.ok) throw new Error(res.data?.error || 'Failed to create resource');
    if (!res.data?.data) throw new Error('Failed to create resource');
    return res.data.data;
  },

  update: async (resource: Resource): Promise<Resource> => {
    const res = await requestJson<{ data?: Resource; error?: string }>(
      `${API_BASE}/${resource.id}`,
      {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(resource),
        timeoutMs: 10000
      }
    );
    if (!res.ok) throw new Error(res.data?.error || 'Failed to update resource');
    if (!res.data?.data) throw new Error('Failed to update resource');
    return res.data.data;
  },

  delete: async (id: string): Promise<boolean> => {
    const res = await requestJson<{ error?: string }>(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
      timeoutMs: 10000
    });
    if (!res.ok) {
      throw new Error(res.data?.error || 'Failed to delete');
    }
    return true;
  },

  importData: async (resources: Resource[], mode: 'overwrite' | 'merge'): Promise<boolean> => {
    try {
      const res = await requestJson<{ error?: string }>(API_BULK, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ resources, mode }),
        timeoutMs: 15000
      });
      if (!res.ok) throw new Error(res.data?.error || 'Import failed');
      return true;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
};
