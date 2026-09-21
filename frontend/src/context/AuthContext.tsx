import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (loginInput: string, passwordInput: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permissionKey: string) => boolean;
  hasRole: (roleName: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('erp_access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        setUser(res.data.data);
      } catch (err) {
        localStorage.removeItem('erp_access_token');
        localStorage.removeItem('erp_refresh_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (loginInput: string, passwordInput: string) => {
    const res = await api.post('/auth/login', {
      login: loginInput,
      password: passwordInput,
    });

    const { user: userData, accessToken, refreshToken } = res.data.data;

    localStorage.setItem('erp_access_token', accessToken);
    localStorage.setItem('erp_refresh_token', refreshToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('erp_access_token');
    localStorage.removeItem('erp_refresh_token');
    setUser(null);
    window.location.href = '/login';
  };

  const hasPermission = (permissionKey: string): boolean => {
    if (!user) return false;
    if (user.roles.includes('SUPER_ADMIN')) return true;
    return user.permissions.includes(permissionKey);
  };

  const hasRole = (roleName: string): boolean => {
    if (!user) return false;
    return user.roles.includes(roleName) || user.roles.includes('SUPER_ADMIN');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
