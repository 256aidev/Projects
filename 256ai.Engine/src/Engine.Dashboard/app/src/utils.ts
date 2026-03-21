export function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'never';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  if (diffMs < 0) return 'just now';
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString();
}

export function duration(start: string | null, end: string | null): string {
  if (!start || !end) return '-';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  if (m < 60) return `${m}m ${rs}s`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}h ${rm}m`;
}

export function statusColor(status: string): string {
  switch (status?.toUpperCase()) {
    case 'PENDING': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'LEASED': return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
    case 'ACKED': return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
    case 'RUNNING': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'COMPLETED': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'FAIL': case 'FAILED': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'CANCELLED': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    case 'DLQ': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

export function tryParseJson(s: string | null): unknown {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return s; }
}
