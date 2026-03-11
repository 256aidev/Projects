import { useGameStore } from '../../store/gameStore';
import { getHeatTier } from '../../engine/heat';
import { HEAT_TIER_NAMES, HEAT_TIER_COLORS } from '../../data/types';
import { formatMoney } from '../../engine/economy';

export default function LegalView() {
  const heat = useGameStore((s) => s.heat);
  const totalDirtyEarned = useGameStore((s) => s.totalDirtyEarned);
  const heatNoticeShown = useGameStore((s) => s.heatNoticeShown);
  const heatTier = getHeatTier(heat);
  const tierName = HEAT_TIER_NAMES[heatTier];
  const tierColor = HEAT_TIER_COLORS[heatTier];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="text-center py-2">
        <h2 className="text-white font-bold text-xl">Legal Status</h2>
        <p className="text-gray-400 text-xs mt-1">Manage your exposure and legal protection</p>
      </div>

      {/* Heat */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-white font-semibold">Police Heat</h3>
            <p className="text-xs" style={{ color: tierColor }}>Tier {heatTier}: {tierName}</p>
          </div>
          <span className="text-3xl">🌡️</span>
        </div>

        <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${heat}%`, backgroundColor: tierColor }}
          />
        </div>
        <p className="text-gray-400 text-xs text-right">{Math.floor(heat)} / 100</p>

        {!heatNoticeShown && (
          <p className="text-gray-500 text-xs mt-2 text-center">
            Heat activates after earning {formatMoney(100_000)} dirty cash
          </p>
        )}
        {heatNoticeShown && heatTier === 0 && (
          <p className="text-green-400 text-xs mt-2 text-center">
            You're on the radar but still flying low. Keep laundering.
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
        <h3 className="text-white font-semibold mb-3">Empire Stats</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Total Dirty Earned</span>
            <span className="text-green-400 font-semibold">{formatMoney(totalDirtyEarned)}</span>
          </div>
        </div>
      </div>

      {/* Coming soon */}
      <div className="bg-gray-800/30 border border-dashed border-gray-700 rounded-xl p-6 text-center">
        <p className="text-gray-500 text-sm">⚖️ Lawyers coming soon</p>
        <p className="text-gray-600 text-xs mt-1">Once heat rises, you'll need legal protection</p>
      </div>
    </div>
  );
}
