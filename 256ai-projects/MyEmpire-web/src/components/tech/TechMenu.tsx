import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { TECH_UPGRADE_DEFS, INITIAL_TECH_UPGRADES } from '../../data/techDefs';
import { SESSION_TECH_DEFS, INITIAL_SESSION_TECH } from '../../data/sessionTechDefs';
import { RUN_TECH_UPGRADES, INITIAL_RUN_TECH } from '../../data/runTechDefs';
import type { TechUpgradeId } from '../../data/techDefs';
import type { SessionTechId } from '../../data/sessionTechDefs';
import type { RunTechId } from '../../data/runTechDefs';
import { formatMoney, formatUnits } from '../../engine/economy';
import { sound } from '../../engine/sound';
import Tooltip from '../ui/Tooltip';

type TechTab = 'permanent' | 'run' | 'session';

const TABS: { id: TechTab; label: string; icon: string; color: string; description: string }[] = [
  { id: 'permanent', label: 'Tech Lab',         icon: '🔬', color: 'cyan',  description: 'Permanent — survives prestige resets forever' },
  { id: 'run',       label: 'Run Upgrades',     icon: '🔧', color: 'amber', description: 'Persists until prestige reset' },
  { id: 'session',   label: 'Street Upgrades',  icon: '🛠️', color: 'purple', description: 'Short-term boosts — lost quickly' },
];

export default function TechMenu() {
  const showTechMenuFlag = useUIStore((s) => s.showTechMenu);
  const showRunTechMenuFlag = useUIStore((s) => s.showRunTechMenu);
  const showSessionTechMenuFlag = useUIStore((s) => s.showSessionTechMenu);
  const initialTab: TechTab = showSessionTechMenuFlag ? 'session' : showRunTechMenuFlag ? 'run' : 'permanent';
  const [activeTab, setActiveTab] = useState<TechTab>(initialTab);

  // Permanent tech state
  const techPoints = useGameStore((s) => s.techPoints ?? 0);
  const techUpgrades = useGameStore((s) => s.techUpgrades ?? INITIAL_TECH_UPGRADES);
  const totalTechPointsEarned = useGameStore((s) => s.totalTechPointsEarned ?? 0);
  const prestigeCount = useGameStore((s) => s.prestigeCount ?? 0);
  const purchaseTechUpgrade = useGameStore((s) => s.purchaseTechUpgrade);

  // Run tech state
  const runTech = useGameStore((s) => s.runTechUpgrades ?? INITIAL_RUN_TECH);
  const purchaseRunTech = useGameStore((s) => s.purchaseRunTech);

  // Session tech state
  const sessionTech = useGameStore((s) => s.sessionTechUpgrades ?? INITIAL_SESSION_TECH);
  const purchaseSessionTech = useGameStore((s) => s.purchaseSessionTech);

  // Shared state
  const dirtyCash = useGameStore((s) => s.dirtyCash);
  const cleanCash = useGameStore((s) => s.cleanCash);
  const productInventory = useGameStore((s) => s.operation.productInventory);
  const totalOz = Object.values(productInventory).reduce((s, e) => s + e.oz, 0);
  const setShowTechMenu = useUIStore((s) => s.setShowTechMenu);
  const setShowSessionTechMenu = useUIStore((s) => s.setShowSessionTechMenu);
  const setShowRunTechMenu = useUIStore((s) => s.setShowRunTechMenu);
  const addNotification = useUIStore((s) => s.addNotification);

  const currentTabDef = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{currentTabDef.icon}</span>
          <div>
            <h1 className="text-lg font-bold text-white">Upgrades</h1>
            <p className="text-[9px] text-gray-500">{currentTabDef.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right space-y-0.5">
            {activeTab === 'permanent' ? (
              <>
                <p className="text-cyan-400 font-bold text-lg">{techPoints} TP</p>
                <p className="text-gray-500 text-[10px]">{totalTechPointsEarned} lifetime | {prestigeCount} prestiges</p>
              </>
            ) : (
              <>
                <p className="text-green-400 text-[10px]">💵 {formatMoney(dirtyCash)}</p>
                {activeTab === 'session' && <p className="text-blue-400 text-[10px]">🏦 {formatMoney(cleanCash)}</p>}
                {activeTab === 'session' && <p className="text-emerald-400 text-[10px]">🌿 {formatUnits(totalOz)}</p>}
              </>
            )}
          </div>
          <button onClick={() => { setShowTechMenu(false); setShowSessionTechMenu(false); setShowRunTechMenu(false); }} className="text-gray-400 hover:text-white text-2xl leading-none px-2">&times;</button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex bg-gray-900/80 border-b border-gray-700/50">
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          const colorClasses: Record<string, string> = {
            cyan: active ? 'text-cyan-400 border-cyan-400' : 'text-gray-500 border-transparent',
            amber: active ? 'text-amber-400 border-amber-400' : 'text-gray-500 border-transparent',
            purple: active ? 'text-purple-400 border-purple-400' : 'text-gray-500 border-transparent',
          };
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-bold border-b-2 transition ${colorClasses[tab.color]} hover:text-white`}
            >
              {tab.icon} {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-5xl mx-auto">

          {/* ── PERMANENT TECH ── */}
          {activeTab === 'permanent' && TECH_UPGRADE_DEFS.map((def) => {
            const level = techUpgrades[def.id] ?? 0;
            const isMaxed = level >= def.maxLevel;
            const nextCost = isMaxed ? 0 : def.costs[level];
            const canAfford = techPoints >= nextCost;
            const currentBonus = def.bonusPerLevel && level > 0
              ? (def.bonusPerLevel as number[])[level - 1] ?? 0
              : level * def.effectPerLevel;
            return (
              <TechCard
                key={def.id}
                icon={def.icon}
                name={def.name}
                description={def.description}
                level={level}
                maxLevel={def.maxLevel}
                isMaxed={isMaxed}
                canAfford={canAfford}
                bonusText={level > 0 ? formatBonus(def.bonusType, currentBonus) : 'Not unlocked'}
                nextText={!isMaxed ? `Next: ${def.effectLabel}` : undefined}
                buttonLabel={`Upgrade · ${nextCost} TP`}
                onUpgrade={() => { purchaseTechUpgrade(def.id as TechUpgradeId); sound.play('upgrade'); }}
                dotColor="bg-cyan-400 border-cyan-500"
                bonusColor="text-cyan-300"
                buttonColor="bg-cyan-700 hover:bg-cyan-600"
              />
            );
          })}

          {/* ── RUN TECH ── */}
          {activeTab === 'run' && RUN_TECH_UPGRADES.map((def) => {
            const level = runTech[def.id] ?? 0;
            const isMaxed = level >= def.maxLevel;
            const nextCost = isMaxed ? 0 : def.costs[level];
            const canAfford = dirtyCash >= nextCost;
            const currentBonus = level * def.bonusPerLevel;
            return (
              <TechCard
                key={def.id}
                icon={def.icon}
                name={def.name}
                description={def.description}
                level={level}
                maxLevel={def.maxLevel}
                isMaxed={isMaxed}
                canAfford={canAfford}
                bonusText={level > 0 ? formatRunBonus(def.bonusType, currentBonus) : 'Not unlocked'}
                nextText={!isMaxed ? `Next: +${def.bonusPerLevel}${def.bonusType === 'demand' ? ' oz' : '%'}` : undefined}
                buttonLabel={`Upgrade · ${formatMoney(nextCost)}`}
                onUpgrade={() => {
                  if (purchaseRunTech(def.id as RunTechId)) { sound.play('upgrade'); addNotification(`${def.name} upgraded!`, 'success'); }
                  else addNotification('Not enough dirty cash', 'warning');
                }}
                dotColor="bg-amber-400 border-amber-500"
                bonusColor="text-amber-300"
                buttonColor="bg-amber-700 hover:bg-amber-600"
              />
            );
          })}

          {/* ── SESSION TECH ── */}
          {activeTab === 'session' && SESSION_TECH_DEFS.map((def) => {
            const level = sessionTech[def.id] ?? 0;
            const isMaxed = level >= def.maxLevel;
            const nextCost = isMaxed ? null : def.costs[level];
            const canAfford = nextCost
              ? dirtyCash >= nextCost.dirtyCash && cleanCash >= nextCost.cleanCash && totalOz >= nextCost.productOz
              : false;
            const currentBonus = level * def.effectPerLevel;
            return (
              <div key={def.id} className="bg-gray-800/80 rounded-xl border border-gray-700/60 p-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{def.icon}</span>
                  <div>
                    <p className="text-white font-semibold text-sm leading-tight">{def.name}</p>
                    <p className="text-gray-500 text-[10px] leading-tight">{def.description}</p>
                  </div>
                </div>
                {def.maxLevel <= 10 ? (
                  <div className="flex gap-1">
                    {Array.from({ length: def.maxLevel }).map((_, i) => (
                      <div key={i} className={`w-3 h-3 rounded-full border ${i < level ? 'bg-purple-400 border-purple-500' : 'bg-gray-700 border-gray-600'}`} />
                    ))}
                  </div>
                ) : (
                  <p className="text-purple-400 text-xs font-bold">Level {level}</p>
                )}
                <p className="text-purple-300 text-xs font-mono">
                  {level > 0 ? formatSessionBonus(def.bonusType, currentBonus) : 'Not unlocked'}
                </p>
                {!isMaxed && nextCost && (
                  <div className="flex flex-wrap gap-1.5 text-[9px]">
                    <span className={dirtyCash >= nextCost.dirtyCash ? 'text-green-400' : 'text-red-400'}>💵 {formatMoney(nextCost.dirtyCash)}</span>
                    <span className={cleanCash >= nextCost.cleanCash ? 'text-blue-400' : 'text-red-400'}>🏦 {formatMoney(nextCost.cleanCash)}</span>
                    <span className={totalOz >= nextCost.productOz ? 'text-emerald-400' : 'text-red-400'}>🌿 {formatUnits(nextCost.productOz)}</span>
                  </div>
                )}
                {isMaxed ? (
                  <div className="text-center text-[10px] text-yellow-500 font-bold py-1.5">MAX</div>
                ) : (
                  <button
                    onClick={() => {
                      if (purchaseSessionTech(def.id as SessionTechId)) { sound.play('upgrade'); addNotification(`${def.name} upgraded!`, 'success'); }
                      else addNotification('Not enough resources', 'warning');
                    }}
                    disabled={!canAfford}
                    className={`w-full py-1.5 rounded-lg text-xs font-bold transition ${canAfford ? 'bg-purple-700 hover:bg-purple-600 text-white' : 'bg-gray-700 text-white cursor-not-allowed'}`}
                  >
                    Upgrade
                  </button>
                )}
                {!isMaxed && <p className="text-gray-500 text-[10px] text-center">Next: {def.effectLabel}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Reusable card for permanent + run tech ──

function TechCard({ icon, name, description, level, maxLevel, isMaxed, canAfford, bonusText, nextText, buttonLabel, onUpgrade, dotColor, bonusColor, buttonColor }: {
  icon: string; name: string; description: string; level: number; maxLevel: number;
  isMaxed: boolean; canAfford: boolean; bonusText: string; nextText?: string;
  buttonLabel: string; onUpgrade: () => void;
  dotColor: string; bonusColor: string; buttonColor: string;
}) {
  return (
    <div className="bg-gray-800/80 rounded-xl border border-gray-700/60 p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">{name}</p>
          <p className="text-gray-500 text-[10px] leading-tight">{description}</p>
        </div>
      </div>
      {maxLevel <= 10 ? (
        <div className="flex gap-1">
          {Array.from({ length: maxLevel }).map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full border ${i < level ? dotColor : 'bg-gray-700 border-gray-600'}`} />
          ))}
        </div>
      ) : (
        <p className={`${bonusColor} text-xs font-bold`}>Level {level}</p>
      )}
      <p className={`${bonusColor} text-xs font-mono`}>{bonusText}</p>
      {isMaxed ? (
        <div className="text-center text-[10px] text-yellow-500 font-bold py-1.5">MAX</div>
      ) : (
        <button
          onClick={onUpgrade}
          disabled={!canAfford}
          className={`w-full py-1.5 rounded-lg text-xs font-bold transition ${canAfford ? `${buttonColor} text-white` : 'bg-gray-700 text-white cursor-not-allowed'}`}
        >
          {buttonLabel}
        </button>
      )}
      {nextText && <p className="text-gray-500 text-[10px] text-center">{nextText}</p>}
    </div>
  );
}

// ── Format helpers ──

function formatBonus(bonusType: string, value: number): string {
  switch (bonusType) {
    case 'yield': return `+${Math.round(value * 100)}% yield`;
    case 'speed': return `-${Math.round(value * 100)}% grow time`;
    case 'double': return `+${Math.round(value * 100)}% double chance`;
    case 'capacity': return `+${value} plants/room`;
    case 'dealer': return `+${Math.round(value * 100)}% dealer sales`;
    case 'launder': return `+${Math.round(value * 100)}% launder eff.`;
    case 'heat': return `-${Math.round(value * 100)}% heat gain`;
    case 'price': return `+${Math.round(value * 100)}% sell price`;
    case 'demand': return `+${Math.round(value)} oz street demand`;
    case 'flora_gro': return `+${Math.round(value * 100)}% grow speed`;
    case 'flora_micro': return `+${Math.round(value * 100)}% yield`;
    case 'flora_bloom': return `+${Math.round(value * 100)}% double chance`;
    case 'water': return `+${Math.round(value * 100)}% grow speed`;
    case 'light': return `+${Math.round(value * 100)}% grow speed`;
    case 'start_dirty': return `+$${value.toLocaleString()} dirty cash`;
    case 'start_clean': return `+$${value.toLocaleString()} clean cash`;
    case 'start_seeds': return `+${value.toLocaleString()} seeds`;
    case 'crew_attack': return `+${value} crew attack`;
    case 'crew_defense': return `+${value} crew defense`;
    case 'crew_discount': return `-$${value.toLocaleString()} crew cost`;
    default: return `+${value}`;
  }
}

function formatRunBonus(bonusType: string, value: number): string {
  switch (bonusType) {
    case 'yield': return `+${Math.round(value * 100)}% yield`;
    case 'speed': return `-${Math.round(value * 100)}% grow time`;
    case 'auto_speed': return `-${Math.round(value * 100)}% grow time`;
    case 'double': return `+${Math.round(value * 100)}% double chance`;
    case 'harvest_size': return `+${Math.round(value * 100)}% harvest size`;
    case 'dealer': return `+${Math.round(value * 100)}% dealer sales`;
    case 'dealer_cut': return `-${Math.round(value * 100)}% dealer cut`;
    case 'launder': return `+${Math.round(value * 100)}% launder eff.`;
    case 'heat': return `-${Math.round(value * 100)}% heat gain`;
    case 'price': return `+${Math.round(value * 100)}% sell price`;
    case 'demand': return `+${Math.round(value)} oz street demand`;
    case 'seeds': return `-${Math.round(value * 100)}% seed cost`;
    case 'biz_income': return `+${Math.round(value * 100)}% business income`;
    case 'biz_capacity': return `+${Math.round(value * 100)}% launder capacity`;
    case 'lot_discount': return `-${Math.round(value * 100)}% lot cost`;
    case 'lawyer_power': return `+${Math.round(value * 100)}% lawyer power`;
    case 'crew_atk': return `+${Math.round(value * 100)}% crew attack`;
    case 'crew_def': return `+${Math.round(value * 100)}% crew defense`;
    case 'crew_cost': return `-${Math.round(value * 100)}% crew cost`;
    case 'rival_weak': return `+${Math.round(value * 100)}% weakness dealt`;
    case 'casino_luck': return `+${Math.round(value * 100)}% casino odds`;
    case 'jewelry_value': return `+${Math.round(value * 100)}% jewelry value`;
    case 'car_boost': return `+${Math.round(value * 100)}% car bonuses`;
    case 'xp_boost': return `+${Math.round(value * 100)}% score bonus`;
    default: return `+${value}`;
  }
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
    case 'flora_gro': return `+${Math.round(value * 100)}% grow speed`;
    case 'flora_micro': return `+${Math.round(value * 100)}% yield`;
    case 'flora_bloom': return `+${Math.round(value * 100)}% double chance`;
    case 'water': return `+${Math.round(value * 100)}% grow speed`;
    case 'light': return `+${Math.round(value * 100)}% grow speed`;
    default: return `+${value}`;
  }
}
