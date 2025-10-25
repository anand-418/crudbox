'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Organisation {
  uuid: string;
  name: string;
  user_uuid: string;
  created_at: string;
  updated_at: string;
}

interface User {
  uuid: string;
  email: string;
  organisations: Organisation[] | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        setToken(savedToken);
        try {
          const { userAPI } = await import('@/lib/api');
          const userResponse = await userAPI.getCurrentUser();
          setUser(userResponse.data.user);
        } catch {
          // Token might be invalid, clear it
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { authAPI, userAPI } = await import('@/lib/api');
      const response = await authAPI.login(email, password);
      const { token: newToken } = response.data;

      setToken(newToken);
      localStorage.setItem('token', newToken);

      // Get user info from backend
      const userResponse = await userAPI.getCurrentUser();
      setUser(userResponse.data.user);
    } catch (error) {
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const { authAPI } = await import('@/lib/api');
      await authAPI.signup(email, password);
    } catch (error) {
      throw error;
    }
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const { userAPI } = await import('@/lib/api');
        const userResponse = await userAPI.getCurrentUser();
        setUser(userResponse.data.user);
      } catch {
        // Token might be invalid, clear it
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    signup,
    logout,
    refreshUser,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};