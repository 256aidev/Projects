import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { TECH_UPGRADE_DEFS } from '../../data/techDefs';
import type { TechUpgradeId } from '../../data/techDefs';
import { INITIAL_TECH_UPGRADES } from '../../data/techDefs';
import { sound } from '../../engine/sound';
import Tooltip from '../ui/Tooltip';

export default function TechMenu() {
  const techPoints = useGameStore((s) => s.techPoints ?? 0);
  const techUpgrades = useGameStore((s) => s.techUpgrades ?? INITIAL_TECH_UPGRADES);
  const totalTechPointsEarned = useGameStore((s) => s.totalTechPointsEarned ?? 0);
  const prestigeCount = useGameStore((s) => s.prestigeCount ?? 0);
  const purchaseTechUpgrade = useGameStore((s) => s.purchaseTechUpgrade);
  const setShowTechMenu = useUIStore((s) => s.setShowTechMenu);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-cyan-900/50">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔬</span>
          <h1 className="text-lg font-bold text-cyan-300">Tech Lab</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-cyan-400 font-bold text-lg">{techPoints} TP</p>
            <p className="text-gray-500 text-[10px]">{totalTechPointsEarned} lifetime | {prestigeCount} prestiges</p>
          </div>
          <Tooltip text="Close Tech Lab">
          <button
            onClick={() => setShowTechMenu(false)}
            className="text-gray-400 hover:text-white text-2xl leading-none px-2"
          >
            &times;
          </button>
          </Tooltip>
        </div>
      </div>

      {/* Upgrade Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
          {TECH_UPGRADE_DEFS.map((def) => {
            const level = techUpgrades[def.id] ?? 0;
            const isMaxed = level >= def.maxLevel;
            const nextCost = isMaxed ? 0 : def.costs[level];
            const canAfford = techPoints >= nextCost;
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
                          ? 'bg-cyan-400 border-cyan-500'
                          : 'bg-gray-700 border-gray-600'
                      }`}
                    />
                  ))}
                </div>

                {/* Current bonus */}
                <p className="text-cyan-300 text-xs font-mono">
                  {level > 0 ? formatBonus(def.bonusType, currentBonus) : 'Not unlocked'}
                </p>

                {/* Upgrade button */}
                {isMaxed ? (
                  <div className="text-center text-[10px] text-yellow-500 font-bold py-1.5">MAX</div>
                ) : (
                  <Tooltip text={`Spend ${nextCost} Tech Points to permanently boost ${def.name.toLowerCase()}. Survives prestige resets.`}>
                  <button
                    onClick={() => { purchaseTechUpgrade(def.id as TechUpgradeId); sound.play('upgrade'); }}
                    disabled={!canAfford}
                    className={`w-full py-1.5 rounded-lg text-xs font-bold transition ${
                      canAfford
                        ? 'bg-cyan-700 hover:bg-cyan-600 text-white'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Upgrade &middot; {nextCost} TP
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

function formatBonus(bonusType: string, value: number): string {
  switch (bonusType) {
    case 'yield': return `+${Math.round(value * 100)}% yield`;
    case 'speed': return `-${Math.round(value * 100)}% grow time`;
    case 'double': return `+${Math.round(value * 100)}% double chance`;
    case 'capacity': return `+${value} plants/room`;
    case 'dealer': return `+${Math.round(value * 100)}% dealer sales`;
    case 'launder': return `+${Math.round(value * 100)}% launder eff.`;
    case 'heat': return `-${Math.round(value * 100)}% heat gain`;
    default: return `+${value}`;
  }
}
