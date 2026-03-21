import type { HealthSummary, Worker, Task, TaskProgress, Escalation, Project, Machine } from './types';

const API_BASE = 'http://10.0.1.147:5100';

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  getHealthSummary: () => fetchJson<HealthSummary>('/health/summary'),
  getWorkers: () => fetchJson<Worker[]>('/health/workers'),
  getTasks: (limit = 50, status?: string, projectId?: string) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (status) params.set('status', status);
    if (projectId) params.set('projectId', projectId);
    return fetchJson<Task[]>(`/tasks?${params}`);
  },
  getTask: (taskId: string) => fetchJson<Task>(`/tasks/${taskId}`),
  createTask: (data: { objective: string; domain: string; expectedOutputs?: string; projectId?: string }) =>
    fetchJson<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  cancelTask: (taskId: string) => fetchJson<unknown>(`/tasks/${taskId}/cancel`, { method: 'POST' }),
  retryTask: (taskId: string) => fetchJson<unknown>(`/tasks/${taskId}/retry`, { method: 'POST' }),
  ackTask: (taskId: string) => fetchJson<unknown>(`/tasks/${taskId}/ack`, { method: 'POST' }),
  getTaskProgress: (taskId: string) => fetchJson<TaskProgress[]>(`/tasks/${taskId}/progress`),
  getEscalations: () => fetchJson<Escalation[]>('/escalations'),
  getProjects: () => fetchJson<Project[]>('/projects'),
  getMachines: () => fetchJson<Machine[]>('/machines'),
  removeWorker: (workerId: string) => fetchJson<unknown>(`/health/workers/${workerId}`, { method: 'DELETE' }),
};
