import type { HealthSummary, Worker, Task, Escalation } from '../types';
import StatCard from './StatCard';
import WorkerCard from './WorkerCard';
import TaskRow from './TaskRow';
import { timeAgo } from '../utils';

interface DashboardTabProps {
  health: HealthSummary | null;
  workers: Worker[];
  tasks: Task[];
  escalations: Escalation[];
  onRemoveWorker: (id: string) => void;
  onCancelTask: (id: string) => void;
  onRetryTask: (id: string) => void;
}

export default function DashboardTab({
  health,
  workers,
  tasks,
  escalations,
  onRemoveWorker,
  onCancelTask,
  onRetryTask,
}: DashboardTabProps) {
  const onlineCount = health?.workerCount?.online ?? workers.filter((w) => w.isOnline).length;
  const totalCount = health?.workerCount?.total ?? workers.length;
  const todayTasks = tasks.filter((t) => {
    const d = new Date(t.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const completedToday = todayTasks.filter((t) => t.status === 'COMPLETED').length;
  const activeTasks = tasks.filter((t) => ['RUNNING', 'LEASED', 'ACKED'].includes(t.status));
  const pendingEscalations = escalations.filter((e) => !e.resolvedAt);

  // Build activity feed from recent tasks
  const activityItems = tasks
    .slice(0, 20)
    .map((t) => {
      let icon = '>';
      let message = '';
      let ts = t.createdAt;
      if (t.status === 'COMPLETED') { icon = 'ok'; message = `Task completed: ${t.objective}`; ts = t.completedAt || t.createdAt; }
      else if (t.status === 'RUNNING') { icon = '>>'; message = `Task running: ${t.objective}`; ts = t.startedAt || t.createdAt; }
      else if (t.status === 'FAIL' || t.status === 'FAILED') { icon = '!!'; message = `Task failed: ${t.objective}`; ts = t.failedAt || t.createdAt; }
      else if (t.status === 'PENDING') { icon = '+'; message = `Task created: ${t.objective}`; ts = t.createdAt; }
      else { icon = '-'; message = `Task ${t.status}: ${t.objective}`; }
      return { icon, message, ts, status: t.status };
    })
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    .slice(0, 15);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Workers Online"
          value={`${onlineCount}/${totalCount}`}
          color={onlineCount > 0 ? 'green' : 'red'}
        />
        <StatCard
          title="Tasks Today"
          value={`${completedToday}/${todayTasks.length}`}
          subtitle={todayTasks.length > 0 ? `${Math.round((completedToday / todayTasks.length) * 100)}% complete` : undefined}
          color="blue"
        />
        <StatCard
          title="Active Tasks"
          value={String(activeTasks.length)}
          color="blue"
          pulse={activeTasks.length > 0}
        />
        <StatCard
          title="Escalations"
          value={String(pendingEscalations.length)}
          color={pendingEscalations.length > 0 ? 'amber' : 'green'}
        />
      </div>

      {/* Workers + Recent Tasks */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Workers */}
        <div>
          <h2 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Workers</h2>
          {workers.length === 0 ? (
            <div className="bg-[#1e293b] rounded-lg p-8 border border-slate-700/50 text-center text-slate-500">
              No workers registered
            </div>
          ) : (
            <div className="space-y-2">
              {workers
                .sort((a, b) => (a.isOnline === b.isOnline ? 0 : a.isOnline ? -1 : 1))
                .map((w) => (
                  <WorkerCard key={w.workerId} worker={w} onRemove={onRemoveWorker} />
                ))}
            </div>
          )}
        </div>

        {/* Recent Tasks */}
        <div>
          <h2 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Recent Tasks</h2>
          {tasks.length === 0 ? (
            <div className="bg-[#1e293b] rounded-lg p-8 border border-slate-700/50 text-center text-slate-500">
              No tasks yet
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.slice(0, 10).map((t) => (
                <TaskRow key={t.taskId} task={t} onCancel={onCancelTask} onRetry={onRetryTask} compact />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity Feed */}
      <div>
        <h2 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Activity Feed</h2>
        {activityItems.length === 0 ? (
          <div className="bg-[#1e293b] rounded-lg p-8 border border-slate-700/50 text-center text-slate-500">
            No recent activity
          </div>
        ) : (
          <div className="bg-[#1e293b] rounded-lg border border-slate-700/50 divide-y divide-slate-700/30 max-h-80 overflow-auto">
            {activityItems.map((item, i) => (
              <div key={i} className="px-4 py-2.5 flex items-start gap-3 text-sm">
                <span className={`shrink-0 w-6 text-center font-mono text-xs mt-0.5 ${
                  item.icon === 'ok' ? 'text-green-400' :
                  item.icon === '!!' ? 'text-red-400' :
                  item.icon === '>>' ? 'text-blue-400' :
                  item.icon === '+' ? 'text-amber-400' : 'text-slate-500'
                }`}>
                  {item.icon}
                </span>
                <span className="text-slate-300 flex-1 truncate">{item.message}</span>
                <span className="text-xs text-slate-500 shrink-0" title={item.ts}>
                  {timeAgo(item.ts)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
