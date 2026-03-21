import { useState } from 'react';
import type { Project } from '../types';
import { api } from '../api';

interface TaskFormProps {
  projects: Project[];
  onCreated: () => void;
}

const DOMAINS = ['code', 'test', 'deploy', 'devops', 'research', 'general'];

export default function TaskForm({ projects, onCreated }: TaskFormProps) {
  const [open, setOpen] = useState(false);
  const [objective, setObjective] = useState('');
  const [domain, setDomain] = useState('general');
  const [projectId, setProjectId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objective.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await api.createTask({
        objective: objective.trim(),
        domain,
        ...(projectId ? { projectId } : {}),
      });
      setObjective('');
      setProjectId('');
      onCreated();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 rounded-lg border-2 border-dashed border-slate-700 text-slate-400 hover:border-blue-500/50 hover:text-blue-400 transition-colors text-sm font-medium"
      >
        + Submit New Task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#1e293b] rounded-xl p-4 border border-slate-700/50 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">New Task</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300 text-sm">
          Cancel
        </button>
      </div>

      <input
        type="text"
        value={objective}
        onChange={(e) => setObjective(e.target.value)}
        placeholder="Task objective..."
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        autoFocus
      />

      <div className="flex gap-3">
        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
        >
          {DOMAINS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 flex-1"
        >
          <option value="">No project</option>
          {projects.map((p) => (
            <option key={p.projectId} value={p.projectId}>{p.name}</option>
          ))}
        </select>

        <button
          type="submit"
          disabled={submitting || !objective.trim()}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>

      {error && <div className="text-xs text-red-400">{error}</div>}
    </form>
  );
}
