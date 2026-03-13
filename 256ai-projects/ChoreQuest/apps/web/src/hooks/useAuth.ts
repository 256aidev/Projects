import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

/**
 * Convenience hook wrapping authStore.
 * Automatically initializes auth state on first use.
 */
export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    if (!store.initialized) {
      store.initialize();
    }
  }, [store.initialized, store.initialize]);

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.loading,
    initialized: store.initialized,
    error: store.error,
    signUp: store.signUp,
    signIn: store.signIn,
    signOut: store.signOut,
  };
}
