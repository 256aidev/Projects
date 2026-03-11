interface StatsCardProps {
  label: string;
  value: number;
  color?: 'indigo' | 'green' | 'yellow' | 'red';
}

const colorMap = {
  indigo: 'bg-indigo-50 text-indigo-700',
  green: 'bg-green-50 text-green-700',
  yellow: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
};

export default function StatsCard({ label, value, color = 'indigo' }: StatsCardProps) {
  return (
    <div className={`rounded-2xl p-4 ${colorMap[color]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm font-medium opacity-75">{label}</p>
    </div>
  );
}
