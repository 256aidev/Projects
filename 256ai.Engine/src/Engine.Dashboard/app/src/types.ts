export interface HealthSummary {
  overallStatus: string;
  workerCount: { online: number; total: number };
  appHealth: Record<string, unknown>;
  syntheticChecks: unknown[];
  escalations: unknown[];
}

export interface Worker {
  workerId: string;
  status: string;
  isOnline: boolean;
  role: string;
  provider: string;
  ipAddress: string;
  lastSeenAt: string;
  capacityJson: string;
  lastTaskId: string | null;
}

export interface Task {
  taskId: string;
  objective: string;
  domain: string;
  status: string;
  projectId: string | null;
  assignedWorkerId: string | null;
  createdAt: string;
  leasedAt: string | null;
  ackedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  cancelledAt: string | null;
  resultJson: string | null;
  outputJson: string | null;
  errorMessage: string | null;
  expectedOutputs: string | null;
  retryCount: number;
}

export interface TaskProgress {
  progressId: string;
  taskId: string;
  message: string;
  percentage: number | null;
  createdAt: string;
}

export interface Escalation {
  escalationId: string;
  taskId: string;
  reason: string;
  severity: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
}

export interface Project {
  projectId: string;
  name: string;
  description: string | null;
}

export interface Machine {
  machineId: string;
  displayName: string;
  hostname: string;
  ipAddress: string;
  os: string;
  role: string;
  alwaysOn: boolean;
  servicesJson: string;
  workerIdsJson: string;
  domainsJson: string;
}

export type TabId = 'dashboard' | 'tasks' | 'machines' | 'settings';
export type TaskStatus = 'PENDING' | 'LEASED' | 'ACKED' | 'RUNNING' | 'COMPLETED' | 'FAIL' | 'CANCELLED' | 'DLQ';
export type ViewMode = 'list' | 'kanban';
