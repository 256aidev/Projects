import { useEffect } from 'react';
import { useChoreStore } from '../stores/choreStore';
import { useAuthStore } from '../stores/authStore';

/**
 * Convenience hook for chore operations.
 * Auto-loads chores when the user is authenticated.
 */
export function useChores() {
  const store = useChoreStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated && store.chores.length === 0 && !store.loading) {
      store.loadChores();
    }
  }, [isAuthenticated, store.chores.length, store.loading, store.loadChores]);

  return {
    chores: store.chores,
    activeChores: store.activeChores(),
    loading: store.loading,
    error: store.error,
    reload: store.loadChores,
    createChore: store.createChore,
    updateChore: store.updateChore,
    archiveChore: store.archiveChore,
    restoreChore: store.restoreChore,
  };
}
