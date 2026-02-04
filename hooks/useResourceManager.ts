import { useState, useEffect, useCallback } from 'react';
import { Resource } from '../types/index';
import { resourceService } from '../services/resourceService';
import { ApiError } from '../utils/apiClient';
import { useAuth } from '../context/AuthContext';

export const useResourceManager = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logout } = useAuth();

  const CACHE_KEY = 'cloudtrack_resources_cache';

  const persistCache = (data: Resource[]) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
    } catch {
      // Ignore cache write errors
    }
  };

  const loadCache = (): Resource[] | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      const parsed = JSON.parse(cached);
      return Array.isArray(parsed.data) ? parsed.data : null;
    } catch {
      return null;
    }
  };

  const fetchResources = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const data = await resourceService.fetchAll();
      setResources(data);
      persistCache(data);
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError && err.status === 401) {
        logout();
        setError('Login expired. Please sign in again.');
      } else {
        setError('Failed to load resources.');
      }
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [logout]);

  useEffect(() => {
    const cached = loadCache();
    if (cached) {
      setResources(cached);
      setIsLoading(false);
      fetchResources({ silent: true });
    } else {
      fetchResources();
    }
  }, [fetchResources]);

  const addResource = async (resourceData: Resource) => {
    // Optimistic UI update can be complex with ID generation,
    // so we'll wait for the server for creation to be safe,
    // or manually generate ID here.
    try {
      const savedResource = await resourceService.create(resourceData);
      setResources(prev => {
        const next = [...prev, savedResource];
        persistCache(next);
        return next;
      });
      return savedResource;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const updateResource = async (resourceData: Resource) => {
    try {
      const savedResource = await resourceService.update(resourceData);
      setResources(prev => {
        const next = prev.map(r => r.id === savedResource.id ? savedResource : r);
        persistCache(next);
        return next;
      });
      return savedResource;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const deleteResource = async (id: string) => {
    // Optimistic update
    const original = [...resources];
    setResources(prev => {
      const next = prev.filter(r => r.id !== id);
      persistCache(next);
      return next;
    });

    try {
      await resourceService.delete(id);
    } catch (e) {
      console.error(e);
      // Rollback
      setResources(original);
      persistCache(original);
      throw new Error('删除失败');
    }
  };

  return {
    resources,
    isLoading,
    isRefreshing,
    error,
    addResource,
    updateResource,
    deleteResource,
    refreshResources: fetchResources
  };
};
