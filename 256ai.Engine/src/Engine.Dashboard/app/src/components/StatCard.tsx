interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  color: 'green' | 'blue' | 'amber' | 'red';
  pulse?: boolean;
}

const colorMap = {
  green: { dot: 'bg-green-500', text: 'text-green-400', bg: 'bg-green-500/10' },
  blue: { dot: 'bg-blue-500', text: 'text-blue-400', bg: 'bg-blue-500/10' },
  amber: { dot: 'bg-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10' },
  red: { dot: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/10' },
};

export default function StatCard({ title, value, subtitle, color, pulse }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className="bg-[#1e293b] rounded-xl p-5 border border-slate-700/50 transition-data">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-400">{title}</span>
        <span className={`w-2.5 h-2.5 rounded-full ${c.dot} ${pulse ? 'animate-pulse-dot' : ''}`} />
      </div>
      <div className={`text-3xl font-bold ${c.text}`}>{value}</div>
      {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
    </div>
  );
}
