import { useEffect } from 'react';
import { useHouseholdStore } from '../stores/householdStore';
import { useAuthStore } from '../stores/authStore';

/**
 * Convenience hook wrapping householdStore.
 * Auto-loads household data when the user is authenticated.
 */
export function useHousehold() {
  const store = useHouseholdStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated && !store.household && !store.loading) {
      store.loadHousehold();
    }
  }, [isAuthenticated, store.household, store.loading, store.loadHousehold]);

  return {
    household: store.household,
    members: store.members,
    activeChildren: store.activeChildren(),
    parents: store.parents(),
    loading: store.loading,
    error: store.error,
    reload: store.loadHousehold,
    updateSettings: store.updateSettings,
    addChild: store.addChild,
    updateChild: store.updateChild,
    deactivateChild: store.deactivateChild,
  };
}
