import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../engine/economy';
import { getDifficultyMultiplier } from '../../engine/difficulty';

export default function VictoryScreen({ onContinue }: { onContinue: () => void }) {
  const totalDirtyEarned = useGameStore((s) => s.totalDirtyEarned);
  const totalCleanEarned = useGameStore((s) => s.totalCleanEarned);
  const tickCount = useGameStore((s) => s.tickCount);
  const prestigeCount = useGameStore((s) => s.prestigeCount ?? 0);
  const businesses = useGameStore((s) => s.businesses);
  const gameSettings = useGameStore((s) => s.gameSettings);

  const diffMultiplier = getDifficultyMultiplier(gameSettings.rivalCount, gameSettings.rivalEntryDelay);
  const totalEarned = totalDirtyEarned + totalCleanEarned;
  const mins = Math.floor(tickCount / 60);
  const hrs = Math.floor(mins / 60);
  const timePlayed = hrs > 0 ? `${hrs}h ${mins % 60}m` : `${mins}m`;

  return (
    <div className="fixed inset-0 z-[90] bg-black/90 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gradient-to-br from-yellow-900/80 to-amber-950/80 border-2 border-yellow-500/50 rounded-3xl p-8 text-center space-y-6">
        {/* Crown */}
        <div className="text-6xl">👑</div>

        <div>
          <h1 className="text-3xl font-black text-yellow-400">VICTORY</h1>
          <p className="text-yellow-200/70 text-sm mt-1">All rival syndicates have been eliminated.</p>
          <p className="text-yellow-300/50 text-xs mt-0.5">The city is yours, Kingpin.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="bg-black/30 rounded-xl p-3">
            <p className="text-yellow-500/60 text-[10px] uppercase">Total Earned</p>
            <p className="text-white font-bold text-sm">{formatMoney(totalEarned)}</p>
          </div>
          <div className="bg-black/30 rounded-xl p-3">
            <p className="text-yellow-500/60 text-[10px] uppercase">Time Played</p>
            <p className="text-white font-bold text-sm">{timePlayed}</p>
          </div>
          <div className="bg-black/30 rounded-xl p-3">
            <p className="text-yellow-500/60 text-[10px] uppercase">Businesses</p>
            <p className="text-white font-bold text-sm">{businesses.length}</p>
          </div>
          <div className="bg-black/30 rounded-xl p-3">
            <p className="text-yellow-500/60 text-[10px] uppercase">Prestige</p>
            <p className="text-white font-bold text-sm">{prestigeCount > 0 ? `Level ${prestigeCount}` : 'None'}</p>
          </div>
          <div className="bg-black/30 rounded-xl p-3">
            <p className="text-yellow-500/60 text-[10px] uppercase">Rivals Defeated</p>
            <p className="text-white font-bold text-sm">{gameSettings.rivalCount}</p>
          </div>
          <div className="bg-black/30 rounded-xl p-3">
            <p className="text-yellow-500/60 text-[10px] uppercase">Difficulty</p>
            <p className="text-white font-bold text-sm">×{diffMultiplier.toFixed(1)}</p>
          </div>
        </div>

        {/* Victory bonus note */}
        <p className="text-yellow-400/60 text-xs">
          +50% victory bonus applied to your leaderboard score!
        </p>

        {/* Continue button */}
        <button
          onClick={onContinue}
          className="w-full py-3.5 rounded-xl text-lg font-black bg-yellow-600 hover:bg-yellow-500 text-black transition shadow-lg shadow-yellow-900/50"
        >
          Continue Playing
        </button>
        <p className="text-yellow-500/40 text-[10px]">
          You can keep building your empire in sandbox mode.
        </p>
      </div>
    </div>
  );
}
