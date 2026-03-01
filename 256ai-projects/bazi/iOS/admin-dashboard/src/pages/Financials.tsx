import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { financialApi } from '../api/client';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function StatsCard({
  title,
  value,
  subtitle,
  trend,
  color = 'blue',
}: {
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <p className={`text-sm font-medium ${colorClasses[color].split(' ')[1]}`}>{title}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      {trend && (
        <p className={`mt-2 text-sm ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
          {trend}
        </p>
      )}
    </div>
  );
}

export function Financials() {
  const [timeRange, setTimeRange] = useState<number>(30);
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionFilter, setTransactionFilter] = useState<{
    type?: string;
    source?: string;
  }>({});

  // Queries
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['financial-overview'],
    queryFn: financialApi.getOverview,
  });

  const { data: revenueOverTime } = useQuery({
    queryKey: ['revenue-over-time', timeRange],
    queryFn: () => financialApi.getRevenueOverTime(timeRange),
  });

  const { data: monthlyRevenue } = useQuery({
    queryKey: ['monthly-revenue'],
    queryFn: () => financialApi.getMonthlyRevenue(12),
  });

  const { data: revenueBySource } = useQuery({
    queryKey: ['revenue-by-source'],
    queryFn: financialApi.getRevenueBySource,
  });

  const { data: revenueByPlan } = useQuery({
    queryKey: ['revenue-by-plan'],
    queryFn: financialApi.getRevenueByPlan,
  });

  const { data: revenueByType } = useQuery({
    queryKey: ['revenue-by-type'],
    queryFn: financialApi.getRevenueByType,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', transactionPage, transactionFilter],
    queryFn: () =>
      financialApi.getTransactions({
        page: transactionPage,
        per_page: 15,
        transaction_type: transactionFilter.type,
        source: transactionFilter.source,
      }),
  });

  if (overviewLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Loading financial data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Financials</h2>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(overview?.total_revenue || 0)}
          subtitle="All time"
          color="green"
        />
        <StatsCard
          title="This Month"
          value={formatCurrency(overview?.revenue_month || 0)}
          subtitle={`${overview?.transactions_today || 0} transactions today`}
          color="blue"
        />
        <StatsCard
          title="This Week"
          value={formatCurrency(overview?.revenue_week || 0)}
          color="purple"
        />
        <StatsCard
          title="Today"
          value={formatCurrency(overview?.revenue_today || 0)}
          color="yellow"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          title="Total Transactions"
          value={overview?.total_transactions?.toLocaleString() || '0'}
          color="blue"
        />
        <StatsCard
          title="This Year"
          value={formatCurrency(overview?.revenue_year || 0)}
          color="green"
        />
        <StatsCard
          title="Total Refunds"
          value={formatCurrency(overview?.total_refunds || 0)}
          color="red"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Over Time Chart */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Revenue Over Time</h3>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueOverTime?.data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Revenue Bar Chart */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">Monthly Revenue</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue?.data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month_name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                <Bar dataKey="revenue" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Breakdown Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue by Source */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">Revenue by Source</h3>
          {revenueBySource?.breakdown && revenueBySource.breakdown.length > 0 ? (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueBySource.breakdown.map(item => ({ name: item.source, value: item.total }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {revenueBySource.breakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {revenueBySource.breakdown.map((item, index) => (
                  <div key={item.source} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="capitalize">{item.source}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-48 items-center justify-center text-gray-500">
              No revenue data yet
            </div>
          )}
        </div>

        {/* Revenue by Plan */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">Revenue by Plan</h3>
          {revenueByPlan?.breakdown && revenueByPlan.breakdown.length > 0 ? (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueByPlan.breakdown.map(item => ({ name: item.plan, value: item.total }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {revenueByPlan.breakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {revenueByPlan.breakdown.map((item, index) => (
                  <div key={item.plan} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span>{item.plan}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-48 items-center justify-center text-gray-500">
              No plan data yet
            </div>
          )}
        </div>

        {/* Revenue by Type */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">Transaction Types</h3>
          {revenueByType?.breakdown && revenueByType.breakdown.length > 0 ? (
            <div className="space-y-4">
              {revenueByType.breakdown.map((item, index) => (
                <div key={item.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm capitalize">{item.type?.replace('_', ' ')}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(item.total)}</p>
                    <p className="text-xs text-gray-500">{item.count} transactions</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center text-gray-500">
              No transaction data yet
            </div>
          )}
        </div>
      </div>

      {/* Transaction Log */}
      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Transaction Log</h3>
            <div className="flex gap-2">
              <select
                value={transactionFilter.type || ''}
                onChange={(e) =>
                  setTransactionFilter((prev) => ({
                    ...prev,
                    type: e.target.value || undefined,
                  }))
                }
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              >
                <option value="">All Types</option>
                <option value="purchase">Purchase</option>
                <option value="admin_grant">Admin Grant</option>
                <option value="refund">Refund</option>
              </select>
              <select
                value={transactionFilter.source || ''}
                onChange={(e) =>
                  setTransactionFilter((prev) => ({
                    ...prev,
                    source: e.target.value || undefined,
                  }))
                }
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              >
                <option value="">All Sources</option>
                <option value="admin_grant">Admin</option>
                <option value="revenucat">RevenueCat</option>
                <option value="stripe">Stripe</option>
                <option value="apple">Apple</option>
                <option value="google">Google</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Plan
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {transactionsLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : transactions?.transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions?.transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {tx.created_at ? new Date(tx.created_at).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{tx.user_name || '-'}</div>
                      <div className="text-sm text-gray-500">{tx.user_email || '-'}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          tx.transaction_type === 'refund'
                            ? 'bg-red-100 text-red-800'
                            : tx.transaction_type === 'admin_grant'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {tx.transaction_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 capitalize">
                      {tx.source.replace('_', ' ')}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {tx.plan_name || '-'}
                    </td>
                    <td
                      className={`whitespace-nowrap px-6 py-4 text-right text-sm font-medium ${
                        tx.amount < 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {tx.amount < 0 ? '-' : ''}
                      {formatCurrency(Math.abs(tx.amount))}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          tx.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : tx.status === 'refunded'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {transactions && transactions.total_pages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
            <p className="text-sm text-gray-500">
              Page {transactions.page} of {transactions.total_pages} ({transactions.total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setTransactionPage((p) => Math.max(1, p - 1))}
                disabled={transactionPage === 1}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setTransactionPage((p) => Math.min(transactions.total_pages, p + 1))}
                disabled={transactionPage === transactions.total_pages}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
