import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { requestJson } from '../utils/apiClient';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  refreshAuth: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const isDevBypassEnabled = () => {
    const flag = (import.meta as any).env?.VITE_DEV_BYPASS_ACCESS;
    const isLocalhost = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    return isLocalhost && (flag === 'true' || flag === '1');
  };

  const refreshAuth = useCallback(async () => {
    setLoading(true);
    try {
      if (isDevBypassEnabled()) {
        setIsAuthenticated(true);
        return;
      }
      const res = await requestJson<{ authenticated?: boolean }>(
        '/api/auth/session',
        { throwOnError: false, timeoutMs: 8000 }
      );
      setIsAuthenticated(Boolean(res.ok && res.data?.authenticated));
    } catch (e) {
      console.warn('Access session check failed', e);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, refreshAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
