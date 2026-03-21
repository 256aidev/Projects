import { useState, useMemo } from 'react';
import type { Task, Project, ViewMode } from '../types';
import TaskRow from './TaskRow';
import TaskForm from './TaskForm';
import { statusColor } from '../utils';

interface TasksTabProps {
  tasks: Task[];
  projects: Project[];
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onRefetch: () => void;
}

const STATUSES = ['All', 'PENDING', 'RUNNING', 'COMPLETED', 'FAIL', 'CANCELLED', 'DLQ'];
const KANBAN_COLS = ['PENDING', 'RUNNING', 'COMPLETED', 'FAIL'] as const;

export default function TasksTab({ tasks, projects, onCancel, onRetry, onRefetch }: TasksTabProps) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== 'All' && t.status !== statusFilter) return false;
      if (projectFilter && t.projectId !== projectFilter) return false;
      if (search && !t.objective.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tasks, statusFilter, search, projectFilter]);

  return (
    <div className="space-y-4">
      {/* Submit form */}
      <TaskForm projects={projects} onCreated={onRefetch} />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks..."
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 flex-1 min-w-[200px]"
        />

        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.projectId} value={p.projectId}>{p.name}</option>
          ))}
        </select>

        <div className="flex gap-1 bg-slate-800 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('list')}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
              viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
              viewMode === 'kanban' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Kanban
          </button>
        </div>
      </div>

      {/* Task count */}
      <div className="text-xs text-slate-500">{filtered.length} tasks</div>

      {viewMode === 'list' ? (
        /* List view */
        filtered.length === 0 ? (
          <div className="bg-[#1e293b] rounded-lg p-12 border border-slate-700/50 text-center text-slate-500">
            {tasks.length === 0 ? 'No tasks yet. Submit one above!' : 'No tasks match your filters.'}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((t) => (
              <TaskRow key={t.taskId} task={t} onCancel={onCancel} onRetry={onRetry} />
            ))}
          </div>
        )
      ) : (
        /* Kanban view */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {KANBAN_COLS.map((col) => {
            const colTasks = filtered.filter((t) => {
              if (col === 'FAIL') return t.status === 'FAIL' || t.status === 'FAILED';
              if (col === 'RUNNING') return ['RUNNING', 'LEASED', 'ACKED'].includes(t.status);
              return t.status === col;
            });
            return (
              <div key={col} className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor(col)}`}>
                    {col}
                  </span>
                  <span className="text-xs text-slate-500">{colTasks.length}</span>
                </div>
                <div className="space-y-2 min-h-[100px]">
                  {colTasks.length === 0 ? (
                    <div className="text-xs text-slate-600 text-center py-8">None</div>
                  ) : (
                    colTasks.map((t) => (
                      <div
                        key={t.taskId}
                        className="bg-[#1e293b] rounded-lg p-3 border border-slate-700/50 text-xs"
                      >
                        <div className="text-slate-200 mb-1 line-clamp-2">{t.objective}</div>
                        <div className="flex items-center gap-2 text-slate-500">
                          {t.domain && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{t.domain}</span>
                          )}
                          {t.assignedWorkerId && (
                            <span className="truncate max-w-[80px]">{t.assignedWorkerId.split('-').pop()}</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
