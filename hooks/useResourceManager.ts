
import { useState, useEffect, useCallback } from 'react';
import { Resource } from '../types/index';
import { resourceService } from '../services/resourceService';

export const useResourceManager = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await resourceService.fetchAll();
      setResources(data);
    } catch (err) {
      console.error(err);
      setError('无法加载资源数据');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const addResource = async (resourceData: Resource) => {
    // Optimistic UI update can be complex with ID generation, 
    // so we'll wait for the server for creation to be safe, 
    // or manually generate ID here.
    try {
      const savedResource = await resourceService.create(resourceData);
      setResources(prev => [...prev, savedResource]);
      return savedResource;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const updateResource = async (resourceData: Resource) => {
    try {
      const savedResource = await resourceService.update(resourceData);
      setResources(prev => prev.map(r => r.id === savedResource.id ? savedResource : r));
      return savedResource;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const deleteResource = async (id: string) => {
    // Optimistic update
    const original = [...resources];
    setResources(prev => prev.filter(r => r.id !== id));
    
    try {
      await resourceService.delete(id);
    } catch (e) {
      console.error(e);
      // Rollback
      setResources(original);
      throw new Error('删除失败');
    }
  };

  return {
    resources,
    isLoading,
    error,
    addResource,
    updateResource,
    deleteResource,
    refreshResources: fetchResources
  };
};
