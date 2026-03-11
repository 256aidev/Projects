import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiClient } from '../api/client';
import { User, LoginRequest, SignupRequest, AuthResponse } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      const token = await apiClient.init();
      if (token) {
        const profile = await apiClient.get<User>('/api/auth/me');
        setUser(profile);
      }
    } catch {
      await apiClient.clearToken();
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-logout on 401
  useEffect(() => {
    apiClient.setOnUnauthorized(() => {
      setUser(null);
    });
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', data, false);
    await apiClient.setToken(response.accessToken, response.refreshToken);
    const profile = await apiClient.get<User>('/api/auth/me');
    setUser(profile);
  }, []);

  const signup = useCallback(async (data: SignupRequest) => {
    const response = await apiClient.post<AuthResponse>('/api/auth/signup', data, false);
    await apiClient.setToken(response.accessToken, response.refreshToken);
    const profile = await apiClient.get<User>('/api/auth/me');
    setUser(profile);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/api/auth/logout', {
        refreshToken: await apiClient.getToken(),
      });
    } catch {
      // Ignore logout errors
    }
    await apiClient.clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
