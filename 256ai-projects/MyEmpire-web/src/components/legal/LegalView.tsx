import { useGameStore } from '../../store/gameStore';
import { getHeatTier, getHeatBreakdown, HEAT_MAX } from '../../engine/heat';
import { HEAT_TIER_NAMES, HEAT_TIER_COLORS } from '../../data/types';
import { LAWYER_DEFS, LAWYER_MAP } from '../../data/lawyers';
import { formatMoney } from '../../engine/economy';

export default function LegalView() {
  const heat = useGameStore((s) => s.heat);
  const dirtyCash = useGameStore((s) => s.dirtyCash);
  const cleanCash = useGameStore((s) => s.cleanCash);
  const totalDirtyEarned = useGameStore((s) => s.totalDirtyEarned);
  const activeLawyerId = useGameStore((s) => s.activeLawyerId);
  const dealerCount = useGameStore((s) => s.operation?.dealerCount ?? 0);
  const dealerTierIndex = useGameStore((s) => s.operation?.dealerTierIndex ?? 0);
  const businesses = useGameStore((s) => s.businesses);
  const hireLawyer = useGameStore((s) => s.hireLawyer);
  const fireLawyer = useGameStore((s) => s.fireLawyer);

  const heatTier = getHeatTier(heat);
  const tierName = HEAT_TIER_NAMES[heatTier];
  const tierColor = HEAT_TIER_COLORS[heatTier];

  const breakdown = getHeatBreakdown(dirtyCash, dealerCount, dealerTierIndex, businesses, activeLawyerId);
  const activeLawyer = activeLawyerId ? LAWYER_MAP[activeLawyerId] : null;

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
            style={{ width: `${(heat / HEAT_MAX) * 100}%`, backgroundColor: tierColor }}
          />
        </div>
        <p className="text-gray-400 text-xs text-right">{Math.floor(heat)} / {HEAT_MAX}</p>

        {heatTier === 0 && heat < 1 && (
          <p className="text-green-400 text-xs mt-2 text-center">
            Flying under the radar. For now.
          </p>
        )}

        {/* Heat breakdown */}
        <div className="mt-3 space-y-1 text-[11px]">
          <p className="text-gray-500 font-semibold uppercase tracking-wide text-[9px]">Heat Sources</p>
          <div className="flex justify-between">
            <span className="text-gray-400">Dirty cash ({formatMoney(dirtyCash)})</span>
            <span className="text-red-400">+{breakdown.dirtyCashHeat.toFixed(4)}/s</span>
          </div>
          {dealerCount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">Dealers ({dealerCount})</span>
              <span className="text-red-400">+{breakdown.dealerHeat.toFixed(4)}/s</span>
            </div>
          )}
          {breakdown.policeMultiplier !== 1 && (
            <div className="flex justify-between">
              <span className="text-gray-400">Police presence</span>
              <span className="text-orange-400">×{breakdown.policeMultiplier.toFixed(2)}</span>
            </div>
          )}

          <p className="text-gray-500 font-semibold uppercase tracking-wide text-[9px] mt-2">Heat Reduction</p>
          <div className="flex justify-between">
            <span className="text-gray-400">Natural decay</span>
            <span className="text-green-400">-{breakdown.naturalDecay.toFixed(3)}/s</span>
          </div>
          {breakdown.lawyerDecay > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">Lawyer ({activeLawyer?.name})</span>
              <span className="text-green-400">-{breakdown.lawyerDecay.toFixed(3)}/s</span>
            </div>
          )}
          {breakdown.businessDecay > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">Front businesses</span>
              <span className="text-green-400">-{breakdown.businessDecay.toFixed(4)}/s</span>
            </div>
          )}

          <div className="border-t border-gray-700 mt-1 pt-1 flex justify-between font-semibold">
            <span className="text-gray-300">Net heat/tick</span>
            <span style={{ color: breakdown.netPerTick > 0 ? '#ef4444' : '#22c55e' }}>
              {breakdown.netPerTick > 0 ? '+' : ''}{breakdown.netPerTick.toFixed(4)}/s
            </span>
          </div>
        </div>
      </div>

      {/* Active Lawyer */}
      {activeLawyer && (
        <div className="bg-indigo-900/30 border border-indigo-500/50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">⚖️ {activeLawyer.name}</h3>
              <p className="text-indigo-300 text-xs">{activeLawyer.description}</p>
              <p className="text-[11px] text-gray-400 mt-1">
                Retainer: <span className="text-yellow-400">{formatMoney(activeLawyer.monthlyRetainer)}/tick</span>
                {' · '}
                Decay bonus: <span className="text-green-400">-{activeLawyer.heatDecayBonus.toFixed(3)}/s</span>
              </p>
            </div>
            <button
              onClick={() => fireLawyer()}
              className="px-3 py-1.5 bg-red-900/50 border border-red-500/50 rounded-lg text-red-300 text-xs font-semibold hover:bg-red-900/80 transition"
            >
              Fire
            </button>
          </div>
        </div>
      )}

      {/* Lawyer Tiers */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
        <h3 className="text-white font-semibold mb-3">⚖️ Legal Representation</h3>
        <p className="text-gray-500 text-xs mb-3">Hire a lawyer to reduce heat. One at a time — hiring replaces your current lawyer.</p>

        <div className="space-y-2">
          {LAWYER_DEFS.map((lawyer) => {
            const isActive = activeLawyerId === lawyer.id;
            const meetsHeatTier = heatTier >= lawyer.requiredHeatTier;
            const canAfford = cleanCash >= lawyer.unlockCost;
            const canHire = !isActive && meetsHeatTier && canAfford;

            return (
              <div
                key={lawyer.id}
                className={`rounded-lg border p-3 transition ${
                  isActive
                    ? 'border-indigo-500/60 bg-indigo-900/20'
                    : !meetsHeatTier
                      ? 'border-gray-700/50 bg-gray-800/20 opacity-40'
                      : 'border-gray-700 bg-gray-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-sm">{lawyer.name}</span>
                      {isActive && <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">ACTIVE</span>}
                    </div>
                    <p className="text-gray-400 text-[11px]">{lawyer.description}</p>
                    <div className="flex gap-3 mt-1 text-[10px]">
                      <span className="text-yellow-400">Retainer: {formatMoney(lawyer.monthlyRetainer)}/tick</span>
                      <span className="text-green-400">Decay: -{lawyer.heatDecayBonus.toFixed(3)}/s</span>
                    </div>
                  </div>

                  <div className="ml-3">
                    {!meetsHeatTier ? (
                      <div className="text-center">
                        <span className="text-gray-500 text-lg">🔒</span>
                        <p className="text-[9px] text-gray-500">Tier {lawyer.requiredHeatTier}</p>
                      </div>
                    ) : isActive ? (
                      <span className="text-indigo-400 text-xs">✓</span>
                    ) : (
                      <button
                        disabled={!canHire}
                        onClick={() => hireLawyer(lawyer.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          canHire
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {formatMoney(lawyer.unlockCost)}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
    </div>
  );
}
