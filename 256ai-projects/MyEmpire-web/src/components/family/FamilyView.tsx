import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { CREW_DEFS, getCrewBonuses, getCrewCount, getCrewUpkeep } from '../../data/crewDefs';
import { formatMoney } from '../../engine/economy';
import { sound } from '../../engine/sound';
import Tooltip from '../ui/Tooltip';

export default function FamilyView() {
  const dirtyCash = useGameStore((s) => s.dirtyCash);
  const crew = useGameStore((s) => s.crew ?? []);
  const hireCrew = useGameStore((s) => s.hireCrew);
  const fireCrew = useGameStore((s) => s.fireCrew);
  const addNotification = useUIStore((s) => s.addNotification);

  const playerCrewCount = getCrewCount(crew);
  const crewUpkeep = getCrewUpkeep(crew);
  const crewBonuses = getCrewBonuses(crew);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="text-center py-2">
        <span className="text-3xl">👑</span>
        <h2 className="text-white font-bold text-xl mt-1">Crime Family</h2>
        <p className="text-gray-400 text-xs mt-1">
          {playerCrewCount} members · Upkeep: {formatMoney(crewUpkeep)}/tick
        </p>
      </div>

      {/* Active bonuses pills */}
      {playerCrewCount > 0 && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3">
          <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">Active Bonuses</p>
          <div className="flex flex-wrap gap-1.5">
            {crewBonuses.heatReduction > 0 && <span className="text-[10px] bg-blue-900/40 text-blue-300 px-2.5 py-1 rounded-full">-{Math.round(crewBonuses.heatReduction * 100)}% heat gain</span>}
            {crewBonuses.costReduction > 0 && <span className="text-[10px] bg-green-900/40 text-green-300 px-2.5 py-1 rounded-full">-{Math.round(crewBonuses.costReduction * 100)}% costs</span>}
            {crewBonuses.incomeMultiplier > 0 && <span className="text-[10px] bg-yellow-900/40 text-yellow-300 px-2.5 py-1 rounded-full">+{Math.round(crewBonuses.incomeMultiplier * 100)}% income</span>}
            {crewBonuses.dealerBoost > 0 && <span className="text-[10px] bg-purple-900/40 text-purple-300 px-2.5 py-1 rounded-full">+{Math.round(crewBonuses.dealerBoost * 100)}% dealer sales</span>}
            {crewBonuses.launderBoost > 0 && <span className="text-[10px] bg-red-900/40 text-red-300 px-2.5 py-1 rounded-full">+{Math.round(crewBonuses.launderBoost * 100)}% launder</span>}
          </div>
        </div>
      )}

      {/* Crew grid */}
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
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                    canAfford ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {atMax ? 'MAX' : `Hire · ${formatMoney(def.cost)}`}
                </button>
                {owned > 0 && (
                  <button
                    onClick={() => { fireCrew(def.id); sound.play('fire'); }}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-gray-700 hover:bg-gray-600 text-red-400 transition"
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

      {/* Future: Syndicate (multiplayer guilds) teaser */}
      <div className="bg-gray-800/30 rounded-xl p-4 border border-dashed border-gray-700 text-center">
        <span className="text-2xl">🤝</span>
        <p className="text-gray-500 text-sm mt-1 font-semibold">Syndicates — Coming Soon</p>
        <p className="text-gray-600 text-[10px] mt-0.5">Join forces with other players. Wage war as a syndicate.</p>
      </div>
    </div>
  );
}
