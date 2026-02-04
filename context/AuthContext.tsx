
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (accessCode: string, otp?: string) => Promise<{ success: boolean; require2fa?: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('cloudtrack_access_token');
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (accessCode: string, otp?: string): Promise<{ success: boolean; require2fa?: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': accessCode
        },
        body: JSON.stringify({ otp })
      });

      const data = await res.json();

      if (res.ok) {
        // Success
        localStorage.setItem('cloudtrack_access_token', accessCode);
        setToken(accessCode);
        setIsAuthenticated(true);
        return { success: true };
      } 
      
      // Handle 2FA Requirement
      if (res.status === 202 && data.require2fa) {
        return { success: false, require2fa: true };
      }

      return { success: false, error: data.error || '验证失败' };
    } catch (e) {
      console.error(e);
      return { success: false, error: '网络请求错误' };
    }
  };

  const logout = () => {
    localStorage.removeItem('cloudtrack_access_token');
    setToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout, loading }}>
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
