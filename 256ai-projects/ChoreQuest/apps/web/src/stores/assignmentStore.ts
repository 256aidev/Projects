import { create } from 'zustand';
import * as assignmentsApi from '../api/assignments';
import type { Assignment } from '../api/assignments';
import type { PendingApproval } from '../api/dashboard';

interface AssignmentState {
  todayAssignments: Assignment[];
  pendingApprovals: PendingApproval[];
  loading: boolean;
  error: string | null;

  // Derived
  myChores: (userId: string) => Assignment[];
  overdueChores: () => Assignment[];
  completedToday: (userId: string) => Assignment[];

  // Actions
  loadTodayAssignments: () => Promise<void>;
  loadPendingApprovals: () => Promise<void>;
  markComplete: (assignmentId: string, note?: string) => Promise<void>;
  approveAssignment: (assignmentId: string) => Promise<void>;
  rejectAssignment: (assignmentId: string, reason?: string) => Promise<void>;
  generateAssignments: () => Promise<void>;
}

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  todayAssignments: [],
  pendingApprovals: [],
  loading: false,
  error: null,

  myChores: (userId) =>
    get().todayAssignments.filter((a) => a.assigned_child_id === userId),

  overdueChores: () =>
    get().todayAssignments.filter((a) => a.status === 'overdue'),

  completedToday: (userId) =>
    get().todayAssignments.filter(
      (a) =>
        a.assigned_child_id === userId &&
        (a.status === 'completed' || a.status === 'approved' || a.status === 'awaiting_approval'),
    ),

  loadTodayAssignments: async () => {
    set({ loading: true, error: null });
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayAssignments = await assignmentsApi.getAssignments({ date: today });
      set({ todayAssignments, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load assignments';
      console.error('Load assignments error:', err);
      set({ loading: false, error: message });
    }
  },

  loadPendingApprovals: async () => {
    set({ loading: true, error: null });
    try {
      const pendingApprovals = await assignmentsApi.getPendingApprovals();
      set({ pendingApprovals, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load pending approvals';
      console.error('Load pending approvals error:', err);
      set({ loading: false, error: message });
    }
  },

  markComplete: async (assignmentId, note) => {
    set({ loading: true, error: null });
    try {
      await assignmentsApi.completeAssignment(assignmentId, note);
      // Refresh both lists
      const today = new Date().toISOString().split('T')[0];
      const [todayAssignments, pendingApprovals] = await Promise.all([
        assignmentsApi.getAssignments({ date: today }),
        assignmentsApi.getPendingApprovals(),
      ]);
      set({ todayAssignments, pendingApprovals, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete assignment';
      console.error('Complete assignment error:', err);
      set({ loading: false, error: message });
      throw err;
    }
  },

  approveAssignment: async (assignmentId) => {
    set({ loading: true, error: null });
    try {
      await assignmentsApi.approveAssignment(assignmentId);
      const today = new Date().toISOString().split('T')[0];
      const [todayAssignments, pendingApprovals] = await Promise.all([
        assignmentsApi.getAssignments({ date: today }),
        assignmentsApi.getPendingApprovals(),
      ]);
      set({ todayAssignments, pendingApprovals, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve assignment';
      console.error('Approve assignment error:', err);
      set({ loading: false, error: message });
      throw err;
    }
  },

  rejectAssignment: async (assignmentId, reason) => {
    set({ loading: true, error: null });
    try {
      await assignmentsApi.rejectAssignment(assignmentId, reason);
      const today = new Date().toISOString().split('T')[0];
      const [todayAssignments, pendingApprovals] = await Promise.all([
        assignmentsApi.getAssignments({ date: today }),
        assignmentsApi.getPendingApprovals(),
      ]);
      set({ todayAssignments, pendingApprovals, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reject assignment';
      console.error('Reject assignment error:', err);
      set({ loading: false, error: message });
      throw err;
    }
  },

  generateAssignments: async () => {
    set({ loading: true, error: null });
    try {
      await assignmentsApi.generateAssignments();
      const today = new Date().toISOString().split('T')[0];
      const todayAssignments = await assignmentsApi.getAssignments({ date: today });
      set({ todayAssignments, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate assignments';
      console.error('Generate assignments error:', err);
      set({ loading: false, error: message });
      throw err;
    }
  },
}));
