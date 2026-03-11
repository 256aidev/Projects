import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getParentDashboard,
  type ParentDashboardData,
} from '../api/dashboard';
import { approveAssignment, rejectAssignment } from '../api/assignments';
import StatsCard from '../components/StatsCard';
import Avatar from '../components/Avatar';
import ProgressBar from '../components/ProgressBar';
import ApprovalCard from '../components/ApprovalCard';
import LeaderboardList from '../components/LeaderboardList';

export default function ParentDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<ParentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    try {
      const dashboard = await getParentDashboard();
      setData(dashboard);
      setError('');
    } catch {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30_000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  async function handleApprove(id: string) {
    await approveAssignment(id);
    await fetchDashboard();
  }

  async function handleReject(id: string, reason: string) {
    await rejectAssignment(id, reason);
    await fetchDashboard();
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl bg-red-50 p-6 text-center text-red-700">
        {error || 'Something went wrong'}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back
        </h1>
        <p className="text-sm text-gray-500">{data.household_name}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatsCard label="Total Today" value={data.stats.total_today} color="indigo" />
        <StatsCard label="Completed" value={data.stats.completed_today} color="green" />
        <StatsCard label="Pending" value={data.stats.pending_today} color="yellow" />
        <StatsCard label="Overdue" value={data.stats.overdue_today} color="red" />
      </div>

      {/* Children summary */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Children</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.children.map((child) => (
            <button
              key={child.child_id}
              onClick={() => navigate(`/dashboard/child/${child.child_id}`)}
              className="flex flex-col gap-3 rounded-2xl bg-white p-5 text-left shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  name={child.display_name}
                  color={child.avatar_color}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-900">
                    {child.display_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {child.weekly_points} pts this week
                  </p>
                </div>
                {child.streak > 0 && (
                  <span className="text-lg" title={`${child.streak} day streak`}>
                    {child.streak} &#x1F525;
                  </span>
                )}
              </div>
              <ProgressBar
                current={child.completed_today}
                total={child.total_today}
                color="bg-green-500"
              />
            </button>
          ))}
          {data.children.length === 0 && (
            <p className="col-span-full py-4 text-center text-sm text-gray-400">
              No children added yet
            </p>
          )}
        </div>
      </section>

      {/* Pending approvals */}
      {data.pending_approvals.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Pending Approvals
            <span className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">
              {data.pending_approvals.length}
            </span>
          </h2>
          <div className="space-y-3">
            {data.pending_approvals.map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        </section>
      )}

      {/* Overdue */}
      {data.overdue.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-red-700">
            Overdue
          </h2>
          <div className="space-y-2">
            {data.overdue.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-red-900">
                    {item.chore_title}
                  </p>
                  <p className="text-sm text-red-600">
                    {item.child_name} &middot; due{' '}
                    {new Date(item.due_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span className="text-sm font-semibold text-red-700">
                  {item.points} pts
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Leaderboard */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Leaderboard
        </h2>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <LeaderboardList entries={data.leaderboard} />
        </div>
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div>
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="mt-2 h-4 w-32 rounded bg-gray-100" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-gray-100" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-gray-100" />
        ))}
      </div>
    </div>
  );
}
