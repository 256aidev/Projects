import { create } from 'zustand';
import * as authApi from '../api/auth';
import type { User } from '../api/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  // Derived
  isAuthenticated: boolean;

  // Actions
  initialize: () => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,
  error: null,
  isAuthenticated: false,

  initialize: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ initialized: true, loading: false });
      return;
    }

    set({ loading: true });
    try {
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, initialized: true, loading: false, error: null });
    } catch (err) {
      console.error('Failed to restore session:', err);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, isAuthenticated: false, initialized: true, loading: false });
    }
  },

  signUp: async (email, password, displayName) => {
    set({ loading: true, error: null });
    try {
      await authApi.signup(email, password, displayName);
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      console.error('Sign up error:', err);
      set({ loading: false, error: message });
      throw err;
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await authApi.login(email, password);
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      console.error('Sign in error:', err);
      set({ loading: false, error: message });
      throw err;
    }
  },

  signOut: async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    set({ user: null, isAuthenticated: false, error: null });
  },
}));
