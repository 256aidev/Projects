import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { RUN_TECH_UPGRADES, INITIAL_RUN_TECH } from '../../data/runTechDefs';
import type { RunTechId } from '../../data/runTechDefs';
import { formatMoney } from '../../engine/economy';
import { sound } from '../../engine/sound';
import Tooltip from '../ui/Tooltip';

export default function RunTechMenu() {
  const runTech = useGameStore((s) => s.runTechUpgrades ?? INITIAL_RUN_TECH);
  const dirtyCash = useGameStore((s) => s.dirtyCash);
  const purchaseRunTech = useGameStore((s) => s.purchaseRunTech);
  const setShowRunTechMenu = useUIStore((s) => s.setShowRunTechMenu);
  const addNotification = useUIStore((s) => s.addNotification);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-amber-700/50">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔧</span>
          <div>
            <h1 className="text-lg font-bold text-amber-400">Run Upgrades</h1>
            <p className="text-[9px] text-gray-500">Persist until prestige reset</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-green-400 text-[10px]">💵 {formatMoney(dirtyCash)}</p>
          </div>
          <Tooltip text="Close Run Upgrades">
            <button
              onClick={() => setShowRunTechMenu(false)}
              className="text-gray-400 hover:text-white text-2xl leading-none px-2"
            >
              &times;
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Warning banner */}
      <div className="bg-amber-900/20 border-b border-amber-900/30 px-4 py-2 text-center">
        <p className="text-amber-400/80 text-[10px]">
          These upgrades persist across sessions but are lost on prestige reset. Costs dirty cash only.
        </p>
      </div>

      {/* Upgrade Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
          {RUN_TECH_UPGRADES.map((def) => {
            const level = runTech[def.id] ?? 0;
            const isMaxed = level >= def.maxLevel;
            const nextCost = isMaxed ? 0 : def.costs[level];
            const canAfford = !isMaxed && dirtyCash >= nextCost;
            const currentBonus = level * def.bonusPerLevel;

            return (
              <div
                key={def.id}
                className="bg-gray-800/80 rounded-xl border border-gray-700/60 p-3 flex flex-col gap-2"
              >
                {/* Icon + Name */}
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{def.icon}</span>
                  <div>
                    <p className="text-white font-semibold text-sm leading-tight">{def.name}</p>
                    <p className="text-gray-500 text-[10px] leading-tight">{def.description}</p>
                  </div>
                </div>

                {/* Level indicator dots (max 5) */}
                <div className="flex gap-1">
                  {Array.from({ length: def.maxLevel }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full border ${
                        i < level
                          ? 'bg-amber-500 border-amber-600'
                          : 'bg-gray-700 border-gray-600'
                      }`}
                    />
                  ))}
                </div>

                {/* Current bonus */}
                <p className="text-amber-400 text-xs font-mono">
                  {level > 0 ? formatRunBonus(def.bonusType, currentBonus) : 'Not unlocked'}
                </p>

                {/* Upgrade button with cost */}
                {isMaxed ? (
                  <div className="text-center text-[10px] text-yellow-500 font-bold py-1.5">MAX</div>
                ) : (
                  <Tooltip text={`Costs ${formatMoney(nextCost)} dirty cash. Lost on prestige reset.`}>
                    <button
                      onClick={() => {
                        if (purchaseRunTech(def.id as RunTechId)) {
                          sound.play('upgrade');
                          addNotification(`${def.name} upgraded!`, 'success');
                        } else {
                          addNotification('Not enough dirty cash', 'warning');
                        }
                      }}
                      disabled={!canAfford}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold transition ${
                        canAfford
                          ? 'bg-amber-600 hover:bg-amber-500 text-white'
                          : 'bg-gray-700 text-white cursor-not-allowed'
                      }`}
                    >
                      Upgrade &middot; {formatMoney(nextCost)}
                    </button>
                  </Tooltip>
                )}

                {/* Next level preview */}
                {!isMaxed && (
                  <p className="text-gray-500 text-[10px] text-center">
                    Next: +{formatRunBonusPreview(def.bonusType, def.bonusPerLevel)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function formatRunBonus(bonusType: string, value: number): string {
  switch (bonusType) {
    case 'yield': return `+${Math.round(value * 100)}% yield`;
    case 'speed': return `-${Math.round(value * 100)}% grow time`;
    case 'dealer': return `+${Math.round(value * 100)}% dealer sales`;
    case 'launder': return `+${Math.round(value * 100)}% launder eff.`;
    case 'heat': return `-${Math.round(value * 100)}% heat gain`;
    case 'price': return `+${Math.round(value * 100)}% sell price`;
    case 'demand': return `+${Math.round(value)} oz street demand`;
    case 'seeds': return `-${Math.round(value * 100)}% seed cost`;
    default: return `+${value}`;
  }
}

function formatRunBonusPreview(bonusType: string, perLevel: number): string {
  switch (bonusType) {
    case 'yield': return `${Math.round(perLevel * 100)}% yield`;
    case 'speed': return `${Math.round(perLevel * 100)}% grow speed`;
    case 'dealer': return `${Math.round(perLevel * 100)}% dealer sales`;
    case 'launder': return `${Math.round(perLevel * 100)}% launder eff.`;
    case 'heat': return `${Math.round(perLevel * 100)}% heat reduction`;
    case 'price': return `${Math.round(perLevel * 100)}% sell price`;
    case 'demand': return `${Math.round(perLevel)} oz demand`;
    case 'seeds': return `${Math.round(perLevel * 100)}% seed discount`;
    default: return `${perLevel}`;
  }
}
