import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { getHeatTier, getHeatBreakdown, getRivalHeatTier, getRivalHeatBreakdown, HEAT_MAX } from '../../engine/heat';
import { HEAT_TIER_NAMES, HEAT_TIER_COLORS, RIVAL_TIER_NAMES, RIVAL_TIER_COLORS, RIVAL_ACTIONS } from '../../data/types';
import { LAWYER_DEFS, LAWYER_MAP } from '../../data/lawyers';
import { CREW_DEFS, getCrewBonuses, getCrewCount, getCrewUpkeep, CREW_MAP } from '../../data/crewDefs';
import { formatMoney } from '../../engine/economy';
import { sound } from '../../engine/sound';
import Tooltip from '../ui/Tooltip';

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

  const rivalHeat = useGameStore((s) => s.rivalHeat ?? 0);
  const rivals = useGameStore((s) => s.rivals ?? []);
  const crew = useGameStore((s) => s.crew ?? []);
  const rivalAttackLog = useGameStore((s) => s.rivalAttackLog ?? []);
  const hireCrew = useGameStore((s) => s.hireCrew);
  const fireCrew = useGameStore((s) => s.fireCrew);
  const attackRival = useGameStore((s) => s.attackRival);
  const addNotification = useUIStore((s) => s.addNotification);

  const playerCrewCount = getCrewCount(crew);
  const crewUpkeep = getCrewUpkeep(crew);
  const crewBonuses = getCrewBonuses(crew);

  const heatTier = getHeatTier(heat);
  const tierName = HEAT_TIER_NAMES[heatTier];
  const tierColor = HEAT_TIER_COLORS[heatTier];

  const rivalTier = getRivalHeatTier(rivalHeat);
  const rivalTierName = RIVAL_TIER_NAMES[rivalTier];
  const rivalTierColor = RIVAL_TIER_COLORS[rivalTier];

  const breakdown = getHeatBreakdown(dirtyCash, dealerCount, dealerTierIndex, businesses, activeLawyerId);
  const rivalBreakdown = getRivalHeatBreakdown(dealerCount, dealerTierIndex, businesses);
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

        <Tooltip text="Police heat rises from holding dirty cash and employing dealers. High heat triggers raids that destroy product and cash.">
        <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(heat / HEAT_MAX) * 100}%`, backgroundColor: tierColor }}
          />
        </div>
        <p className="text-gray-400 text-xs text-right">{Math.floor(heat)} / {HEAT_MAX}</p>
        </Tooltip>

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

      {/* Rival Heat */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-white font-semibold">Rival Heat</h3>
            <p className="text-xs" style={{ color: rivalTierColor }}>Tier {rivalTier}: {rivalTierName}</p>
          </div>
          <span className="text-3xl">🔫</span>
        </div>

        <Tooltip text="Rival heat rises as your operation expands. High rival heat triggers attacks on your stash, cash, and dealers.">
        <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(rivalHeat / HEAT_MAX) * 100}%`, backgroundColor: rivalTierColor }}
          />
        </div>
        <p className="text-gray-400 text-xs text-right">{Math.floor(rivalHeat)} / {HEAT_MAX}</p>
        </Tooltip>

        {rivalTier === 0 && rivalHeat < 1 && (
          <p className="text-green-400 text-xs mt-2 text-center">
            No rival gangs have noticed you yet.
          </p>
        )}

        {/* Rival breakdown */}
        <div className="mt-3 space-y-1 text-[11px]">
          <p className="text-gray-500 font-semibold uppercase tracking-wide text-[9px]">Rivalry Sources</p>
          {dealerCount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">Dealer presence ({dealerCount})</span>
              <span className="text-red-400">+{rivalBreakdown.dealerHeat.toFixed(4)}/s</span>
            </div>
          )}
          {rivalBreakdown.territoryHeat > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">Territory expansion</span>
              <span className="text-red-400">+{rivalBreakdown.territoryHeat.toFixed(4)}/s</span>
            </div>
          )}

          <p className="text-gray-500 font-semibold uppercase tracking-wide text-[9px] mt-2">Reduction</p>
          <div className="flex justify-between">
            <span className="text-gray-400">Natural cooldown</span>
            <span className="text-green-400">-{rivalBreakdown.naturalDecay.toFixed(3)}/s</span>
          </div>

          <div className="border-t border-gray-700 mt-1 pt-1 flex justify-between font-semibold">
            <span className="text-gray-300">Net rival heat/tick</span>
            <span style={{ color: rivalBreakdown.netPerTick > 0 ? '#ef4444' : '#22c55e' }}>
              {rivalBreakdown.netPerTick > 0 ? '+' : ''}{rivalBreakdown.netPerTick.toFixed(4)}/s
            </span>
          </div>
        </div>
      </div>

      {/* Crime Family */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-white font-semibold">Your Crime Family</h3>
            <p className="text-gray-400 text-[10px]">
              {playerCrewCount} members · Upkeep: {formatMoney(crewUpkeep)}/tick
            </p>
          </div>
          <span className="text-2xl">👑</span>
        </div>

        {/* Active bonuses pills */}
        {playerCrewCount > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {crewBonuses.heatReduction > 0 && <span className="text-[9px] bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded-full">-{Math.round(crewBonuses.heatReduction * 100)}% heat</span>}
            {crewBonuses.costReduction > 0 && <span className="text-[9px] bg-green-900/40 text-green-300 px-2 py-0.5 rounded-full">-{Math.round(crewBonuses.costReduction * 100)}% costs</span>}
            {crewBonuses.incomeMultiplier > 0 && <span className="text-[9px] bg-yellow-900/40 text-yellow-300 px-2 py-0.5 rounded-full">+{Math.round(crewBonuses.incomeMultiplier * 100)}% income</span>}
            {crewBonuses.dealerBoost > 0 && <span className="text-[9px] bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded-full">+{Math.round(crewBonuses.dealerBoost * 100)}% dealers</span>}
            {crewBonuses.launderBoost > 0 && <span className="text-[9px] bg-red-900/40 text-red-300 px-2 py-0.5 rounded-full">+{Math.round(crewBonuses.launderBoost * 100)}% launder</span>}
          </div>
        )}

        {/* Compact crew grid */}
        <div className="grid grid-cols-4 gap-1.5">
          {CREW_DEFS.map(def => {
            const owned = crew.find(h => h.defId === def.id)?.count ?? 0;
            const atMax = owned >= def.maxCount;
            const canAfford = dirtyCash >= def.cost && !atMax;
            const bonusLines = Object.entries(def.bonuses).filter(([, v]) => v && v > 0).map(([k, v]) => {
              const label = k === 'heatReduction' ? 'heat' : k === 'costReduction' ? 'costs' : k === 'incomeMultiplier' ? 'income' : k === 'dealerBoost' ? 'dealers' : 'launder';
              const sign = k === 'heatReduction' || k === 'costReduction' ? '-' : '+';
              return `${sign}${Math.round((v ?? 0) * 100)}% ${label}`;
            });
            return (
              <Tooltip key={def.id} text={def.description}>
              <div className="bg-gray-900/60 rounded-lg p-2 flex flex-col gap-1 text-center border border-gray-700/50">
                <span className="text-lg">{def.icon}</span>
                <p className="text-white font-bold text-[10px] leading-tight">{def.name}</p>
                <p className="text-gray-400 text-[9px]">×{owned}/{def.maxCount}</p>
                <div className="text-[8px] space-y-0.5">
                  <p className="text-red-400">ATK {def.attack}</p>
                  <p className="text-blue-400">DEF {def.defense}</p>
                  <p className="text-yellow-400">${def.upkeep}/tick</p>
                </div>
                <div className="text-[8px] text-cyan-300 space-y-0">
                  {bonusLines.map((line, i) => <p key={i}>{line}</p>)}
                </div>
                <div className="flex flex-col gap-0.5 mt-auto">
                  <button
                    onClick={() => {
                      if (hireCrew(def.id)) { sound.play('dealer_hire'); addNotification(`Recruited ${def.name}!`, 'success'); }
                      else addNotification(atMax ? `Max ${def.name}s reached` : `Need ${formatMoney(def.cost)}`, 'warning');
                    }}
                    disabled={!canAfford}
                    className={`w-full py-1 rounded text-[9px] font-bold transition ${
                      canAfford ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-gray-700 text-white cursor-not-allowed'
                    }`}
                  >
                    {atMax ? 'MAX' : formatMoney(def.cost)}
                  </button>
                  {owned > 0 && (
                    <button
                      onClick={() => { fireCrew(def.id); sound.play('fire'); }}
                      className="w-full py-0.5 rounded text-[8px] font-semibold bg-gray-700 hover:bg-gray-600 text-red-400 transition"
                    >
                      Fire
                    </button>
                  )}
                </div>
              </div>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Rival Syndicates */}
      {rivals.length > 0 && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-3">Rival Syndicates</h3>
          <div className="space-y-3">
            {rivals.map(rival => (
              <div
                key={rival.id}
                className={`rounded-lg border p-3 ${rival.isDefeated ? 'border-gray-700/30 opacity-40' : 'border-gray-700'}`}
                style={!rival.isDefeated ? { borderColor: rival.color + '50', backgroundColor: rival.color + '08' } : undefined}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{rival.icon}</span>
                    <div>
                      <span className="text-white font-semibold text-sm">{rival.name}</span>
                      {rival.isDefeated && <span className="text-gray-500 text-[9px] ml-2">DEFEATED</span>}
                    </div>
                  </div>
                  <div className="text-right text-[10px]">
                    <p className="text-red-400">{rival.hitmen} hitmen</p>
                    <p className="text-gray-500">{rival.businesses.length} biz</p>
                  </div>
                </div>

                {!rival.isDefeated && (
                  <div className="grid grid-cols-2 gap-1 text-[10px] mb-2">
                    <span className="text-gray-500">Cash: <span className="text-yellow-400">{formatMoney(rival.dirtyCash)}</span></span>
                    <span className="text-gray-500">Product: <span className="text-green-400">{rival.productOz} oz</span></span>
                    <span className="text-gray-500">Power: <span className="text-orange-400">×{rival.power.toFixed(1)}</span></span>
                    <span className="text-gray-500">Aggro: <span style={{ color: rival.aggression > 0.5 ? '#ef4444' : '#a3a3a3' }}>{Math.round(rival.aggression * 100)}%</span></span>
                  </div>
                )}

                {!rival.isDefeated && (
                  <div className="flex gap-1 flex-wrap">
                    {RIVAL_ACTIONS.map(action => {
                      const hasEnough = playerCrewCount >= action.hitmenRequired;
                      const canAffordAction = dirtyCash >= action.cost;
                      const canDo = hasEnough && canAffordAction;
                      return (
                        <Tooltip key={action.type} text="Send hitmen to attack this rival. Costs dirty cash.">
                        <button
                          onClick={() => {
                            const result = attackRival(rival.id, action.type);
                            if (result) { sound.play('attack'); addNotification(result.message, result.success ? 'success' : 'warning'); }
                          }}
                          disabled={!canDo}
                          className={`px-2 py-1.5 rounded text-[9px] font-semibold transition ${
                            canDo ? 'bg-red-900/60 hover:bg-red-800/60 text-red-300' : 'bg-gray-800 text-white cursor-not-allowed'
                          }`}
                        >
                          {action.name} · {formatMoney(action.cost)}
                        </button>
                        </Tooltip>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attack Log */}
      {rivalAttackLog.length > 0 && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-2">Recent Events</h3>
          <div className="space-y-1">
            {[...rivalAttackLog].reverse().map((msg, i) => (
              <p key={i} className="text-[10px] text-gray-400">{msg}</p>
            ))}
          </div>
        </div>
      )}

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
            <Tooltip text="Dismiss your current lawyer. No refund.">
            <button
              onClick={() => { fireLawyer(); sound.play('fire'); }}
              className="px-6 py-2 bg-red-900/50 border border-red-500/50 rounded-lg text-red-300 text-xs font-bold hover:bg-red-900/80 transition"
            >
              Fire
            </button>
            </Tooltip>
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
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-semibold text-sm">{lawyer.name}</span>
                    {isActive && <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full">ACTIVE</span>}
                    {!meetsHeatTier && <span className="text-gray-500 text-sm">🔒 Tier {lawyer.requiredHeatTier}</span>}
                  </div>
                  <p className="text-gray-400 text-[11px]">{lawyer.description}</p>
                  <div className="flex gap-3 mt-1 mb-2 text-[11px]">
                    <span className="text-yellow-400">Retainer: {formatMoney(lawyer.monthlyRetainer)}/tick</span>
                    <span className="text-green-400">Decay: -{lawyer.heatDecayBonus.toFixed(3)}/s</span>
                  </div>

                  {meetsHeatTier && !isActive && (
                    <Tooltip text="Retain a lawyer to reduce police heat over time. Costs per tick.">
                    <button
                      disabled={!canHire}
                      onClick={() => { hireLawyer(lawyer.id); sound.play('dealer_hire'); }}
                      className={`w-full py-2 rounded-lg border border-white/30 text-xs font-bold transition ${
                        canHire
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          : 'bg-gray-700 text-white cursor-not-allowed'
                      }`}
                    >
                      Hire · {formatMoney(lawyer.unlockCost)}
                    </button>
                    </Tooltip>
                  )}
                  {isActive && (
                    <p className="text-indigo-400 text-xs text-center font-semibold">✓ Currently Retained</p>
                  )}
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
