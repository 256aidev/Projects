import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useGameStore } from '../../store/gameStore';
import { useLeaderboardStore } from '../../store/leaderboardStore';
import { formatMoney, formatUnits } from '../../engine/economy';
import { getDifficultyMultiplier } from '../../engine/difficulty';
import { CAR_DEFS } from '../../data/carDefs';
import { getCrewAttack, getCrewDefense } from '../../data/crewDefs';
import { useSyndicateStore } from '../../store/syndicateStore';
import type { SyndicateData } from '../../store/syndicateStore';

// ── Point Scoring System (v2) ────────────────────────────────────────
// Balanced so no single category dominates. Difficulty multiplier up to 3.5×.
// Dirty cash worth 2× clean (harder to earn). Prestige nerfed from 500K→25K.

function calcMoneyPoints(state: ReturnType<typeof useGameStore.getState>): number {
  const dirty = state.totalDirtyEarned ?? 0;
  const clean = state.totalCleanEarned ?? 0;
  return Math.floor(dirty / 500) + Math.floor(clean / 1000); // dirty worth 2x
}

function calcTerritoryPoints(state: ReturnType<typeof useGameStore.getState>): number {
  const businesses = state.businesses ?? [];
  const bizCount = businesses.length;
  const bizLevelTotal = businesses.reduce((sum, b) => sum + (b.upgradeLevel ?? 0), 0);
  const districts = state.unlockedDistricts?.length ?? 0;
  const lots = state.unlockedSlots ? Object.values(state.unlockedSlots).reduce((s, v) => s + (v as number), 0) : 0;
  return bizCount * 2000 + bizLevelTotal * 1500 + districts * 1000 + lots * 500;
}

function calcCriminalPoints(state: ReturnType<typeof useGameStore.getState>): number {
  const rooms = state.operation?.growRooms?.length ?? 0;
  const dealers = state.operation?.dealerCount ?? 0;
  const tierIndex = state.operation?.dealerTierIndex ?? 0;
  return rooms * 3000 + dealers * 500 + tierIndex * 5000;
}

function calcCombatPoints(state: ReturnType<typeof useGameStore.getState>): number {
  const defeated = (state.rivals ?? []).filter(r => r.isDefeated).length;
  const crewCount = (state.crew ?? []).reduce((s, h) => s + h.count, 0);
  return defeated * 10000 + crewCount * 2000;
}

function calcPrestigePoints(state: ReturnType<typeof useGameStore.getState>): number {
  const count = state.prestigeCount ?? 0;
  const tp = state.totalTechPointsEarned ?? 0;
  return count * 25000 + tp * 5000; // nerfed: 25K per prestige, 5K per TP
}

function calcCollectionPoints(state: ReturnType<typeof useGameStore.getState>): number {
  const cars = state.cars?.length ?? 0;
  const jewelry = state.jewelry?.length ?? 0;
  return cars * 5000 + jewelry * 3000;
}

function calcTotalScore(state: ReturnType<typeof useGameStore.getState>): number {
  const base = calcMoneyPoints(state) + calcTerritoryPoints(state) +
    calcCriminalPoints(state) + calcCombatPoints(state) +
    calcPrestigePoints(state) + calcCollectionPoints(state);
  const diff = getDifficultyMultiplier(
    state.gameSettings?.rivalCount ?? 0,
    state.gameSettings?.rivalEntryDelay ?? 0,
  );
  return Math.floor(base * diff);
}

// ── Category Definitions ──────────────────────────────────────────────

type RankCategory = 'overall' | 'money' | 'territory' | 'criminal' | 'combat' | 'prestige' | 'collection' | 'syndicates';

const CATEGORIES: { id: RankCategory; label: string; icon: string }[] = [
  { id: 'overall',    label: 'Overall',    icon: '🏆' },
  { id: 'money',      label: 'Money',      icon: '💰' },
  { id: 'territory',  label: 'Territory',  icon: '🏙️' },
  { id: 'criminal',   label: 'Criminal',   icon: '🌿' },
  { id: 'combat',     label: 'Combat',     icon: '⚔️' },
  { id: 'prestige',   label: 'Prestige',   icon: '⭐' },
  { id: 'collection', label: 'Collection', icon: '💎' },
  { id: 'syndicates', label: 'Syndicates', icon: '🤝' },
];

// ── Sub-components ────────────────────────────────────────────────────

function StatRow({ label, value, pts, color = 'text-white' }: { label: string; value: string; pts: number; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-800/60 last:border-0">
      <span className="text-gray-400 text-xs">{label}</span>
      <div className="flex items-center gap-3">
        <span className={`font-semibold text-sm ${color}`}>{value}</span>
        <span className="text-yellow-500/70 text-[10px] font-mono w-16 text-right">+{pts.toLocaleString()} pts</span>
      </div>
    </div>
  );
}

function formatTime(ticks: number): string {
  const mins = Math.floor(ticks / 60);
  if (mins < 60) return `${mins}m ${ticks % 60}s`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

// ── Main Component ────────────────────────────────────────────────────

export default function LeaderboardView() {
  const [activeTab, setActiveTab] = useState<RankCategory>('overall');
  const user = useAuthStore((s) => s.user);
  const state = useGameStore();
  const { entries, loading, fetchLeaderboard } = useLeaderboardStore();
  const { topSyndicates, fetchTopSyndicates } = useSyndicateStore();
  const isGuest = !user || (user as { uid: string }).uid === 'guest';

  useEffect(() => {
    if (!isGuest) fetchLeaderboard();
  }, [fetchLeaderboard, isGuest]);

  useEffect(() => {
    if (activeTab === 'syndicates') fetchTopSyndicates();
  }, [activeTab, fetchTopSyndicates]);

  const diffMultiplier = getDifficultyMultiplier(
    state.gameSettings?.rivalCount ?? 0,
    state.gameSettings?.rivalEntryDelay ?? 0,
  );
  const totalScore = calcTotalScore(state);
  const moneyPts = calcMoneyPoints(state);
  const territoryPts = calcTerritoryPoints(state);
  const criminalPts = calcCriminalPoints(state);
  const combatPts = calcCombatPoints(state);
  const prestigePts = calcPrestigePoints(state);
  const collectionPts = calcCollectionPoints(state);

  const categoryPoints: Record<RankCategory, number> = {
    overall: totalScore,
    money: moneyPts,
    territory: territoryPts,
    criminal: criminalPts,
    combat: combatPts,
    prestige: prestigePts,
    collection: collectionPts,
    syndicates: 0,
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Hero score (hidden on syndicates tab) */}
      {activeTab !== 'syndicates' && (
        <div className="flex-shrink-0 bg-gradient-to-br from-indigo-900/60 to-purple-900/40 border-b border-indigo-500/30 px-5 py-4 text-center">
          <p className="text-indigo-300 text-[10px] uppercase tracking-widest">Empire Score</p>
          <p className="text-white text-3xl font-black">{totalScore.toLocaleString()}</p>
          <div className="flex items-center justify-center gap-3 mt-1">
            {diffMultiplier > 1 && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${diffMultiplier >= 2 ? 'bg-red-900/50 text-red-400' : diffMultiplier >= 1.5 ? 'bg-orange-900/50 text-orange-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
                ×{diffMultiplier.toFixed(1)} difficulty
              </span>
            )}
            {(state.prestigeCount ?? 0) > 0 && (
              <span className="text-yellow-400 text-[10px]">
                {'⭐'.repeat(Math.min(state.prestigeCount, 5))}{state.prestigeCount > 5 ? ` ×${state.prestigeCount}` : ''}
              </span>
            )}
            <span className="text-gray-500 text-[10px]">{formatTime(state.tickCount)}</span>
          </div>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex-shrink-0 flex bg-gray-900/80 border-b border-gray-800 overflow-x-auto">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`flex-shrink-0 flex flex-col items-center px-3 py-2 gap-0.5 transition text-[10px] font-semibold border-b-2 ${
              activeTab === cat.id
                ? 'text-white border-yellow-500 bg-gray-800/60'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            <span className="text-base">{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Category point total (hidden on syndicates tab) */}
        {activeTab !== 'syndicates' && (
          <div className="bg-gray-800/60 rounded-xl p-3 text-center border border-gray-700/50">
            <p className="text-gray-400 text-[10px] uppercase tracking-widest">{CATEGORIES.find(c => c.id === activeTab)?.label} Points</p>
            <p className="text-yellow-400 text-2xl font-black">{categoryPoints[activeTab].toLocaleString()}</p>
          </div>
        )}

        {/* Stats breakdown per category */}
        {activeTab === 'overall' && (
          <div className="bg-gray-800/40 rounded-xl p-3 space-y-0.5">
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">Score Breakdown</p>
            <StatRow label="💰 Money" value={moneyPts.toLocaleString()} pts={moneyPts} color="text-green-400" />
            <StatRow label="🏙️ Territory" value={territoryPts.toLocaleString()} pts={territoryPts} color="text-blue-400" />
            <StatRow label="🌿 Criminal" value={criminalPts.toLocaleString()} pts={criminalPts} color="text-green-300" />
            <StatRow label="⚔️ Combat" value={combatPts.toLocaleString()} pts={combatPts} color="text-red-400" />
            <StatRow label="⭐ Prestige" value={prestigePts.toLocaleString()} pts={prestigePts} color="text-yellow-400" />
            <StatRow label="💎 Collection" value={collectionPts.toLocaleString()} pts={collectionPts} color="text-purple-400" />
            {diffMultiplier > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                <span className="text-gray-400 text-xs">Difficulty Multiplier</span>
                <span className="text-orange-400 font-bold text-sm">×{diffMultiplier.toFixed(1)}</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'money' && (
          <div className="bg-gray-800/40 rounded-xl p-3 space-y-0.5">
            <StatRow label="Dirty Cash" value={formatMoney(state.dirtyCash)} pts={0} color="text-green-400" />
            <StatRow label="Clean Cash" value={formatMoney(state.cleanCash)} pts={0} color="text-blue-400" />
            <StatRow label="Total Dirty Earned" value={formatMoney(state.totalDirtyEarned)} pts={Math.floor(state.totalDirtyEarned / 1000)} color="text-green-300" />
            <StatRow label="Total Clean Earned" value={formatMoney(state.totalCleanEarned)} pts={Math.floor(state.totalCleanEarned / 1000)} color="text-blue-300" />
            <StatRow label="Net Worth" value={formatMoney(state.dirtyCash + state.cleanCash)} pts={0} color="text-yellow-400" />
            <StatRow label="Total Spent" value={formatMoney(state.totalSpent)} pts={0} color="text-red-400" />
          </div>
        )}

        {activeTab === 'territory' && (
          <div className="bg-gray-800/40 rounded-xl p-3 space-y-0.5">
            <StatRow label="Front Businesses" value={`${state.businesses.length}`} pts={state.businesses.length * 2000} color="text-blue-400" />
            <StatRow label="Business Upgrades" value={`${state.businesses.reduce((s, b) => s + (b.upgradeLevel ?? 0), 0)} total levels`} pts={state.businesses.reduce((s, b) => s + (b.upgradeLevel ?? 0), 0) * 1500} color="text-cyan-400" />
            <StatRow label="Districts Unlocked" value={`${state.unlockedDistricts.length}`} pts={state.unlockedDistricts.length * 1000} color="text-purple-400" />
            <StatRow label="Lots Owned" value={`${state.unlockedSlots ? Object.values(state.unlockedSlots).reduce((s, v) => s + (v as number), 0) : 0}`} pts={(state.unlockedSlots ? Object.values(state.unlockedSlots).reduce((s, v) => s + (v as number), 0) : 0) * 500} color="text-indigo-400" />
          </div>
        )}

        {activeTab === 'criminal' && (
          <div className="bg-gray-800/40 rounded-xl p-3 space-y-0.5">
            <StatRow label="Grow Rooms" value={`${state.operation.growRooms.length}`} pts={state.operation.growRooms.length * 3000} color="text-green-400" />
            <StatRow label="Dealers" value={`${state.operation.dealerCount}`} pts={state.operation.dealerCount * 1000} color="text-indigo-400" />
            <StatRow label="Dealer Tier" value={`Tier ${state.operation.dealerTierIndex + 1}`} pts={state.operation.dealerTierIndex * 5000} color="text-purple-400" />
            <StatRow label="Product Stash" value={formatUnits(Object.values(state.operation.productInventory).reduce((s, e) => s + e.oz, 0))} pts={0} color="text-green-300" />
          </div>
        )}

        {activeTab === 'combat' && (<>
          <div className="bg-gray-800/40 rounded-xl p-3 space-y-0.5">
            <StatRow label="Rivals Defeated" value={`${(state.rivals ?? []).filter(r => r.isDefeated).length} / ${(state.rivals ?? []).length}`} pts={(state.rivals ?? []).filter(r => r.isDefeated).length * 10000} color="text-amber-400" />
            <StatRow label="Crew Members" value={`${(state.crew ?? []).reduce((s, h) => s + h.count, 0)}`} pts={(state.crew ?? []).reduce((s, h) => s + h.count, 0) * 5000} color="text-red-400" />
          </div>

          {/* Power Struggle Chart */}
          {(() => {
            const playerPower = getCrewAttack(state.crew ?? []) + getCrewDefense(state.crew ?? []) + state.businesses.length * 100 + Math.floor(state.dirtyCash / 1000);
            const allFactions = [
              { name: 'You', icon: '👑', power: playerPower, color: '#6366f1' },
              ...(state.rivals ?? []).filter(r => !r.isDefeated).map(r => ({
                name: r.name, icon: r.icon,
                power: r.hitmen * 15 + r.businesses.length * 100 + Math.floor(r.dirtyCash / 1000) + Math.floor(r.power * 50),
                color: r.color,
              })),
            ];
            const maxP = Math.max(1, ...allFactions.map(f => f.power));
            return allFactions.length > 1 ? (
              <div className="bg-gray-800/40 rounded-xl p-3">
                <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">Power Struggle</p>
                <div className="space-y-1.5">
                  {[...allFactions].sort((a, b) => b.power - a.power).map((f, i) => (
                    <div key={f.name} className="flex items-center gap-2">
                      <span className="text-sm w-5 text-center">{i === 0 ? '👑' : f.icon}</span>
                      <span className="text-[10px] font-semibold w-20 truncate text-gray-300">{f.name}</span>
                      <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${(f.power / maxP) * 100}%`, backgroundColor: f.color }} />
                      </div>
                      <span className="text-[9px] text-gray-400 font-mono w-12 text-right">{f.power.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}
        </>)}

        {activeTab === 'prestige' && (
          <div className="bg-gray-800/40 rounded-xl p-3 space-y-0.5">
            <StatRow label="Prestige Resets" value={`${state.prestigeCount ?? 0}`} pts={(state.prestigeCount ?? 0) * 25000} color="text-yellow-400" />
            <StatRow label="Total Tech Points Earned" value={`${state.totalTechPointsEarned ?? 0} TP`} pts={(state.totalTechPointsEarned ?? 0) * 5000} color="text-cyan-400" />
            <StatRow label="Unspent Tech Points" value={`${state.techPoints ?? 0} TP`} pts={0} color="text-cyan-300" />
          </div>
        )}

        {activeTab === 'collection' && (
          <div className="bg-gray-800/40 rounded-xl p-3 space-y-0.5">
            <StatRow label="Cars Owned" value={`${(state.cars ?? []).length} / ${CAR_DEFS.length}`} pts={(state.cars ?? []).length * 5000} color="text-red-400" />
            <StatRow label="Jewelry Owned" value={`${(state.jewelry ?? []).length}`} pts={(state.jewelry ?? []).length * 3000} color="text-purple-400" />
          </div>
        )}

        {/* Syndicate Leaderboard */}
        {activeTab === 'syndicates' && (
          <div>
            <div className="flex-shrink-0 bg-gradient-to-br from-amber-900/40 to-orange-900/30 rounded-xl px-5 py-4 text-center border border-amber-500/20 mb-4">
              <p className="text-amber-300 text-[10px] uppercase tracking-widest">Top Syndicates</p>
              <p className="text-white text-lg font-bold mt-1">Global Power Rankings</p>
            </div>

            {topSyndicates.length === 0 ? (
              <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                <p className="text-gray-400 text-sm">No syndicates yet</p>
                <p className="text-gray-600 text-xs">Create or join a syndicate to appear here!</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {topSyndicates.map((syn, i) => {
                  const rank = i + 1;
                  return (
                    <div
                      key={syn.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-800/60"
                    >
                      {/* Rank */}
                      <span className={`w-7 text-center font-bold text-sm flex-shrink-0 ${
                        rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : rank === 3 ? 'text-amber-600' : 'text-gray-500'
                      }`}>
                        {rank <= 3 ? ['\u{1F947}', '\u{1F948}', '\u{1F949}'][rank - 1] : `#${rank}`}
                      </span>

                      {/* Icon */}
                      <span className="text-xl flex-shrink-0">{syn.icon}</span>

                      {/* Name + tag + level */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate text-white">
                          {syn.name}{' '}
                          <span className="text-gray-400 text-[10px]">[{syn.tag}]</span>
                        </p>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-amber-400">Level {syn.level}</span>
                          <span className="text-gray-600">|</span>
                          <span className="text-gray-400">{syn.memberCount}/20</span>
                          <span className="text-gray-600">|</span>
                          <span className="text-green-400">{syn.warWins}W</span>
                          <span className="text-gray-600">/</span>
                          <span className="text-red-400">{syn.warLosses}L</span>
                        </div>
                      </div>

                      {/* Total Power */}
                      <div className="flex-shrink-0 text-right">
                        <p className="text-green-400 font-bold text-sm">{syn.totalPower.toLocaleString()}</p>
                        <p className="text-gray-500 text-[9px]">power</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Global Leaderboard (player rankings, hidden on syndicates tab) */}
        {activeTab !== 'syndicates' && (
        <div className="border-t border-gray-700 pt-4">
          <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-3 px-1">
            Global Rankings — {CATEGORIES.find(c => c.id === activeTab)?.label}
          </p>

          {isGuest ? (
            <div className="bg-gray-800/50 rounded-xl p-4 text-center">
              <p className="text-gray-400 text-sm mb-1">Sign in to compete globally</p>
              <p className="text-gray-600 text-xs">Your stats are tracked locally. Sign in to appear on the global leaderboard.</p>
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
                      {(entry.difficultyMultiplier ?? 1) > 1 && (
                        <p className="text-[9px] text-gray-500">×{(entry.difficultyMultiplier ?? 1).toFixed(1)} diff</p>
                      )}
                    </div>
                    <span className="text-green-400 font-bold text-sm">{entry.score.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}

      </div>
    </div>
  );
}
