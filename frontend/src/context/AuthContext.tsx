import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, RoleType } from '../types';
import { LandGuardApi } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: RoleType | null;
  permissions: string[];
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string; phone_number?: string }) => Promise<void>;
  logout: () => Promise<void>;
  demoLogin: (role: RoleType) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('landguard_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    try {
      const res = await LandGuardApi.auth.getMe();
      if (res && res.user) {
        setUser(res.user);
      }
    } catch (err) {
      // If session is expired, reset token
      localStorage.removeItem('landguard_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('landguard_token');
    if (savedToken) {
      refreshProfile();
    } else {
      // Automatically initialize default Citizen User for seamless prototype exploration
      demoLogin('USER');
    }
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await LandGuardApi.auth.login(credentials);
      if (res.token) {
        localStorage.setItem('landguard_token', res.token);
        setToken(res.token);
      }
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: { email: string; password: string; full_name: string; phone_number?: string }) => {
    setLoading(true);
    try {
      const res = await LandGuardApi.auth.register(data);
      if (res.token) {
        localStorage.setItem('landguard_token', res.token);
        setToken(res.token);
      }
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await LandGuardApi.auth.logout();
    } catch (err) {
      // Ignore
    } finally {
      localStorage.removeItem('landguard_token');
      setToken(null);
      setUser(null);
      setLoading(false);
    }
  };

  const demoLogin = async (targetRole: RoleType) => {
    const creds: Record<RoleType, { email: string; password: string }> = {
      USER: { email: 'user@landguard.in', password: 'User@123' },
      ADMIN: { email: 'admin@landguard.in', password: 'Admin@123' },
      SUPER_ADMIN: { email: 'superadmin@landguard.in', password: 'SuperAdmin@123' }
    };
    await login(creds[targetRole]);
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN',
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    role: user?.role || null,
    permissions: user?.permissions || [],
    login,
    register,
    logout,
    demoLogin,
    refreshProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
