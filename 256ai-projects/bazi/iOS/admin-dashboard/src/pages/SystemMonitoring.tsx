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
} from 'recharts';
import { systemApi } from '../api/client';

interface HealthStatus {
  service: string;
  status: 'healthy' | 'down' | 'recovered' | 'critical' | 'unknown';
  message: string;
  last_check: string;
  response_time_ms?: number;
}

interface RequestLog {
  id: number;
  timestamp: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  user_id?: number;
  error_message?: string;
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    healthy: 'bg-green-100 text-green-800',
    down: 'bg-red-100 text-red-800',
    critical: 'bg-red-100 text-red-800',
    recovered: 'bg-yellow-100 text-yellow-800',
    unknown: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${colorMap[status] || colorMap.unknown}`}>
      {status.toUpperCase()}
    </span>
  );
}

function StatusIndicator({ status }: { status?: 'green' | 'yellow' | 'red' }) {
  const colors = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };
  return (
    <div
      className={`h-3 w-3 rounded-full ${colors[status || 'green']}`}
      title={status?.toUpperCase()}
    />
  );
}

function StatusCard({
  title,
  status,
  message,
  lastCheck,
  responseTime,
  icon,
}: {
  title: string;
  status: string;
  message: string;
  lastCheck: string;
  responseTime?: number;
  icon: React.ReactNode;
}) {
  const borderColor = status === 'healthy' ? 'border-green-500' : status === 'down' || status === 'critical' ? 'border-red-500' : 'border-yellow-500';

  return (
    <div className={`rounded-lg bg-white p-6 shadow border-l-4 ${borderColor}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="text-gray-400">{icon}</div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{message}</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <span>Last check: {lastCheck ? new Date(lastCheck).toLocaleString() : 'Never'}</span>
        {responseTime !== undefined && (
          <span className="font-mono">{responseTime}ms</span>
        )}
      </div>
    </div>
  );
}

export function SystemMonitoring() {
  const [logFilter, setLogFilter] = useState<'all' | 'success' | 'error'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Health status query
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: systemApi.getHealth,
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds
  });

  // Request logs query
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['request-logs', logFilter],
    queryFn: () => systemApi.getRequestLogs({ filter: logFilter, limit: 50 }),
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Response time metrics
  const { data: metricsData } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: systemApi.getMetrics,
    refetchInterval: autoRefresh ? 60000 : false,
  });

  // Launch health metrics
  const { data: launchHealth } = useQuery({
    queryKey: ['launch-health'],
    queryFn: systemApi.getLaunchHealth,
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const ollamaHealth = healthData?.services?.find((s: HealthStatus) => s.service === 'ollama') || {
    service: 'ollama',
    status: 'unknown',
    message: 'No data available',
    last_check: '',
  };

  const apiHealth = healthData?.services?.find((s: HealthStatus) => s.service === 'api') || {
    service: 'api',
    status: 'healthy',
    message: 'API server running',
    last_check: new Date().toISOString(),
  };

  const dbHealth = healthData?.services?.find((s: HealthStatus) => s.service === 'database') || {
    service: 'database',
    status: 'unknown',
    message: 'No data available',
    last_check: '',
  };

  // Calculate success/error counts
  const successCount = logsData?.logs?.filter((l: RequestLog) => l.status_code >= 200 && l.status_code < 400).length || 0;
  const errorCount = logsData?.logs?.filter((l: RequestLog) => l.status_code >= 400).length || 0;

  if (healthLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Loading system status...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">System Monitoring</h2>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300"
            />
            Auto-refresh
          </label>
          <button
            onClick={() => refetchHealth()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Launch Health Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">P95 Latency</p>
            <StatusIndicator status={launchHealth?.latency?.status} />
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {launchHealth?.latency?.p95_ms || 0}ms
          </p>
          <p className="text-xs text-gray-400">
            p50: {launchHealth?.latency?.p50_ms || 0}ms / p99: {launchHealth?.latency?.p99_ms || 0}ms
          </p>
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Error Rate</p>
            <StatusIndicator status={launchHealth?.errors?.status} />
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {launchHealth?.errors?.rate_percent || 0}%
          </p>
          <p className="text-xs text-gray-400">
            {launchHealth?.errors?.count_24h || 0} errors / {launchHealth?.errors?.total_requests_24h || 0} requests (24h)
          </p>
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Rate Limits</p>
            <StatusIndicator status={launchHealth?.rate_limits?.status} />
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {launchHealth?.rate_limits?.count_1h || 0}
          </p>
          <p className="text-xs text-gray-400">429 responses (last hour)</p>
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Scheduler</p>
            <StatusIndicator status={launchHealth?.scheduler?.status} />
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {launchHealth?.scheduler?.readings?.daily?.generated || 0}/
            {launchHealth?.scheduler?.readings?.daily?.total || 0}
          </p>
          <p className="text-xs text-gray-400">daily readings generated</p>
        </div>
      </div>

      {/* Service Health Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <StatusCard
          title="Ollama AI Engine"
          status={ollamaHealth.status}
          message={ollamaHealth.message}
          lastCheck={ollamaHealth.last_check}
          responseTime={ollamaHealth.response_time_ms}
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          }
        />
        <StatusCard
          title="API Server"
          status={apiHealth.status}
          message={apiHealth.message}
          lastCheck={apiHealth.last_check}
          responseTime={apiHealth.response_time_ms}
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
            </svg>
          }
        />
        <StatusCard
          title="Database"
          status={dbHealth.status}
          message={dbHealth.message}
          lastCheck={dbHealth.last_check}
          responseTime={dbHealth.response_time_ms}
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
          }
        />
      </div>

      {/* Request Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm font-medium text-gray-500">Total Requests (24h)</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{metricsData?.total_requests_24h?.toLocaleString() || 0}</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm font-medium text-green-600">Successful</p>
          <p className="mt-2 text-3xl font-bold text-green-600">{metricsData?.successful_requests_24h?.toLocaleString() || successCount}</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm font-medium text-red-600">Failed</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{metricsData?.failed_requests_24h?.toLocaleString() || errorCount}</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm font-medium text-gray-500">Avg Response Time</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{metricsData?.avg_response_time_ms || 0}ms</p>
        </div>
      </div>

      {/* Response Time Chart */}
      {metricsData?.response_times && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">Response Time (Last 24h)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricsData.response_times}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} unit="ms" />
                <Tooltip
                  formatter={(value) => [`${value}ms`, 'Response Time']}
                  labelFormatter={(label) => new Date(label).toLocaleString()}
                />
                <Line
                  type="monotone"
                  dataKey="avg_ms"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Request Logs */}
      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Request Logs</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setLogFilter('all')}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  logFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setLogFilter('success')}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  logFilter === 'success' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                Success
              </button>
              <button
                onClick={() => setLogFilter('error')}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  logFilter === 'error' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                Errors
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Endpoint
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Error
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {logsLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : !logsData?.logs || logsData.logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No logs available
                  </td>
                </tr>
              ) : (
                logsData.logs.map((log: RequestLog) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                        log.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                        log.method === 'POST' ? 'bg-green-100 text-green-800' :
                        log.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                        log.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                      {log.endpoint}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        log.status_code >= 200 && log.status_code < 300 ? 'bg-green-100 text-green-800' :
                        log.status_code >= 300 && log.status_code < 400 ? 'bg-blue-100 text-blue-800' :
                        log.status_code >= 400 && log.status_code < 500 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {log.status_code}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500 font-mono">
                      {log.response_time_ms}ms
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600">
                      {log.error_message || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Health History */}
      {healthData?.history && healthData.history.length > 0 && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">Recent Health Events</h3>
          <div className="space-y-3">
            {healthData.history.map((event, index: number) => (
              <div key={index} className="flex items-center justify-between rounded-md bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <StatusBadge status={event.status} />
                  <div>
                    <p className="font-medium text-gray-900">{event.service}</p>
                    <p className="text-sm text-gray-500">{event.message}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(event.last_check).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
