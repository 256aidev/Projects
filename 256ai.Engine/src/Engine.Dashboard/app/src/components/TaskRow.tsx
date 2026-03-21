import { useState, useEffect } from 'react';
import type { Task, TaskProgress } from '../types';
import { timeAgo, formatTime, duration, statusColor, tryParseJson } from '../utils';
import { api } from '../api';

interface TaskRowProps {
  task: Task;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  compact?: boolean;
}

export default function TaskRow({ task, onCancel, onRetry, compact }: TaskRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [progress, setProgress] = useState<TaskProgress[]>([]);

  useEffect(() => {
    if (!expanded) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const p = await api.getTaskProgress(task.taskId);
        if (!cancelled) setProgress(p);
      } catch { /* ignore */ }
    };
    poll();
    const isRunning = task.status === 'RUNNING';
    const id = isRunning ? setInterval(poll, 2000) : undefined;
    return () => { cancelled = true; if (id) clearInterval(id); };
  }, [expanded, task.taskId, task.status]);

  const canCancel = ['PENDING', 'RUNNING', 'LEASED', 'ACKED'].includes(task.status);
  const canRetry = ['FAIL', 'FAILED', 'DLQ'].includes(task.status);
  const isRunning = task.status === 'RUNNING';
  const result = tryParseJson(task.resultJson) as string | Record<string, unknown> | null;
  const output = tryParseJson(task.outputJson) as string | Record<string, unknown> | null;

  return (
    <div
      className="bg-[#1e293b] rounded-lg border border-slate-700/50 transition-data overflow-hidden cursor-pointer hover:border-slate-600/50"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-3 sm:p-4 flex items-center gap-3">
        {/* Status badge */}
        <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${statusColor(task.status)} ${isRunning ? 'animate-pulse-dot' : ''}`}>
          {task.status}
        </span>

        {/* Objective */}
        <span className={`text-sm text-slate-200 ${compact ? 'truncate' : ''} flex-1 min-w-0`}>
          {task.objective}
        </span>

        {/* Meta */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {task.domain && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400">
              {task.domain}
            </span>
          )}
          {task.assignedWorkerId && (
            <span className="text-xs text-slate-500 truncate max-w-[120px]" title={task.assignedWorkerId}>
              {task.assignedWorkerId.split('-').pop()}
            </span>
          )}
          <span className="text-xs text-slate-500" title={formatTime(task.createdAt)}>
            {timeAgo(task.createdAt)}
          </span>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-700/50 p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
          {/* Timeline */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div><span className="text-slate-500">Created:</span><br />{formatTime(task.createdAt)}</div>
            <div><span className="text-slate-500">Leased:</span><br />{formatTime(task.leasedAt)}</div>
            <div><span className="text-slate-500">Started:</span><br />{formatTime(task.startedAt)}</div>
            <div><span className="text-slate-500">Completed:</span><br />{formatTime(task.completedAt)}</div>
          </div>

          {task.completedAt && task.createdAt && (
            <div className="text-xs text-slate-400">
              Duration: {duration(task.createdAt, task.completedAt)}
            </div>
          )}

          {task.assignedWorkerId && (
            <div className="text-xs text-slate-400">Worker: {task.assignedWorkerId}</div>
          )}
          {task.projectId && (
            <div className="text-xs text-slate-400">Project: {task.projectId}</div>
          )}

          {task.errorMessage && (
            <div className="text-xs text-red-400 bg-red-500/10 rounded p-2 border border-red-500/20">
              {task.errorMessage}
            </div>
          )}

          {result && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Result:</div>
              <pre className="text-xs text-slate-300 bg-slate-900 rounded p-2 overflow-auto max-h-48">
                {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          {output && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Output:</div>
              <pre className="text-xs text-slate-300 bg-slate-900 rounded p-2 overflow-auto max-h-48">
                {typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
              </pre>
            </div>
          )}

          {/* Progress updates */}
          {progress.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Progress:</div>
              <div className="space-y-1 max-h-32 overflow-auto">
                {progress.map((p) => (
                  <div key={p.progressId} className="text-xs text-slate-400 flex items-start gap-2">
                    <span className="text-slate-600 shrink-0">{timeAgo(p.createdAt)}</span>
                    <span>{p.message}</span>
                    {p.percentage != null && (
                      <span className="text-blue-400 shrink-0">{p.percentage}%</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            {canCancel && (
              <button
                onClick={() => onCancel(task.taskId)}
                className="text-xs px-3 py-1.5 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 transition-colors"
              >
                Cancel
              </button>
            )}
            {canRetry && (
              <button
                onClick={() => onRetry(task.taskId)}
                className="text-xs px-3 py-1.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
