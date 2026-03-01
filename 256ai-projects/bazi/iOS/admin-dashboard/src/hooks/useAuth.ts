import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api/client';
import type { AdminUser, LoginResponse } from '../types';

interface AuthState {
  isAuthenticated: boolean;
  admin: AdminUser | null;
  isLoading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    admin: null,
    isLoading: true,
  });

  // Check for existing auth on mount
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const storedAdmin = localStorage.getItem('admin_user');

    if (token && storedAdmin) {
      try {
        const admin = JSON.parse(storedAdmin);
        setState({
          isAuthenticated: true,
          admin,
          isLoading: false,
        });
      } catch {
        // Invalid stored data, clear it
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        setState({
          isAuthenticated: false,
          admin: null,
          isLoading: false,
        });
      }
    } else {
      setState({
        isAuthenticated: false,
        admin: null,
        isLoading: false,
      });
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const response: LoginResponse = await adminApi.login(email, password);

    // Store token and admin info
    localStorage.setItem('admin_token', response.access_token);
    localStorage.setItem('admin_user', JSON.stringify(response.admin));

    setState({
      isAuthenticated: true,
      admin: response.admin as AdminUser,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setState({
      isAuthenticated: false,
      admin: null,
      isLoading: false,
    });
  }, []);

  return {
    ...state,
    login,
    logout,
  };
}
