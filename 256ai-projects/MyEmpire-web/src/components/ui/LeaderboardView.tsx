import { useEffect } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useLeaderboardStore, type LeaderboardMetric } from '../../store/leaderboardStore';
import { formatMoney } from '../../engine/economy';

const TABS: { id: LeaderboardMetric; label: string }[] = [
  { id: 'score', label: 'Empire Score' },
  { id: 'totalEarned', label: 'Total Earned' },
  { id: 'prestigeCount', label: 'Prestige' },
];

function formatScore(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

export default function LeaderboardView() {
  const setShowLeaderboard = useUIStore((s) => s.setShowLeaderboard);
  const user = useAuthStore((s) => s.user);
  const { entries, playerEntry, activeMetric, loading, setMetric, fetchLeaderboard, fetchPlayerEntry } = useLeaderboardStore();

  useEffect(() => {
    fetchLeaderboard();
    if (user && (user as { uid: string }).uid !== 'guest') {
      fetchPlayerEntry(user.uid);
    }
  }, [fetchLeaderboard, fetchPlayerEntry, user]);

  const getDisplayValue = (entry: { score: number; totalDirtyEarned: number; totalCleanEarned: number; prestigeCount: number }) => {
    switch (activeMetric) {
      case 'score': return formatScore(entry.score);
      case 'totalEarned': return formatMoney(entry.totalDirtyEarned + entry.totalCleanEarned);
      case 'prestigeCount': return entry.prestigeCount > 0
        ? '⭐'.repeat(Math.min(entry.prestigeCount, 5)) + (entry.prestigeCount > 5 ? ` ×${entry.prestigeCount}` : '')
        : '—';
    }
  };

  const playerInTop50 = user && entries.some((e) => e.uid === user.uid);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 border-t border-gray-700 rounded-t-2xl p-5 pb-10 space-y-4 overflow-y-auto max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <span className="text-yellow-400">🏆</span> Leaderboard
          </h2>
          <button onClick={() => setShowLeaderboard(false)} className="text-gray-500 hover:text-gray-300 text-2xl leading-none transition">×</button>
        </div>

        {/* Metric tabs */}
        <div className="flex bg-gray-800 rounded-xl p-1 gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMetric(tab.id)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeMetric === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Entries */}
        <div className="space-y-1.5">
          {loading && entries.length === 0 ? (
            <div className="text-center text-gray-500 py-8 text-sm">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="text-center text-gray-500 py-8 text-sm">
              No entries yet. Play the game and your stats will appear here!
            </div>
          ) : (
            entries.map((entry, i) => {
              const isPlayer = user && entry.uid === user.uid;
              const rank = i + 1;
              const medalColors = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];
              return (
                <div
                  key={entry.uid}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                    isPlayer ? 'bg-indigo-900/40 border border-indigo-500/30' : 'bg-gray-800/60'
                  }`}
                >
                  {/* Rank */}
                  <span className={`w-7 text-center font-bold text-sm ${rank <= 3 ? medalColors[rank - 1] : 'text-gray-500'}`}>
                    {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
                  </span>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm truncate ${isPlayer ? 'text-indigo-300' : 'text-white'}`}>
                      {entry.displayName}
                      {isPlayer && <span className="text-indigo-400 text-[10px] ml-1.5">(you)</span>}
                    </p>
                    <p className="text-gray-500 text-[10px]">
                      {entry.businessCount} businesses · {Math.floor(entry.tickCount / 60)}m played
                    </p>
                  </div>

                  {/* Score */}
                  <span className="text-right font-bold text-sm text-green-400 whitespace-nowrap">
                    {getDisplayValue(entry)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Player row if not in top 50 */}
        {!playerInTop50 && playerEntry && (
          <>
            <div className="border-t border-gray-700 pt-3">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">Your Rank</p>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-900/40 border border-indigo-500/30">
                <span className="w-7 text-center font-bold text-sm text-gray-500">—</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-indigo-300 truncate">
                    {playerEntry.displayName}
                    <span className="text-indigo-400 text-[10px] ml-1.5">(you)</span>
                  </p>
                  <p className="text-gray-500 text-[10px]">
                    {playerEntry.businessCount} businesses · {Math.floor(playerEntry.tickCount / 60)}m played
                  </p>
                </div>
                <span className="text-right font-bold text-sm text-green-400 whitespace-nowrap">
                  {getDisplayValue(playerEntry)}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Guest notice */}
        {(!user || (user as { uid: string }).uid === 'guest') && (
          <p className="text-center text-gray-500 text-xs">
            Sign in to appear on the leaderboard
          </p>
        )}
      </div>
    </div>
  );
}
