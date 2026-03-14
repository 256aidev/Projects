import { useEffect } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useGameStore } from '../../store/gameStore';
import { useLeaderboardStore } from '../../store/leaderboardStore';
import { formatMoney } from '../../engine/economy';

function formatTime(ticks: number): string {
  const totalSec = ticks;
  if (totalSec < 60) return `${totalSec}s`;
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins}m`;
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}

function StatCard({ icon, label, value, sub, color = 'text-white' }: StatCardProps) {
  return (
    <div className="bg-gray-800/70 rounded-xl p-3 flex items-center gap-3">
      <span className="text-xl w-8 text-center">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-gray-400 text-[10px] uppercase tracking-wider">{label}</p>
        <p className={`font-bold text-sm ${color}`}>{value}</p>
        {sub && <p className="text-gray-500 text-[10px]">{sub}</p>}
      </div>
    </div>
  );
}

export default function LeaderboardView() {
  const setShowLeaderboard = useUIStore((s) => s.setShowLeaderboard);
  const user = useAuthStore((s) => s.user);

  // Local game stats
  const dirtyCash = useGameStore((s) => s.dirtyCash);
  const cleanCash = useGameStore((s) => s.cleanCash);
  const totalDirtyEarned = useGameStore((s) => s.totalDirtyEarned);
  const totalCleanEarned = useGameStore((s) => s.totalCleanEarned);
  const totalSpent = useGameStore((s) => s.totalSpent);
  const businesses = useGameStore((s) => s.businesses);
  const hitmen = useGameStore((s) => s.hitmen);
  const heat = useGameStore((s) => s.heat);
  const rivalHeat = useGameStore((s) => s.rivalHeat);
  const prestigeCount = useGameStore((s) => s.prestigeCount);
  const prestigeBonus = useGameStore((s) => s.prestigeBonus);
  const tickCount = useGameStore((s) => s.tickCount);
  const unlockedDistricts = useGameStore((s) => s.unlockedDistricts);
  const rivals = useGameStore((s) => s.rivals);
  const operation = useGameStore((s) => s.operation);
  const storageCapacity = useGameStore((s) => s.storageCapacity);

  // Global leaderboard
  const { entries, loading, fetchLeaderboard } = useLeaderboardStore();
  const isGuest = !user || (user as { uid: string }).uid === 'guest';

  useEffect(() => {
    if (!isGuest) fetchLeaderboard();
  }, [fetchLeaderboard, isGuest]);

  // Computed stats
  const totalEarned = totalDirtyEarned + totalCleanEarned;
  const empireScore = totalEarned + prestigeCount * 500_000;
  const netWorth = dirtyCash + cleanCash;
  const totalRooms = operation?.rooms?.length ?? 0;
  const totalDealers = operation?.dealers ?? 0;
  const defeatedRivals = rivals.filter((r) => r.isDefeated).length;
  const totalProduct = Object.values(operation?.productInventory ?? {}).reduce((a, b) => a + b, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 border-t border-gray-700 rounded-t-2xl overflow-y-auto max-h-[92vh]">

        {/* Header */}
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm px-5 pt-5 pb-3 border-b border-gray-800 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <span className="text-yellow-400 text-xl">🏆</span> Empire Stats
            </h2>
            <button onClick={() => setShowLeaderboard(false)} className="text-gray-500 hover:text-gray-300 text-2xl leading-none transition">×</button>
          </div>
        </div>

        <div className="p-5 space-y-4">

          {/* Empire Score — big hero card */}
          <div className="bg-gradient-to-br from-indigo-900/60 to-purple-900/40 border border-indigo-500/30 rounded-2xl p-5 text-center">
            <p className="text-indigo-300 text-xs uppercase tracking-widest mb-1">Empire Score</p>
            <p className="text-white text-3xl font-black">{empireScore.toLocaleString()}</p>
            {prestigeCount > 0 && (
              <p className="text-yellow-400 text-sm mt-1">
                {'⭐'.repeat(Math.min(prestigeCount, 5))}{prestigeCount > 5 ? ` ×${prestigeCount}` : ''}
                <span className="text-indigo-300 text-xs ml-2">+{Math.round(prestigeBonus * 100)}% yield</span>
              </p>
            )}
          </div>

          {/* Money */}
          <div>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2 px-1">Money</p>
            <div className="grid grid-cols-2 gap-2">
              <StatCard icon="💵" label="Dirty Cash" value={formatMoney(dirtyCash)} color="text-green-400" />
              <StatCard icon="🏦" label="Clean Cash" value={formatMoney(cleanCash)} color="text-blue-400" />
              <StatCard icon="💰" label="Total Dirty Earned" value={formatMoney(totalDirtyEarned)} color="text-green-300" sub="lifetime" />
              <StatCard icon="💎" label="Total Clean Earned" value={formatMoney(totalCleanEarned)} color="text-blue-300" sub="lifetime" />
              <StatCard icon="🤑" label="Net Worth" value={formatMoney(netWorth)} color="text-yellow-400" />
              <StatCard icon="🧾" label="Total Spent" value={formatMoney(totalSpent)} color="text-red-400" />
            </div>
          </div>

          {/* Criminal Operation */}
          <div>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2 px-1">Criminal Empire</p>
            <div className="grid grid-cols-2 gap-2">
              <StatCard icon="🌿" label="Grow Rooms" value={`${totalRooms}`} sub={`${totalDealers} dealer${totalDealers !== 1 ? 's' : ''}`} />
              <StatCard icon="📦" label="Product Stash" value={`${Math.floor(totalProduct)} oz`} sub={`/ ${storageCapacity} capacity`} />
              <StatCard icon="🔫" label="Hitmen" value={`${hitmen.length}`} color={hitmen.length > 0 ? 'text-red-400' : 'text-gray-500'} />
              <StatCard icon="⭐" label="Prestige" value={prestigeCount > 0 ? `Level ${prestigeCount}` : 'None'} color={prestigeCount > 0 ? 'text-yellow-400' : 'text-gray-500'} />
            </div>
          </div>

          {/* Territory */}
          <div>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2 px-1">Territory</p>
            <div className="grid grid-cols-2 gap-2">
              <StatCard icon="🏙️" label="Businesses" value={`${businesses.length}`} sub={`${unlockedDistricts.length} districts`} />
              <StatCard
                icon="👊"
                label="Rivals Defeated"
                value={`${defeatedRivals} / ${rivals.length}`}
                color={defeatedRivals > 0 ? 'text-amber-400' : 'text-gray-500'}
              />
            </div>
          </div>

          {/* Danger */}
          <div>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2 px-1">Heat & Danger</p>
            <div className="grid grid-cols-2 gap-2">
              <StatCard
                icon="🔥"
                label="Police Heat"
                value={`${Math.floor(heat)} / 1000`}
                color={heat > 500 ? 'text-red-400' : heat > 200 ? 'text-yellow-400' : 'text-green-400'}
              />
              <StatCard
                icon="⚔️"
                label="Rival Heat"
                value={`${Math.floor(rivalHeat)} / 1000`}
                color={rivalHeat > 500 ? 'text-red-400' : rivalHeat > 200 ? 'text-orange-400' : 'text-green-400'}
              />
            </div>
          </div>

          {/* Time */}
          <div className="bg-gray-800/50 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">⏱️</span>
              <div>
                <p className="text-gray-400 text-[10px] uppercase tracking-wider">Time Played</p>
                <p className="text-white font-bold text-sm">{formatTime(tickCount)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-[10px] uppercase tracking-wider">Ticks</p>
              <p className="text-gray-300 font-mono text-sm">{tickCount.toLocaleString()}</p>
            </div>
          </div>

          {/* Global Leaderboard */}
          <div className="border-t border-gray-700 pt-4">
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-3 px-1">Global Rankings</p>

            {isGuest ? (
              <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                <p className="text-gray-400 text-sm mb-1">Sign in to compete globally</p>
                <p className="text-gray-600 text-xs">Your stats are tracked locally. Sign in with Google or Apple to appear on the global leaderboard.</p>
              </div>
            ) : loading && entries.length === 0 ? (
              <div className="text-center text-gray-500 py-4 text-sm">Loading rankings...</div>
            ) : entries.length === 0 ? (
              <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                <p className="text-gray-400 text-sm">No global entries yet</p>
                <p className="text-gray-600 text-xs">Keep playing — your stats sync automatically!</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {entries.slice(0, 10).map((entry, i) => {
                  const isPlayer = user && entry.uid === user.uid;
                  const rank = i + 1;
                  return (
                    <div
                      key={entry.uid}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl ${
                        isPlayer ? 'bg-indigo-900/40 border border-indigo-500/30' : 'bg-gray-800/60'
                      }`}
                    >
                      <span className={`w-7 text-center font-bold text-sm ${
                        rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : rank === 3 ? 'text-amber-600' : 'text-gray-500'
                      }`}>
                        {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm truncate ${isPlayer ? 'text-indigo-300' : 'text-white'}`}>
                          {entry.displayName}
                          {isPlayer && <span className="text-indigo-400 text-[10px] ml-1">(you)</span>}
                        </p>
                      </div>
                      <span className="text-green-400 font-bold text-sm">{entry.score.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
