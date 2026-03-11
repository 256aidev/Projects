import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getChildDashboard,
  type ChildDashboardData,
  type ChildChore,
} from '../api/dashboard';
import { completeAssignment } from '../api/assignments';
import Avatar from '../components/Avatar';
import StatusChip from '../components/StatusChip';
import LeaderboardList from '../components/LeaderboardList';

export default function ChildDashboardPage() {
  const { childId } = useParams<{ childId: string }>();
  const { user } = useAuth();
  const resolvedChildId = childId ?? user?.id ?? '';

  const [data, setData] = useState<ChildDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    if (!resolvedChildId) return;
    try {
      const dashboard = await getChildDashboard(resolvedChildId);
      setData(dashboard);
      setError('');
    } catch {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [resolvedChildId]);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30_000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (loading) {
    return <ChildSkeleton />;
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
      <div className="flex items-center gap-4">
        <Avatar name={data.display_name} color={data.avatar_color} size="lg" />
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            {data.display_name}
            {data.streak > 0 && (
              <span className="text-lg" title={`${data.streak} day streak`}>
                {data.streak} &#x1F525;
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500">
            {data.weekly_points} pts this week &middot;{' '}
            {data.lifetime_points} pts lifetime
          </p>
        </div>
      </div>

      {/* Points cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-indigo-50 p-4">
          <p className="text-3xl font-bold text-indigo-700">
            {data.weekly_points}
          </p>
          <p className="mt-1 text-sm font-medium text-indigo-500">
            Weekly Points
          </p>
        </div>
        <div className="rounded-2xl bg-purple-50 p-4">
          <p className="text-3xl font-bold text-purple-700">
            {data.lifetime_points}
          </p>
          <p className="mt-1 text-sm font-medium text-purple-500">
            Lifetime Points
          </p>
        </div>
      </div>

      {/* Today's chores */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Today&apos;s Chores
        </h2>
        {data.todays_chores.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="text-gray-400">No chores for today!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.todays_chores.map((chore) => (
              <ChoreCard
                key={chore.id}
                chore={chore}
                onComplete={async () => {
                  await fetchDashboard();
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Mini leaderboard */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Leaderboard
        </h2>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <LeaderboardList entries={data.leaderboard} compact />
        </div>
      </section>
    </div>
  );
}

function ChoreCard({
  chore,
  onComplete,
}: {
  chore: ChildChore;
  onComplete: () => Promise<void>;
}) {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleMarkDone() {
    if (!showNoteInput) {
      setShowNoteInput(true);
      return;
    }
    setSubmitting(true);
    try {
      await completeAssignment(chore.id, note || undefined);
      await onComplete();
    } finally {
      setSubmitting(false);
      setShowNoteInput(false);
      setNote('');
    }
  }

  const dueTime = chore.due_at
    ? new Date(chore.due_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const isPending = chore.status === 'pending';
  const isApproved = chore.status === 'approved';

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isApproved && (
              <span className="text-green-500" title="Approved">
                &#x2705;
              </span>
            )}
            <p className="truncate font-medium text-gray-900">
              {chore.chore_title}
            </p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <span className="font-semibold text-indigo-600">
              {chore.points} pts
            </span>
            {dueTime && (
              <>
                <span>&middot;</span>
                <span>Due {dueTime}</span>
              </>
            )}
          </div>
        </div>

        <div className="shrink-0">
          {isPending ? (
            <button
              onClick={handleMarkDone}
              disabled={submitting}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Mark Done'}
            </button>
          ) : (
            <StatusChip status={chore.status} />
          )}
        </div>
      </div>

      {/* Note input on Mark Done */}
      {showNoteInput && isPending && (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional)"
            className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleMarkDone();
            }}
          />
          <button
            onClick={handleMarkDone}
            disabled={submitting}
            className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? '...' : 'Submit'}
          </button>
          <button
            onClick={() => {
              setShowNoteInput(false);
              setNote('');
            }}
            className="rounded-xl px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function ChildSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-gray-200" />
        <div>
          <div className="h-7 w-36 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-48 rounded bg-gray-100" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-20 rounded-2xl bg-gray-100" />
        <div className="h-20 rounded-2xl bg-gray-100" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-gray-100" />
        ))}
      </div>
    </div>
  );
}
