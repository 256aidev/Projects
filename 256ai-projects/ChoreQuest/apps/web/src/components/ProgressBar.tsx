interface ProgressBarProps {
  current: number;
  total: number;
  color?: string;
}

export default function ProgressBar({
  current,
  total,
  color = 'bg-indigo-500',
}: ProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-500">
        {current}/{total}
      </span>
    </div>
  );
}
