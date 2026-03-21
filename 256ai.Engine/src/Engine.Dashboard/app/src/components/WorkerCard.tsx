import type { Worker } from '../types';
import { timeAgo } from '../utils';

interface WorkerCardProps {
  worker: Worker;
  onRemove: (id: string) => void;
}

export default function WorkerCard({ worker, onRemove }: WorkerCardProps) {
  return (
    <div className="bg-[#1e293b] rounded-lg p-4 border border-slate-700/50 flex items-start justify-between gap-3 transition-data">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              worker.isOnline ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm font-medium text-white truncate" title={worker.workerId}>
            {worker.workerId}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
            {worker.role}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
            {worker.provider}
          </span>
        </div>
        <div className="text-xs text-slate-500 space-y-0.5">
          <div>IP: {worker.ipAddress || 'unknown'}</div>
          <div title={worker.lastSeenAt}>Last seen: {timeAgo(worker.lastSeenAt)}</div>
        </div>
      </div>
      {!worker.isOnline && (
        <button
          onClick={() => onRemove(worker.workerId)}
          className="text-xs px-2.5 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-colors shrink-0"
        >
          Remove
        </button>
      )}
    </div>
  );
}
