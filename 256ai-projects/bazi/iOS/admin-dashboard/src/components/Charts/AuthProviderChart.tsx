import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { AuthProviderData } from '../../types';

interface AuthProviderChartProps {
  data: AuthProviderData[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

interface ChartDataItem {
  provider: string;
  count: number;
  percentage: number;
  [key: string]: string | number;
}

export function AuthProviderChart({ data }: AuthProviderChartProps) {
  // Transform data to include index signature
  const chartData: ChartDataItem[] = data.map((item) => ({
    ...item,
  }));

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h3 className="mb-4 text-lg font-medium text-gray-900">Auth Provider Split</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="count"
              nameKey="provider"
              label={({ name, percent }) =>
                `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
