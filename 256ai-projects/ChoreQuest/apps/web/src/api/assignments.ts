import client from './client';
import type { PendingApproval } from './dashboard';

export interface Assignment {
  id: string;
  household_id: string;
  chore_id: string;
  assigned_child_id: string;
  effective_date: string;
  due_at: string | null;
  status: string;
  completed_at: string | null;
  completion_note: string | null;
  approved_at: string | null;
  approver_id: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  chore_title?: string;
  child_name?: string;
  points?: number;
}

export interface AssignmentParams {
  date?: string;
  status?: string;
  child_id?: string;
}

export async function getAssignments(
  params?: AssignmentParams,
): Promise<Assignment[]> {
  const { data } = await client.get<Assignment[]>(
    '/households/me/assignments',
    { params },
  );
  return data;
}

export async function completeAssignment(
  id: string,
  note?: string,
): Promise<Assignment> {
  const { data } = await client.post<Assignment>(
    `/assignments/${id}/complete`,
    note ? { completion_note: note } : undefined,
  );
  return data;
}

export async function approveAssignment(id: string): Promise<Assignment> {
  const { data } = await client.post<Assignment>(
    `/assignments/${id}/approve`,
  );
  return data;
}

export async function rejectAssignment(
  id: string,
  reason?: string,
): Promise<Assignment> {
  const { data } = await client.post<Assignment>(
    `/assignments/${id}/reject`,
    reason ? { rejection_reason: reason } : undefined,
  );
  return data;
}

export async function generateAssignments(): Promise<Assignment[]> {
  const { data } = await client.post<Assignment[]>(
    '/households/me/assignments/generate',
  );
  return data;
}

export async function getPendingApprovals(): Promise<PendingApproval[]> {
  const { data } = await client.get<PendingApproval[]>(
    '/households/me/approvals/pending',
  );
  return data;
}
