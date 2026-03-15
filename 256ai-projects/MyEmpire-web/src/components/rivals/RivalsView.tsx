import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { RIVAL_ACTIONS } from '../../data/types';
import { CREW_DEFS, getCrewBonuses, getCrewCount, getCrewUpkeep, getCrewAttack, getCrewDefense } from '../../data/crewDefs';
import { formatMoney } from '../../engine/economy';
import { sound } from '../../engine/sound';
import Tooltip from '../ui/Tooltip';

export default function RivalsView() {
  const dirtyCash = useGameStore((s) => s.dirtyCash);
  const rivals = useGameStore((s) => s.rivals ?? []);
  const crew = useGameStore((s) => s.crew ?? []);
  const rivalAttackLog = useGameStore((s) => s.rivalAttackLog ?? []);
  const attackRival = useGameStore((s) => s.attackRival);
  const hireCrew = useGameStore((s) => s.hireCrew);
  const fireCrew = useGameStore((s) => s.fireCrew);
  const addNotification = useUIStore((s) => s.addNotification);

  const businesses = useGameStore((s) => s.businesses);

  const playerCrewCount = getCrewCount(crew);
  const crewUpkeep = getCrewUpkeep(crew);
  const crewBonuses = getCrewBonuses(crew);
  const activeRivals = rivals.filter(r => !r.isDefeated);
  const defeatedRivals = rivals.filter(r => r.isDefeated);

  const heat = useGameStore((s) => s.heat ?? 0);
  const rivalHeat = useGameStore((s) => s.rivalHeat ?? 0);

  // Power calculation: ATK + DEF + businesses×100
  const playerPower = getCrewAttack(crew) + getCrewDefense(crew) + businesses.length * 100;
  const factions = [
    { name: 'You', icon: '👑', power: playerPower, heat: heat / 10, rivalThreat: rivalHeat / 10, color: '#6366f1', isPlayer: true, hitmen: playerCrewCount, biz: businesses.length },
    ...activeRivals.map(r => ({
      name: r.name, icon: r.icon,
      power: r.hitmen * 15 + r.businesses.length * 100 + Math.floor(r.power * 50),
      heat: r.aggression * 100,
      rivalThreat: r.aggression * 100,
      color: r.color, isPlayer: false, hitmen: r.hitmen, biz: r.businesses.length,
    })),
  ];
  const maxPower = Math.max(1, ...factions.map(f => f.power));

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">

      {/* Power Struggle — comparison table */}
      {factions.length > 1 && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3">
          <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">Power Struggle</p>
          {/* Header */}
          <div className="grid grid-cols-[80px_1fr_1fr] gap-2 mb-1">
            <span className="text-[9px] text-gray-600"></span>
            <span className="text-[9px] text-gray-500 text-center">Heat / Threat</span>
            <span className="text-[9px] text-gray-500 text-center">Power</span>
          </div>
          {/* Rows */}
          <div className="space-y-1">
            {[...factions].sort((a, b) => b.power - a.power).map((f) => (
              <Tooltip key={f.name} text={`${f.name}: ${f.hitmen} crew · ${f.biz} businesses · Power ${f.power.toLocaleString()} · ${f.isPlayer ? `Police heat ${Math.round(f.heat)}% · Rival heat ${Math.round(f.rivalThreat)}%` : `Aggression ${Math.round(f.heat)}%`}`}>
              <div className="grid grid-cols-[80px_1fr_1fr] gap-2 items-center">
                {/* Name */}
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-sm shrink-0">{f.icon}</span>
                  <span className={`text-[10px] font-semibold truncate ${f.isPlayer ? 'text-indigo-300' : 'text-gray-300'}`}>{f.name}</span>
                </div>
                {/* Heat bar */}
                <div className="flex items-center gap-1">
                  <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, f.isPlayer ? f.rivalThreat : f.heat)}%`,
                        backgroundColor: f.heat >= 70 ? '#ef4444' : f.heat >= 40 ? '#eab308' : '#22c55e',
                      }}
                    />
                  </div>
                  <span className="text-[8px] text-gray-500 font-mono w-8 text-right">{Math.round(f.isPlayer ? f.rivalThreat : f.heat)}%</span>
                </div>
                {/* Power bar */}
                <div className="flex items-center gap-1">
                  <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(f.power / maxPower) * 100}%`, backgroundColor: f.color }}
                    />
                  </div>
                  <span className="text-[8px] text-gray-500 font-mono w-12 text-right">{f.power.toLocaleString()}</span>
                </div>
              </div>
              </Tooltip>
            ))}
          </div>
        </div>
      )}

      {/* Crime Family — Your Crew (2-col layout matching Syndicate style) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-white font-semibold text-sm">👑 Your Crew</h3>
            <p className="text-gray-400 text-[10px]">{playerCrewCount} members · {formatMoney(crewUpkeep)}/tick</p>
          </div>
          {playerCrewCount > 0 && (
            <div className="flex flex-wrap gap-1 justify-end">
              {crewBonuses.heatReduction > 0 && <span className="text-[9px] bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded-full">-{Math.round(crewBonuses.heatReduction * 100)}% heat</span>}
              {crewBonuses.costReduction > 0 && <span className="text-[9px] bg-green-900/40 text-green-300 px-2 py-0.5 rounded-full">-{Math.round(crewBonuses.costReduction * 100)}% costs</span>}
              {crewBonuses.incomeMultiplier > 0 && <span className="text-[9px] bg-yellow-900/40 text-yellow-300 px-2 py-0.5 rounded-full">+{Math.round(crewBonuses.incomeMultiplier * 100)}% income</span>}
              {crewBonuses.dealerBoost > 0 && <span className="text-[9px] bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded-full">+{Math.round(crewBonuses.dealerBoost * 100)}% dealers</span>}
              {crewBonuses.launderBoost > 0 && <span className="text-[9px] bg-red-900/40 text-red-300 px-2 py-0.5 rounded-full">+{Math.round(crewBonuses.launderBoost * 100)}% launder</span>}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {CREW_DEFS.map(def => {
            const owned = crew.find(h => h.defId === def.id)?.count ?? 0;
            const atMax = owned >= def.maxCount;
            const canAfford = dirtyCash >= def.cost && !atMax;
            const bonusLines = Object.entries(def.bonuses).filter(([, v]) => v && v > 0).map(([k, v]) => {
              const label = k === 'heatReduction' ? 'heat gain' : k === 'costReduction' ? 'costs' : k === 'incomeMultiplier' ? 'income' : k === 'dealerBoost' ? 'dealer sales' : 'launder';
              const sign = k === 'heatReduction' || k === 'costReduction' ? '-' : '+';
              return `${sign}${Math.round((v ?? 0) * 100)}% ${label}`;
            });
            return (
              <Tooltip key={def.id} text={def.description}>
              <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{def.icon}</span>
                  <div>
                    <p className="text-white font-bold text-sm">{def.name}</p>
                    <p className="text-gray-400 text-[10px]">×{owned} / {def.maxCount}</p>
                  </div>
                </div>
                <div className="flex gap-3 text-[10px]">
                  <span className="text-red-400">ATK {def.attack}</span>
                  <span className="text-blue-400">DEF {def.defense}</span>
                  <span className="text-yellow-400">${def.upkeep}/tick</span>
                </div>
                <div className="text-[10px] text-cyan-300 space-y-0.5">
                  {bonusLines.map((line, i) => <p key={i}>{line}</p>)}
                </div>
                <div className="flex gap-1.5 mt-auto">
                  <button
                    onClick={() => {
                      if (hireCrew(def.id)) { sound.play('dealer_hire'); addNotification(`Recruited ${def.name}!`, 'success'); }
                      else addNotification(atMax ? `Max ${def.name}s reached` : `Need ${formatMoney(def.cost)}`, 'warning');
                    }}
                    disabled={!canAfford}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${canAfford ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                  >
                    {atMax ? 'MAX' : `Hire · ${formatMoney(def.cost)}`}
                  </button>
                  {owned > 0 && (
                    <button onClick={() => { fireCrew(def.id); sound.play('fire'); addNotification(`Fired a ${def.name}`, 'warning'); }}
                      className="px-3 py-2 rounded-lg text-xs font-semibold bg-gray-700 hover:bg-gray-600 text-red-400 transition">
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
      {activeRivals.length > 0 ? (
        <div className="space-y-3">
          {activeRivals.map(rival => (
            <div
              key={rival.id}
              className="bg-gray-800/60 border rounded-xl p-3"
              style={{ borderColor: rival.color + '50', backgroundColor: rival.color + '08' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{rival.icon}</span>
                  <div>
                    <span className="text-white font-semibold text-sm">{rival.name}</span>
                  </div>
                </div>
                <div className="text-right text-[10px]">
                  <p className={`font-semibold ${rival.dirtyCash >= 100000 ? 'text-yellow-400' : 'text-gray-500'}`}>
                    {rival.dirtyCash >= 100000 ? '💰 Earning clean cash' : `${formatMoney(100000 - rival.dirtyCash)} to clean cash`}
                  </p>
                </div>
              </div>

              {/* Weakness bar */}
              <Tooltip text={`Weakness: ${Math.floor(rival.weakness ?? 0)}%. ${(rival.weakness ?? 0) >= 67 ? 'Critical — can be assassinated!' : (rival.weakness ?? 0) >= 33 ? 'Weakening — keep attacking.' : 'Strong — attack to weaken.'} Power ×${rival.power.toFixed(1)} · ${rival.hitmen} hitmen · ${rival.businesses.length} businesses · ${formatMoney(rival.dirtyCash)} dirty · ${formatMoney(rival.cleanCash)} clean · ${rival.productOz} oz product`}>
              <div className="mb-2">
                <div className="flex items-center justify-between text-[9px] mb-0.5">
                  <span className="text-gray-500">Weakness</span>
                  <span className={`font-bold ${(rival.weakness ?? 0) >= 67 ? 'text-red-400' : (rival.weakness ?? 0) >= 33 ? 'text-yellow-400' : 'text-gray-500'}`}>
                    {Math.floor(rival.weakness ?? 0)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${rival.weakness ?? 0}%`,
                      backgroundColor: (rival.weakness ?? 0) >= 67 ? '#ef4444' : (rival.weakness ?? 0) >= 33 ? '#eab308' : '#6b7280',
                    }}
                  />
                </div>
              </div>
              </Tooltip>

              <div className="grid grid-cols-2 gap-1 text-[10px] mb-2">
                <span className="text-gray-500">Dirty: <span className="text-green-400">{formatMoney(rival.dirtyCash)}</span></span>
                <span className="text-gray-500">Clean: <span className="text-blue-400">{formatMoney(rival.cleanCash)}</span></span>
                <span className="text-gray-500">Product: <span className="text-emerald-400">{rival.productOz} oz</span></span>
                <span className="text-gray-500">Businesses: <span className="text-purple-400">{rival.businesses.length}</span></span>
                <span className="text-gray-500">Lots: <span className="text-amber-400">{rival.ownedLots?.length ?? 0}</span></span>
                <span className="text-gray-500">Hitmen: <span className="text-red-400">{rival.hitmen}</span></span>
                <span className="text-gray-500">Power: <span className="text-orange-400">×{rival.power.toFixed(1)}</span></span>
                <span className="text-gray-500">Aggro: <span style={{ color: rival.aggression > 0.5 ? '#ef4444' : '#a3a3a3' }}>{Math.round(rival.aggression * 100)}%</span></span>
              </div>

              <div className="flex gap-1 flex-wrap">
                {RIVAL_ACTIONS.map(action => {
                  const hasEnough = playerCrewCount >= action.hitmenRequired;
                  const canAffordAction = dirtyCash >= action.cost;
                  const canDo = hasEnough && canAffordAction;
                  // Assassinate only when weakness >= 67 and hitmen <= 1
                  const blocked = action.type === 'assassinate' && ((rival.weakness ?? 0) < 67 || rival.hitmen > 1);
                  return (
                    <Tooltip key={action.type} text={action.description}>
                    <button
                      onClick={() => {
                        if (blocked) {
                          const reasons: string[] = [];
                          if ((rival.weakness ?? 0) < 67) reasons.push(`Need ${67 - Math.floor(rival.weakness ?? 0)}% more weakness (${Math.floor(rival.weakness ?? 0)}%/67%)`);
                          if (rival.hitmen > 1) reasons.push(`Rival has ${rival.hitmen} hitmen — take them out first`);
                          addNotification(reasons.join('. '), 'warning');
                          return;
                        }
                        const result = attackRival(rival.id, action.type);
                        if (result) { sound.play('attack'); addNotification(result.message, result.success ? 'success' : 'warning'); }
                      }}
                      disabled={!canDo}
                      className={`px-2 py-1.5 rounded text-[9px] font-semibold transition ${
                        blocked ? 'bg-gray-800 text-red-800 cursor-pointer border border-red-900/50' :
                        canDo ? 'bg-red-900/60 hover:bg-red-800/60 text-red-300' : 'bg-gray-800 text-white cursor-not-allowed'
                      }`}
                    >
                      {action.name} · {formatMoney(action.cost)}
                    </button>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : rivals.length === 0 ? (
        <div className="bg-gray-800/40 rounded-xl p-6 text-center">
          <span className="text-3xl">🕊️</span>
          <p className="text-gray-400 text-sm mt-2">No rivals in this game.</p>
        </div>
      ) : null}

      {/* Defeated rivals */}
      {defeatedRivals.length > 0 && (
        <div className="space-y-2">
          <p className="text-gray-600 text-[10px] uppercase tracking-widest px-1">Defeated</p>
          {defeatedRivals.map(rival => (
            <div key={rival.id} className="bg-gray-800/30 rounded-lg p-3 opacity-40 flex items-center gap-2">
              <span className="text-lg">{rival.icon}</span>
              <span className="text-gray-500 text-sm">{rival.name}</span>
              <span className="text-gray-600 text-[9px] ml-auto">ELIMINATED</span>
            </div>
          ))}
        </div>
      )}

      {/* Attack Log */}
      {rivalAttackLog.length > 0 && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-2">Attack Log</h3>
          <div className="space-y-1">
            {[...rivalAttackLog].reverse().map((msg, i) => (
              <p key={i} className="text-[10px] text-gray-400">{msg}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
