import { useQuery } from '@tanstack/react-query';
import { statsApi } from '../api/client';
import { StatsCard, UserGrowthChart, AuthProviderChart } from '../components/Charts';

export function Dashboard() {
  const { data: overview, isLoading: isLoadingOverview } = useQuery({
    queryKey: ['stats', 'overview'],
    queryFn: statsApi.getOverview,
  });

  const { data: userGrowth, isLoading: isLoadingGrowth } = useQuery({
    queryKey: ['stats', 'users', 30],
    queryFn: () => statsApi.getUserGrowth(30),
  });

  const { data: retention, isLoading: isLoadingRetention } = useQuery({
    queryKey: ['stats', 'retention'],
    queryFn: statsApi.getRetention,
  });

  const { data: recentSignups, isLoading: isLoadingRecent } = useQuery({
    queryKey: ['stats', 'recent-signups'],
    queryFn: () => statsApi.getRecentSignups(5),
  });

  const isLoading =
    isLoadingOverview || isLoadingGrowth || isLoadingRetention || isLoadingRecent;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={overview?.total_users.toLocaleString() ?? 0}
          subtitle={`${overview?.users_this_month ?? 0} this month`}
        />
        <StatsCard
          title="Users Today"
          value={overview?.users_today ?? 0}
          subtitle={`${overview?.users_this_week ?? 0} this week`}
        />
        <StatsCard
          title="Active Users (7d)"
          value={overview?.active_users_7d ?? 0}
          subtitle={`${retention?.dau ?? 0} DAU / ${retention?.mau ?? 0} MAU`}
        />
        <StatsCard
          title="Retention Rate"
          value={`${retention?.dau_mau_ratio ?? 0}%`}
          subtitle="DAU/MAU ratio"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {userGrowth?.user_growth && (
          <UserGrowthChart data={userGrowth.user_growth} />
        )}
        {userGrowth?.auth_providers && (
          <AuthProviderChart data={userGrowth.auth_providers} />
        )}
      </div>

      {/* Recent Signups & More Stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Signups */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">
            Recent Signups
          </h3>
          <div className="space-y-3">
            {recentSignups?.recent_signups?.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-md bg-gray-50 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">
                    {user.email || user.auth_provider}
                  </p>
                </div>
                <span className="text-xs text-gray-400">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleString()
                    : '-'}
                </span>
              </div>
            ))}
            {(!recentSignups?.recent_signups ||
              recentSignups.recent_signups.length === 0) && (
              <p className="text-sm text-gray-500">No recent signups</p>
            )}
          </div>
        </div>

        {/* Day Master Distribution */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">
            Day Master Distribution
          </h3>
          <div className="space-y-3">
            {userGrowth?.day_master_distribution?.map((item) => (
              <div key={item.element} className="flex items-center gap-4">
                <span className="w-16 text-sm font-medium text-gray-700">
                  {item.element}
                </span>
                <div className="flex-1">
                  <div className="h-4 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-4 rounded-full bg-blue-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
                <span className="w-16 text-right text-sm text-gray-500">
                  {item.count} ({item.percentage}%)
                </span>
              </div>
            ))}
            {(!userGrowth?.day_master_distribution ||
              userGrowth.day_master_distribution.length === 0) && (
              <p className="text-sm text-gray-500">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Readings Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Daily Readings"
          value={overview?.total_daily_readings.toLocaleString() ?? 0}
          subtitle={`${overview?.readings_today ?? 0} today`}
        />
        <StatsCard
          title="Total Weekly Readings"
          value={overview?.total_weekly_readings.toLocaleString() ?? 0}
        />
        <StatsCard
          title="WAU"
          value={retention?.wau ?? 0}
          subtitle="Weekly Active Users"
        />
        <StatsCard
          title="MAU"
          value={retention?.mau ?? 0}
          subtitle="Monthly Active Users"
        />
      </div>
    </div>
  );
}
