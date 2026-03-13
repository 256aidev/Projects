import { useEffect } from 'react';
import { useAssignmentStore } from '../stores/assignmentStore';
import { useAuthStore } from '../stores/authStore';

/**
 * Convenience hook for assignment operations.
 * Auto-loads today's assignments and pending approvals when authenticated.
 */
export function useAssignments() {
  const store = useAssignmentStore();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated && store.todayAssignments.length === 0 && !store.loading) {
      store.loadTodayAssignments();
    }
  }, [isAuthenticated, store.todayAssignments.length, store.loading, store.loadTodayAssignments]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'parent' && store.pendingApprovals.length === 0 && !store.loading) {
      store.loadPendingApprovals();
    }
  }, [isAuthenticated, user?.role, store.pendingApprovals.length, store.loading, store.loadPendingApprovals]);

  return {
    todayAssignments: store.todayAssignments,
    pendingApprovals: store.pendingApprovals,
    myChores: user ? store.myChores(user.id) : [],
    overdueChores: store.overdueChores(),
    completedToday: user ? store.completedToday(user.id) : [],
    loading: store.loading,
    error: store.error,
    reload: store.loadTodayAssignments,
    reloadApprovals: store.loadPendingApprovals,
    markComplete: store.markComplete,
    approveAssignment: store.approveAssignment,
    rejectAssignment: store.rejectAssignment,
    generateAssignments: store.generateAssignments,
  };
}
