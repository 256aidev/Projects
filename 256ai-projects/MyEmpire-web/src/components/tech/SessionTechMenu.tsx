import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { SESSION_TECH_DEFS, INITIAL_SESSION_TECH } from '../../data/sessionTechDefs';
import type { SessionTechId } from '../../data/sessionTechDefs';
import { formatMoney, formatUnits } from '../../engine/economy';
import { sound } from '../../engine/sound';
import Tooltip from '../ui/Tooltip';

export default function SessionTechMenu() {
  const sessionTech = useGameStore((s) => s.sessionTechUpgrades ?? INITIAL_SESSION_TECH);
  const dirtyCash = useGameStore((s) => s.dirtyCash);
  const cleanCash = useGameStore((s) => s.cleanCash);
  const productInventory = useGameStore((s) => s.operation.productInventory);
  const purchaseSessionTech = useGameStore((s) => s.purchaseSessionTech);
  const setShowSessionTechMenu = useUIStore((s) => s.setShowSessionTechMenu);
  const addNotification = useUIStore((s) => s.addNotification);

  const totalOz = Object.values(productInventory).reduce((s, e) => s + e.oz, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-amber-900/50">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛠️</span>
          <div>
            <h1 className="text-lg font-bold text-amber-300">Street Upgrades</h1>
            <p className="text-[9px] text-gray-500">Temporary boosts — reset on prestige</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right space-y-0.5">
            <p className="text-green-400 text-[10px]">💵 {formatMoney(dirtyCash)}</p>
            <p className="text-blue-400 text-[10px]">🏦 {formatMoney(cleanCash)}</p>
            <p className="text-emerald-400 text-[10px]">🌿 {formatUnits(totalOz)}</p>
          </div>
          <Tooltip text="Close Street Upgrades">
            <button
              onClick={() => setShowSessionTechMenu(false)}
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
          These upgrades are lost on prestige reset or game reset. Invest wisely.
        </p>
      </div>

      {/* Upgrade Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
          {SESSION_TECH_DEFS.map((def) => {
            const level = sessionTech[def.id] ?? 0;
            const isMaxed = level >= def.maxLevel;
            const nextCost = isMaxed ? null : def.costs[level];
            const canAfford = nextCost
              ? dirtyCash >= nextCost.dirtyCash && cleanCash >= nextCost.cleanCash && totalOz >= nextCost.productOz
              : false;
            const currentBonus = level * def.effectPerLevel;

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

                {/* Level dots */}
                <div className="flex gap-1">
                  {Array.from({ length: def.maxLevel }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full border ${
                        i < level
                          ? 'bg-amber-400 border-amber-500'
                          : 'bg-gray-700 border-gray-600'
                      }`}
                    />
                  ))}
                </div>

                {/* Current bonus */}
                <p className="text-amber-300 text-xs font-mono">
                  {level > 0 ? formatSessionBonus(def.bonusType, currentBonus) : 'Not unlocked'}
                </p>

                {/* Cost breakdown */}
                {!isMaxed && nextCost && (
                  <div className="flex flex-wrap gap-1.5 text-[9px]">
                    <span className={dirtyCash >= nextCost.dirtyCash ? 'text-green-400' : 'text-red-400'}>
                      💵 {formatMoney(nextCost.dirtyCash)}
                    </span>
                    <span className={cleanCash >= nextCost.cleanCash ? 'text-blue-400' : 'text-red-400'}>
                      🏦 {formatMoney(nextCost.cleanCash)}
                    </span>
                    <span className={totalOz >= nextCost.productOz ? 'text-emerald-400' : 'text-red-400'}>
                      🌿 {formatUnits(nextCost.productOz)}
                    </span>
                  </div>
                )}

                {/* Upgrade button */}
                {isMaxed ? (
                  <div className="text-center text-[10px] text-yellow-500 font-bold py-1.5">MAX</div>
                ) : (
                  <Tooltip text={`Costs dirty cash, clean cash, and product. Lost on prestige reset.`}>
                    <button
                      onClick={() => {
                        if (purchaseSessionTech(def.id as SessionTechId)) {
                          sound.play('upgrade');
                          addNotification(`${def.name} upgraded!`, 'success');
                        } else {
                          addNotification('Not enough resources', 'warning');
                        }
                      }}
                      disabled={!canAfford}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold transition ${
                        canAfford
                          ? 'bg-amber-700 hover:bg-amber-600 text-white'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Upgrade
                    </button>
                  </Tooltip>
                )}

                {/* Next level preview */}
                {!isMaxed && (
                  <p className="text-gray-500 text-[10px] text-center">
                    Next: {def.effectLabel}
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

function formatSessionBonus(bonusType: string, value: number): string {
  switch (bonusType) {
    case 'yield': return `+${Math.round(value * 100)}% yield`;
    case 'speed': return `-${Math.round(value * 100)}% grow time`;
    case 'dealer': return `+${Math.round(value * 100)}% dealer sales`;
    case 'launder': return `+${Math.round(value * 100)}% launder eff.`;
    case 'heat': return `-${Math.round(value * 100)}% heat gain`;
    case 'demand': return `+${Math.round(value)} oz street demand`;
    case 'seeds': return `-${Math.round(value * 100)}% seed cost`;
    default: return `+${value}`;
  }
}
