import { useGameStore } from '../../store/gameStore';
import { getHeatTier, getHeatBreakdown, getRivalHeatTier, getRivalHeatBreakdown, HEAT_MAX } from '../../engine/heat';
import { HEAT_TIER_NAMES, HEAT_TIER_COLORS, RIVAL_TIER_NAMES, RIVAL_TIER_COLORS } from '../../data/types';
import { LAWYER_DEFS, LAWYER_MAP } from '../../data/lawyers';
import { formatMoney } from '../../engine/economy';
import { sound } from '../../engine/sound';
import Tooltip from '../ui/Tooltip';

export default function LegalView() {
  const heat = useGameStore((s) => s.heat);
  const dirtyCash = useGameStore((s) => s.dirtyCash);
  const cleanCash = useGameStore((s) => s.cleanCash);
  const activeLawyerId = useGameStore((s) => s.activeLawyerId);
  const hiredLawyers = useGameStore((s) => s.hiredLawyers ?? []);
  const dealerCount = useGameStore((s) => s.operation?.dealerCount ?? 0);
  const dealerTierIndex = useGameStore((s) => s.operation?.dealerTierIndex ?? 0);
  const businesses = useGameStore((s) => s.businesses);
  const hireLawyer = useGameStore((s) => s.hireLawyer);
  const fireLawyer = useGameStore((s) => s.fireLawyer);
  const rivalHeat = useGameStore((s) => s.rivalHeat ?? 0);

  const heatTier = getHeatTier(heat);
  const tierName = HEAT_TIER_NAMES[heatTier];
  const tierColor = HEAT_TIER_COLORS[heatTier];
  const rivalTier = getRivalHeatTier(rivalHeat);
  const rivalTierName = RIVAL_TIER_NAMES[rivalTier];
  const rivalTierColor = RIVAL_TIER_COLORS[rivalTier];
  // Calculate total lawyer decay from hiredLawyers (multi-lawyer system)
  const totalLawyerDecay = hiredLawyers.reduce((s, h) => {
    const d = LAWYER_MAP[h.defId];
    return s + (d ? d.heatDecayBonus * h.count : 0);
  }, 0);
  const breakdown = getHeatBreakdown(dirtyCash, dealerCount, dealerTierIndex, businesses, activeLawyerId, 0, totalLawyerDecay);
  const rivalBreakdown = getRivalHeatBreakdown(dealerCount, dealerTierIndex, businesses);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Police Heat */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-white font-semibold">Police Heat</h3>
            <p className="text-xs" style={{ color: tierColor }}>Tier {heatTier}: {tierName}</p>
          </div>
          <span className="text-3xl">🌡️</span>
        </div>
        <Tooltip text="Police heat rises from holding dirty cash and employing dealers. High heat triggers raids.">
        <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden mb-2">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(heat / HEAT_MAX) * 100}%`, backgroundColor: tierColor }} />
        </div>
        <p className="text-gray-400 text-xs text-right">{Math.floor(heat)} / {HEAT_MAX}</p>
        </Tooltip>
        {heatTier === 0 && heat < 1 && <p className="text-green-400 text-xs mt-2 text-center">Flying under the radar. For now.</p>}
        <div className="mt-3 space-y-1 text-[11px]">
          <p className="text-gray-500 font-semibold uppercase tracking-wide text-[9px]">Heat Sources</p>
          <div className="flex justify-between"><span className="text-gray-400">Dirty cash ({formatMoney(dirtyCash)})</span><span className="text-red-400">+{breakdown.dirtyCashHeat.toFixed(4)}/s</span></div>
          {dealerCount > 0 && <div className="flex justify-between"><span className="text-gray-400">Dealers ({dealerCount})</span><span className="text-red-400">+{breakdown.dealerHeat.toFixed(4)}/s</span></div>}
          {breakdown.policeMultiplier !== 1 && <div className="flex justify-between"><span className="text-gray-400">Police presence multiplier</span><span className="text-orange-400">×{breakdown.policeMultiplier.toFixed(2)}</span></div>}
          <p className="text-gray-500 font-semibold uppercase tracking-wide text-[9px] mt-2">Heat Reduction</p>
          <div className="flex justify-between"><span className="text-gray-400">Natural decay</span><span className="text-green-400">-{breakdown.naturalDecay.toFixed(3)}/s</span></div>
          {breakdown.lawyerDecay > 0 && <div className="flex justify-between"><span className="text-gray-400">Lawyers ({hiredLawyers.reduce((s, h) => s + h.count, 0)} retained)</span><span className="text-green-400">-{breakdown.lawyerDecay.toFixed(3)}/s</span></div>}
          {breakdown.businessDecay > 0 && <div className="flex justify-between"><span className="text-gray-400">Front businesses</span><span className="text-green-400">-{breakdown.businessDecay.toFixed(4)}/s</span></div>}
          <div className="border-t border-gray-700 mt-1 pt-1 flex justify-between font-semibold">
            <span className="text-gray-300">Net heat/tick</span>
            <span style={{ color: breakdown.netPerTick > 0 ? '#ef4444' : '#22c55e' }}>{breakdown.netPerTick > 0 ? '+' : ''}{breakdown.netPerTick.toFixed(4)}/s</span>
          </div>
        </div>
      </div>

      {/* Rival Heat */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-white font-semibold">Rival Heat</h3>
            <p className="text-xs" style={{ color: rivalTierColor }}>Tier {rivalTier}: {rivalTierName}</p>
          </div>
          <span className="text-3xl">🔫</span>
        </div>
        <Tooltip text="Rival heat rises as your operation expands. High rival heat triggers attacks on your stash and businesses.">
        <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden mb-2">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(rivalHeat / HEAT_MAX) * 100}%`, backgroundColor: rivalTierColor }} />
        </div>
        <p className="text-gray-400 text-xs text-right">{Math.floor(rivalHeat)} / {HEAT_MAX}</p>
        </Tooltip>
        {rivalTier === 0 && rivalHeat < 1 && <p className="text-green-400 text-xs mt-2 text-center">No rival gangs have noticed you yet.</p>}
        <div className="mt-3 space-y-1 text-[11px]">
          <p className="text-gray-500 font-semibold uppercase tracking-wide text-[9px]">Rivalry Sources</p>
          {dealerCount > 0 && <div className="flex justify-between"><span className="text-gray-400">Dealer presence ({dealerCount})</span><span className="text-red-400">+{rivalBreakdown.dealerHeat.toFixed(4)}/s</span></div>}
          {rivalBreakdown.territoryHeat > 0 && <div className="flex justify-between"><span className="text-gray-400">Territory expansion</span><span className="text-red-400">+{rivalBreakdown.territoryHeat.toFixed(4)}/s</span></div>}
          <p className="text-gray-500 font-semibold uppercase tracking-wide text-[9px] mt-2">Reduction</p>
          <div className="flex justify-between"><span className="text-gray-400">Natural cooldown</span><span className="text-green-400">-{rivalBreakdown.naturalDecay.toFixed(3)}/s</span></div>
          <div className="border-t border-gray-700 mt-1 pt-1 flex justify-between font-semibold">
            <span className="text-gray-300">Net rival heat/tick</span>
            <span style={{ color: rivalBreakdown.netPerTick > 0 ? '#ef4444' : '#22c55e' }}>{rivalBreakdown.netPerTick > 0 ? '+' : ''}{rivalBreakdown.netPerTick.toFixed(4)}/s</span>
          </div>
        </div>
      </div>

      {/* Legal Representation — Multiple Lawyers */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
        <h3 className="text-white font-semibold mb-1">⚖️ Legal Representation</h3>
        <p className="text-gray-500 text-xs mb-3">Hire multiple lawyers to stack heat decay. Cost doubles per additional hire of the same type. No limit.</p>

        {/* Total lawyer stats */}
        {hiredLawyers.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="text-[9px] bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded-full">
              {hiredLawyers.reduce((s, h) => s + h.count, 0)} lawyers
            </span>
            <span className="text-[9px] bg-yellow-900/40 text-yellow-300 px-2 py-0.5 rounded-full">
              {formatMoney(hiredLawyers.reduce((s, h) => { const d = LAWYER_MAP[h.defId]; return s + (d ? d.monthlyRetainer * h.count : 0); }, 0))}/tick retainer
            </span>
            <span className="text-[9px] bg-green-900/40 text-green-300 px-2 py-0.5 rounded-full">
              -{hiredLawyers.reduce((s, h) => { const d = LAWYER_MAP[h.defId]; return s + (d ? d.heatDecayBonus * h.count : 0); }, 0).toFixed(3)}/s decay
            </span>
          </div>
        )}

        <div className="space-y-2">
          {LAWYER_DEFS.map((lawyer) => {
            const hiredEntry = hiredLawyers.find(h => h.defId === lawyer.id);
            const count = hiredEntry?.count ?? 0;
            const meetsHeatTier = heatTier >= lawyer.requiredHeatTier;
            const nextCost = Math.floor(lawyer.unlockCost * Math.pow(2, count));
            const canAfford = cleanCash >= nextCost;
            const canHire = meetsHeatTier && canAfford;
            return (
              <div key={lawyer.id} className={`rounded-lg border p-3 transition ${count > 0 ? 'border-indigo-500/60 bg-indigo-900/20' : !meetsHeatTier ? 'border-gray-700/50 bg-gray-800/20 opacity-40' : 'border-gray-700 bg-gray-800/40'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-semibold text-sm">{lawyer.name}</span>
                  {count > 0 && <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full">×{count}</span>}
                  {!meetsHeatTier && <span className="text-gray-500 text-sm">🔒 Tier {lawyer.requiredHeatTier}</span>}
                </div>
                <p className="text-gray-400 text-[11px]">{lawyer.description}</p>
                <div className="flex gap-3 mt-1 mb-2 text-[11px]">
                  <span className="text-yellow-400">Retainer: {formatMoney(lawyer.monthlyRetainer)}/tick each</span>
                  <span className="text-green-400">Decay: -{lawyer.heatDecayBonus.toFixed(3)}/s each</span>
                </div>
                <div className="flex gap-2">
                  {meetsHeatTier && (
                    <Tooltip text={`Hire another ${lawyer.name}. Cost doubles each time.`}>
                    <button disabled={!canHire} onClick={() => { if (hireLawyer(lawyer.id)) { sound.play('dealer_hire'); } }}
                      className={`flex-1 py-2 rounded-lg border border-white/30 text-xs font-bold transition ${canHire ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-gray-700 text-white cursor-not-allowed'}`}>
                      Hire · {formatMoney(nextCost)}
                    </button>
                    </Tooltip>
                  )}
                  {count > 0 && (
                    <Tooltip text="Fire one lawyer of this type. No refund.">
                    <button onClick={() => { fireLawyer(lawyer.id); sound.play('fire'); }}
                      className="px-4 py-2 rounded-lg bg-red-900/50 hover:bg-red-900/80 text-red-300 text-xs font-bold transition">
                      Fire
                    </button>
                    </Tooltip>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
