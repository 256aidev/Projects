import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { GROW_ROOM_TYPE_DEFS, DEALER_TIERS, ROOM_UPGRADE_DEFS, INITIAL_OPERATION, getStrainUnlockCost, getDealerHireCost } from '../../data/types';
import { getRoomBonus, getRoomCycleCost, getMaxStreetDemand, getStreetRefillRate } from '../../engine/economy';
import { formatMoney, formatUnits } from '../../engine/economy';
import { JOB_MAP } from '../../data/types';
import { sound } from '../../engine/sound';
import { getCarBonuses } from '../../data/carDefs';
import CannabisLeaf from '../ui/CannabisLeaf';
import Tooltip from '../ui/Tooltip';

/** Seed warning: yellow blink ≤25, red blink ≤10, fast red blink at 0 */
function seedWarningClass(seeds: number): string {
  if (seeds === 0) return 'text-red-500 animate-[blink_0.3s_ease-in-out_infinite]';
  if (seeds <= 10) return 'text-red-400 animate-[blink_0.8s_ease-in-out_infinite]';
  if (seeds <= 25) return 'text-yellow-400 animate-[blink_1.2s_ease-in-out_infinite]';
  return 'text-gray-400';
}

function seedPrice(qty: number): number {
  const base = INITIAL_OPERATION.seedCostPerUnit;
  const discount = qty >= 30000 ? 3 : qty >= 20000 ? 2 : qty >= 10000 ? 1 : 0;
  return base - discount;
}

export default function OperationView() {
  const op = useGameStore((s) => s.operation);
  const dirtyCash = useGameStore((s) => s.dirtyCash);
  const cleanCash = useGameStore((s) => s.cleanCash);
  const harvestGrowRoom = useGameStore((s) => s.harvestGrowRoom);
  const buyGrowRoom = useGameStore((s) => s.buyGrowRoom);
  const upgradeRoom = useGameStore((s) => s.upgradeRoom);
  const buyRoomUpgrade = useGameStore((s) => s.buyRoomUpgrade);
  const hireDealers = useGameStore((s) => s.hireDealers);
  const fireDealers = useGameStore((s) => s.fireDealers);
  const upgradeDealerTier = useGameStore((s) => s.upgradeDealerTier);
  const downgradeDealerTier = useGameStore((s) => s.downgradeDealerTier);
  const buySeed = useGameStore((s) => s.buySeed);
  const plantSeeds = useGameStore((s) => s.plantSeeds);
  const sellProduct = useGameStore((s) => s.sellProduct);
  const streetSellQuotaOz = useGameStore((s) => s.streetSellQuotaOz ?? 160);
  const currentJobId = useGameStore((s) => s.currentJobId);
  const businesses = useGameStore((s) => s.businesses);
  const cars = useGameStore((s) => s.cars ?? []);
  const currentJobDef = currentJobId ? JOB_MAP[currentJobId] ?? null : null;
  const carBonuses = getCarBonuses(cars);
  const maxDemandOz = getMaxStreetDemand(currentJobDef, businesses, carBonuses.streetDemand);
  const refillRate = getStreetRefillRate(maxDemandOz);
  const prestigeBonus = useGameStore((s) => s.prestigeBonus ?? 0);
  const addNotification = useUIStore((s) => s.addNotification);

  const currentDealerTier = DEALER_TIERS[op.dealerTierIndex];
  const nextDealerTier = DEALER_TIERS[op.dealerTierIndex + 1];
  // Per-strain inventory helpers
  const invEntries = Object.entries(op.productInventory);
  const totalInventoryOz = invEntries.reduce((sum, [, e]) => sum + e.oz, 0);
  const weightedAvgPrice = totalInventoryOz > 0
    ? invEntries.reduce((sum, [, e]) => sum + e.oz * e.pricePerUnit, 0) / totalInventoryOz
    : 10;
  const dealerSalesRate = currentDealerTier.salesRatePerTick * op.dealerCount;
  const dealerCutPerTick = dealerSalesRate * (currentDealerTier.cutPer8oz / 8);
  const dealerIncome = Math.max(0, dealerSalesRate * weightedAvgPrice - dealerCutPerTick);

  // Which room types are already owned
  const ownedTypeIds = new Set(op.growRooms.map((r) => r.typeId));

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── STICKY TOP — Product Inventory ── */}
      <div className="flex-shrink-0 bg-gray-950 border-b border-green-900/40 px-4 pt-3 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-green-400 font-semibold text-sm">Product Inventory</h3>
            <p className="text-gray-400 text-xs">{formatUnits(totalInventoryOz)} total · avg ${weightedAvgPrice.toFixed(0)}/oz</p>
          </div>
          <CannabisLeaf size={28} />
        </div>
        {/* Per-strain stash breakdown */}
        {invEntries.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {invEntries.filter(([, e]) => e.oz > 0).map(([strainName, entry]) => (
              <div key={strainName} className="bg-gray-800/70 rounded-lg px-2 py-1 flex items-center gap-1.5">
                <span className="text-green-400 text-[10px] font-semibold">{strainName}</span>
                <span className="text-gray-400 text-[10px]">{formatUnits(entry.oz)}</span>
                <span className="text-yellow-500 text-[10px]">${entry.pricePerUnit}/oz</span>
              </div>
            ))}
          </div>
        )}

        {/* Street sell quota bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-gray-500 text-[10px]">Street demand</span>
            <span className="text-gray-400 text-[10px] font-semibold">
              {formatUnits(streetSellQuotaOz)} / {formatUnits(maxDemandOz)} · +{formatUnits(Math.round(refillRate * 60))}/min
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${streetSellQuotaOz < 32 ? 'bg-orange-500' : 'bg-green-600'}`}
              style={{ width: `${(streetSellQuotaOz / maxDemandOz) * 100}%` }}
            />
          </div>
        </div>

        {totalInventoryOz > 0 && streetSellQuotaOz > 0 ? (
          <div className="flex gap-2">
            {([16, maxDemandOz] as const).map((qty) => {
              const units = Math.min(qty, Math.floor(totalInventoryOz), Math.floor(streetSellQuotaOz));
              const earned = Math.floor(units * weightedAvgPrice * 0.7);
              const label = qty === 16 ? '1lb' : 'All';
              const canSell = units > 0;
              return (
                <Tooltip key={qty} text={qty === 16 ? "Sell 1lb on the street at 70% avg price. Limited by street demand." : "Sell all available product on the street at 70% avg price."}>
                <button
                  data-tutorial={qty === 16 ? 'sell-btn' : undefined}
                  onClick={() => {
                    const cash = sellProduct(units);
                    if (cash > 0) { sound.play('sell'); addNotification(`Sold ${formatUnits(units)} for ${formatMoney(cash)} 💵`, 'success'); }
                    else addNotification('Street demand exhausted — use dealers!', 'warning');
                  }}
                  disabled={!canSell}
                  className={`flex-1 py-2 rounded-lg border border-white/30 text-xs font-semibold transition ${canSell ? 'bg-green-800 hover:bg-green-700 text-green-200' : 'bg-gray-800 text-white cursor-not-allowed'}`}
                >
                  Sell {label}<br />
                  <span className={canSell ? 'text-green-400' : 'text-gray-600'}>{formatMoney(earned)}</span>
                </button>
                </Tooltip>
              );
            })}
          </div>
        ) : totalInventoryOz > 0 ? (
          <p className="text-orange-500 text-xs text-center py-1 font-semibold">Street demand exhausted — use dealers or wait</p>
        ) : (
          <p className="text-gray-600 text-xs text-center py-1">No product — grow some weed first</p>
        )}
        <p className="text-gray-600 text-[10px] mt-1.5 text-center">Street sell = 70% avg price · max 10 lbs per window · dealer network has no limit</p>
      </div>

      {/* ── STICKY SECOND — Seeds + Dealer Network ── */}
      <div className="flex-shrink-0 bg-gray-950 border-b border-gray-800 px-4 py-2 flex gap-3">

        {/* Seeds */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-white font-semibold text-xs">Seeds <span className={`font-normal ${seedWarningClass(op.seedStock)}`}>{op.seedStock} in stock · {formatMoney(INITIAL_OPERATION.seedCostPerUnit)}/seed</span></p>
            <span className="text-lg">🌱</span>
          </div>
          <SeedButtons buySeed={buySeed} dirtyCash={dirtyCash} addNotification={addNotification} />
        </div>

        <div className="w-px bg-gray-700 self-stretch" />

        {/* Dealer Network */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-white font-semibold text-xs">Dealer Network <span className="text-gray-400 font-normal">{currentDealerTier.name} · {op.dealerCount} dealers{op.dealerCount > 0 && <span className="text-green-400"> · {formatMoney(dealerIncome)} net/tick</span>}</span></p>
            <span className="text-lg">🤝</span>
          </div>
          <p className="text-gray-600 text-[9px] mb-1">Avg ${weightedAvgPrice.toFixed(0)}/oz · dealer cut ${currentDealerTier.cutPer8oz} flat per 8oz sold</p>
          <div className="flex gap-1.5 mb-1">
            {[1, 3, 5].map((qty) => {
              let cost = 0;
              for (let i = 0; i < qty; i++) cost += getDealerHireCost(currentDealerTier, op.dealerCount + i);
              const canAfford = dirtyCash >= cost;
              return (
                <Tooltip key={qty} text={`Hire ${qty} dealer${qty > 1 ? 's' : ''} to sell product automatically. No street demand limit.`}>
                <button
                  onClick={() => {
                    if (hireDealers(qty)) { sound.play('dealer_hire'); addNotification(`Hired ${qty} dealer${qty > 1 ? 's' : ''}`, 'success'); }
                    else addNotification(`Need ${formatMoney(cost)} dirty cash`, 'warning');
                  }}
                  disabled={!canAfford}
                  className={`flex-1 py-1.5 rounded border border-white/30 text-[10px] font-semibold transition ${
                    canAfford ? 'bg-indigo-800 hover:bg-indigo-700 text-indigo-200' : 'bg-gray-700 text-white cursor-not-allowed'
                  }`}
                >
                  +{qty} ({formatMoney(cost)})
                </button>
                </Tooltip>
              );
            })}
            {op.dealerCount > 0 && [1, 3, 5].map((qty) => {
              const canFire = op.dealerCount >= qty;
              return (
                <Tooltip key={`fire-${qty}`} text={`Fire ${qty} dealer${qty > 1 ? 's' : ''}. No refund on hiring cost.`}>
                <button
                  onClick={() => { fireDealers(qty); sound.play('fire'); addNotification(`Fired ${qty} dealer${qty > 1 ? 's' : ''} (no refund)`, 'warning'); }}
                  disabled={!canFire}
                  className={`flex-1 py-1.5 rounded border border-white/30 text-[9px] font-semibold transition ${
                    canFire ? 'bg-red-900/60 hover:bg-red-800/70 text-red-300' : 'bg-gray-700 text-white cursor-not-allowed'
                  }`}
                >
                  −{qty} Fire
                </button>
                </Tooltip>
              );
            })}
          </div>
          <div className="flex gap-1.5">
            {/* Downgrade */}
            {(() => {
              const prevTier = DEALER_TIERS[op.dealerTierIndex - 1];
              const currentTier = DEALER_TIERS[op.dealerTierIndex];
              const refund = prevTier ? Math.floor(currentTier.hireCost * 3 * 0.5) : 0;
              return prevTier ? (
                <Tooltip text={`Downgrade dealers to ${prevTier.name}. Slower sales but lower cut. 50% refund.`}>
                <button
                  onClick={() => {
                    if (downgradeDealerTier()) { sound.play('fire'); addNotification(`Downgraded to ${prevTier.name} (+${formatMoney(refund)} refund)`, 'warning'); }
                  }}
                  className="flex-1 py-1.5 rounded border border-white/30 text-[9px] font-semibold transition bg-red-900/60 hover:bg-red-800/70 text-red-300"
                >
                  ▼ {prevTier.name}<br />
                  <span className="font-normal opacity-75">
                    {prevTier.salesRatePerTick} oz/tick · ${prevTier.cutPer8oz} cut/8oz<br />+{formatMoney(refund)} refund
                  </span>
                </button>
                </Tooltip>
              ) : null;
            })()}
            {/* Upgrade */}
            {nextDealerTier && (() => {
              const canUpgrade = dirtyCash >= nextDealerTier.hireCost * 3;
              return (
                <Tooltip text={`Upgrade all dealers to ${nextDealerTier.name}. Faster sales but higher cut per 8oz.`}>
                <button
                  onClick={() => {
                    if (upgradeDealerTier()) { sound.play('upgrade'); addNotification(`Upgraded to ${nextDealerTier.name}!`, 'success'); }
                    else addNotification(`Need ${formatMoney(nextDealerTier.hireCost * 3)} dirty cash`, 'warning');
                  }}
                  disabled={!canUpgrade}
                  className={`flex-1 py-1.5 rounded border border-white/30 text-[9px] font-semibold transition ${
                    canUpgrade ? 'bg-purple-800 hover:bg-purple-700 text-purple-200' : 'bg-gray-700 text-white cursor-not-allowed'
                  }`}
                >
                  ▲ {nextDealerTier.name} — {formatMoney(nextDealerTier.hireCost * 3)} 💵<br />
                  <span className="font-normal opacity-75">
                    {nextDealerTier.salesRatePerTick} oz/tick · ${nextDealerTier.cutPer8oz} cut/8oz · base ${formatMoney(nextDealerTier.hireCost)}/ea
                  </span>
                </button>
                </Tooltip>
              );
            })()}
          </div>
        </div>

      </div>

      {/* ── SCROLLABLE BODY ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

      {/* Grow Rooms */}
      <section>
        <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-2 px-1">Grow Rooms · 🌱 <span className={seedWarningClass(op.seedStock)}>{op.seedStock} seeds</span></h3>
        <div className="flex flex-col gap-4">
          {op.growRooms.map((room) => {
            const def = GROW_ROOM_TYPE_DEFS.find((d) => d.id === room.typeId);
            const nextSlotIndex = room.upgradeLevel + 1;
            const hasNextSlot = def && nextSlotIndex < def.strainSlots.length && def.strainUnlockBase > 0;
            const nextUpgradeCost = hasNextSlot ? getStrainUnlockCost(def, nextSlotIndex) : 0;
            const canUpgrade = hasNextSlot && dirtyCash >= nextUpgradeCost;
            const isMaxLevel = !hasNextSlot;

            const totalYieldBonus = getRoomBonus(room, 'yield');
            const maintenancePerCycle = getRoomCycleCost(room);
            const upgMult = def?.upgradeCostMultiplier ?? 1;

            const isLegalRoom = def?.isLegal;
            return (
              <div key={room.id} className={`bg-gray-800/60 border rounded-lg overflow-hidden ${isLegalRoom ? 'border-yellow-600/50' : 'border-gray-700'}`}>
                {/* Room header — single compact line */}
                <div className={`flex items-center justify-between px-2 py-1 border-b ${isLegalRoom ? 'bg-yellow-900/20 border-yellow-700/40' : 'bg-gray-900/50 border-gray-700'}`}>
                  <p className={`font-bold text-xs ${isLegalRoom ? 'text-yellow-300' : 'text-white'}`}>
                    {room.name} {isLegalRoom ? '👑' : ''} <span className="text-gray-500 font-normal text-[10px]">{room.slots.length} strain{room.slots.length > 1 ? 's' : ''} · +{Math.round(totalYieldBonus * 100)}% yield · <span className="text-red-400">{formatMoney(maintenancePerCycle)}/cyc</span></span>
                  </p>
                  {isMaxLevel ? (
                    <span className="text-yellow-500 text-[9px] font-bold px-1.5 py-0.5 bg-yellow-900/30 rounded">MAX</span>
                  ) : (
                    <Tooltip text="Unlock a new strain slot.">
                    <button
                      onClick={() => {
                        if (upgradeRoom(room.id)) {
                          sound.play('upgrade');
                          addNotification(`Unlocked ${def?.strainSlots[room.upgradeLevel + 1]?.strainName} slot!`, 'success');
                        } else {
                          addNotification(`Need ${formatMoney(nextUpgradeCost)} dirty cash`, 'warning');
                        }
                      }}
                      disabled={!canUpgrade}
                      className={`text-[9px] px-1.5 py-0.5 rounded border border-white/30 font-semibold transition ${
                        canUpgrade ? 'bg-purple-700 hover:bg-purple-600 text-white' : 'bg-gray-700 text-white cursor-not-allowed'
                      }`}
                    >
                      + Slot · {formatMoney(nextUpgradeCost)}
                    </button>
                    </Tooltip>
                  )}
                </div>

                {/* Body: grow slots 50% | upgrades 50% */}
                <div className="flex">
                  {/* LEFT — Strain slots in 2-column grid */}
                  <div className="w-1/2 p-1.5 grid grid-cols-2 gap-1 border-r border-gray-700/50">
                    {room.slots.map((slot, slotIndex) => {
                      const progress = slot.isHarvesting && slot.growTimerTicks > 0
                        ? 1 - slot.ticksRemaining / slot.growTimerTicks
                        : slot.isHarvesting ? 1 : 0;
                      const ready = slot.isHarvesting && slot.ticksRemaining === 0;
                      const idle = !slot.isHarvesting;
                      const yieldBonus = getRoomBonus(room, 'yield') + prestigeBonus;
                      const effectiveYield = Math.floor(slot.harvestYield * (1 + yieldBonus));

                      return (
                        <div key={slotIndex} className="bg-gray-900/50 rounded p-1 flex flex-col">
                          <div className="flex items-center justify-between">
                            <p className="text-green-400 font-semibold text-[9px] truncate">{slot.strainName}</p>
                            <span className="text-[9px] ml-0.5">{ready ? <CannabisLeaf size={12} /> : idle ? '💤' : '🌱'}</span>
                          </div>
                          <p className="text-white text-[8px]">${slot.pricePerUnit}/oz · {formatUnits(effectiveYield)}</p>
                          <div className="w-full h-0.5 bg-gray-700 rounded-full overflow-hidden my-0.5">
                            <div className="h-full rounded-full transition-all" style={{ width: `${progress * 100}%`, backgroundColor: ready ? '#22c55e' : '#65a30d' }} />
                          </div>
                          {ready ? (
                            <button data-tutorial="harvest-btn" onClick={() => { const u = harvestGrowRoom(room.id, slotIndex); if (u > 0) { sound.play('harvest'); addNotification(`Harvested ${formatUnits(u)} ${slot.strainName}!`, 'success'); } }}
                              className="w-full py-0.5 rounded bg-green-600 hover:bg-green-500 text-white text-[8px] font-bold transition">
                              Harvest
                            </button>
                          ) : idle ? (
                            <button data-tutorial="plant-btn" onClick={() => { if (plantSeeds(room.id, slotIndex)) { sound.play('plant'); addNotification(`Planted!`, 'success'); } else addNotification('No seeds', 'warning'); }}
                              disabled={op.seedStock < 1}
                              className={`w-full py-0.5 rounded text-[8px] font-semibold transition ${op.seedStock > 0 ? 'bg-lime-700 hover:bg-lime-600 text-lime-100' : 'bg-gray-700 text-white cursor-not-allowed'}`}>
                              Plant
                            </button>
                          ) : (
                            <p className="text-center text-white text-[8px]">{slot.ticksRemaining}s</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* RIGHT 2/3 — Upgrades in 3×2 grid, wider & more descriptive */}
                  {/* RIGHT — Upgrades 3×2 grid */}
                  <div className="w-1/2 p-1.5 grid grid-cols-3 grid-rows-2 gap-1">
                    {ROOM_UPGRADE_DEFS.map((upgDef) => {
                      const level = room.upgradeLevels?.[upgDef.id] ?? 0;
                      const roomCap = def?.maxUpgradeLevels?.[upgDef.id] ?? upgDef.levels.length;
                      const cappedMaxLevel = Math.min(upgDef.levels.length, roomCap);
                      const atCap = level >= cappedMaxLevel;
                      const currentLvl = level > 0 ? upgDef.levels[level - 1] : null;
                      const nextLvl = !atCap ? upgDef.levels[level] : undefined;
                      const scaledCost = nextLvl ? nextLvl.cost * upgMult : 0;
                      const canAfford = nextLvl && dirtyCash >= scaledCost;
                      const isToggle = upgDef.bonusType === 'toggle';
                      const isActive = isToggle && level > 0;

                      const bonusDesc = upgDef.bonusType === 'speed' ? 'grow time'
                        : upgDef.bonusType === 'yield' ? 'yield'
                        : upgDef.bonusType === 'double' ? '2× chance'
                        : 'auto';

                      const currentBonusText = currentLvl
                        ? (upgDef.bonusType === 'speed' ? `-${Math.round(currentLvl.speedBonus * 100)}% time`
                          : upgDef.bonusType === 'yield' ? `+${Math.round(currentLvl.yieldBonus * 100)}% yield`
                          : upgDef.bonusType === 'double' ? `${Math.round(currentLvl.doubleChance * 100)}% 2× chance`
                          : null)
                        : null;

                      const nextBonusText = nextLvl
                        ? (upgDef.bonusType === 'speed' ? `-${Math.round(nextLvl.speedBonus * 100)}% time`
                          : upgDef.bonusType === 'yield' ? `+${Math.round(nextLvl.yieldBonus * 100)}% yield`
                          : upgDef.bonusType === 'double' ? `${Math.round(nextLvl.doubleChance * 100)}% 2× chance`
                          : 'Enable')
                        : null;

                      // Room doesn't support this upgrade at all (cap=0, not a toggle)
                      if (cappedMaxLevel === 0 && !isToggle) {
                        return (
                          <Tooltip key={upgDef.id} text={`${upgDef.name} is not available for ${room.name}. Upgrade to a bigger room to unlock.`}>
                          <div className="flex flex-col items-center justify-center p-1.5 rounded-lg border border-gray-800 bg-gray-900/30">
                            <span className="text-[10px] font-bold text-white">{upgDef.icon} {upgDef.name}</span>
                            <span className="text-[9px] text-white mt-1">—</span>
                          </div>
                          </Tooltip>
                        );
                      }

                      return (
                        <Tooltip key={upgDef.id} text={`${upgDef.name}: ${upgDef.bonusType === 'speed' ? 'Reduces grow timer' : upgDef.bonusType === 'yield' ? 'Increases harvest yield' : upgDef.bonusType === 'double' ? 'Chance for double harvest' : 'Auto harvest & replant when ready'}${cappedMaxLevel > 0 ? ` (${cappedMaxLevel} level${cappedMaxLevel > 1 ? 's' : ''} max in ${room.name})` : ''}`}>
                        <div className={`flex flex-col justify-between p-1.5 rounded-lg border ${level > 0 ? `border-opacity-40 ${upgDef.bgColor}` : upgDef.borderColor}`}>
                          {/* Header: icon, name, level dots */}
                          <div className="flex items-center justify-between mb-0.5">
                            <span className={`text-[10px] font-bold ${upgDef.color}`}>{upgDef.icon} {upgDef.name}</span>
                            {!isToggle && cappedMaxLevel > 0 && (
                              <div className="flex gap-0.5">
                                {Array.from({ length: cappedMaxLevel }).map((_, i) => (
                                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < level ? upgDef.color.replace('text-', 'bg-') : 'bg-gray-700'}`} />
                                ))}
                              </div>
                            )}
                          </div>
                          {/* Current status */}
                          <p className={`text-[9px] ${upgDef.color} font-semibold`}>
                            {isToggle
                              ? (isActive ? null : <span className="text-white">{bonusDesc}</span>)
                              : currentLvl
                                ? <>{currentLvl.name} · {currentBonusText}</>
                                : <span className="text-white">Not installed</span>}
                          </p>
                          {/* Action */}
                          {isActive ? (
                            <span className="text-[10px] text-green-400 font-bold text-center">ACTIVE ✓</span>
                          ) : nextLvl ? (
                            <button
                              onClick={() => {
                                if (buyRoomUpgrade(room.id, upgDef.id)) { sound.play('upgrade'); addNotification(`${nextLvl.name} installed!`, 'success'); }
                                else addNotification(`Need ${formatMoney(scaledCost)}`, 'warning');
                              }}
                              disabled={!canAfford}
                              className={`w-full py-0.5 rounded border border-white/20 text-[9px] font-semibold transition mt-0.5 ${canAfford ? `${upgDef.bgColor} hover:opacity-80 ${upgDef.color}` : 'bg-gray-700 text-white cursor-not-allowed'}`}
                            >
                              {nextBonusText} · {nextLvl.name} · {formatMoney(scaledCost)}
                              {nextLvl.costPerCycle > 0 && <span className="text-red-300"> · ${nextLvl.costPerCycle}/cyc</span>}
                            </button>
                          ) : (
                            <span className={`text-[10px] ${upgDef.color} font-bold text-center`}>MAX ✓</span>
                          )}
                        </div>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Buy new room buttons */}
          {GROW_ROOM_TYPE_DEFS.filter((def) => def.id !== 'closet' && !ownedTypeIds.has(def.id)).map((def) => {
            const useClean = def.purchaseCurrency === 'clean';
            const canAfford = useClean ? cleanCash >= def.purchaseCost : dirtyCash >= def.purchaseCost;
            const isLegal = def.isLegal;
            return (
              <Tooltip key={def.id} text={`Build a new grow room with unique strains. ${isLegal ? 'Legal operation — product sells for clean cash.' : ''}`}>
              <button
                onClick={() => {
                  if (buyGrowRoom(def.id)) {
                    sound.play('buy');
                    addNotification(`Built ${def.name}!`, 'success');
                  } else {
                    addNotification(`Need ${formatMoney(def.purchaseCost)} ${useClean ? 'clean' : 'dirty'} cash`, 'warning');
                  }
                }}
                disabled={!canAfford}
                className={`border-2 border-dashed rounded-xl p-4 text-center transition ${
                  canAfford
                    ? isLegal
                      ? 'border-yellow-500/50 hover:border-yellow-400 bg-yellow-900/10'
                      : 'border-green-600/50 hover:border-green-500 bg-green-900/10'
                    : 'border-gray-700 opacity-40 cursor-not-allowed'
                }`}
              >
                <p className={`text-lg mb-1 ${isLegal ? 'text-yellow-400' : 'text-green-400'}`}>+</p>
                <p className="text-white text-sm font-semibold">{def.name}</p>
                <p className="text-gray-400 text-xs mt-0.5">
                  Starts with {def.strainSlots[0].strainName} · up to {def.strainSlots.length} strains
                </p>
                <p className={`text-sm font-bold mt-1 ${isLegal ? 'text-yellow-300' : 'text-yellow-400'}`}>
                  {formatMoney(def.purchaseCost)} {useClean ? '🏦' : '💵'}
                </p>
                {isLegal && <p className="text-yellow-500/70 text-[10px] mt-0.5">Legal Operation</p>}
              </button>
              </Tooltip>
            );
          })}
        </div>
      </section>

      </div>{/* end scrollable body */}
    </div>
  );
}

function SeedButtons({ buySeed, dirtyCash, addNotification }: {
  buySeed: (qty: number) => boolean;
  dirtyCash: number;
  addNotification: (msg: string, type: 'success' | 'warning' | 'error') => void;
}) {
  const [customQty, setCustomQty] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const handleBuy = (qty: number) => {
    const price = seedPrice(qty);
    const cost = price * qty;
    if (buySeed(qty)) {
      sound.play('buy');
      const saved = (INITIAL_OPERATION.seedCostPerUnit - price) * qty;
      addNotification(`Bought ${qty >= 1000 ? `${qty / 1000}k` : qty} seeds${saved > 0 ? ` (saved ${formatMoney(saved)})` : ''}`, 'success');
    } else {
      addNotification(`Need ${formatMoney(cost)} dirty cash`, 'warning');
    }
  };

  const fmtQty = (qty: number) => qty >= 1000 ? `${qty / 1000}k` : String(qty);

  const rows = [
    [1, 2, 10],
    [50, 1000, 10000],
  ];

  return (
    <div>
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className={`flex gap-1.5 ${rowIdx > 0 ? 'mt-1' : ''}`}>
          {row.map((qty) => {
            const cost = seedPrice(qty) * qty;
            const canAfford = dirtyCash >= cost;
            return (
              <Tooltip key={qty} text={`Buy ${fmtQty(qty)} seed${qty > 1 ? 's' : ''} for planting.${qty >= 10000 ? ' Bulk discount applied!' : ''}`}>
              <button
                data-tutorial={qty === 1 ? 'buy-seed-btn' : undefined}
                onClick={() => handleBuy(qty)}
                disabled={!canAfford}
                className={`flex-1 py-1.5 rounded border text-[10px] font-semibold transition ${
                  canAfford ? 'bg-green-800 hover:bg-green-700 text-green-200 border-white/30' : 'bg-gray-700 text-white cursor-not-allowed border-white/30'
                }`}
              >
                x{fmtQty(qty)} ({formatMoney(cost)})
              </button>
              </Tooltip>
            );
          })}
        </div>
      ))}
      {/* Row 3: bulk discount tiers + custom */}
      <div className="flex gap-1.5 mt-1">
        {[20000, 30000].map((qty) => {
          const cost = seedPrice(qty) * qty;
          const canAfford = dirtyCash >= cost;
          return (
            <Tooltip key={qty} text={`Buy ${fmtQty(qty)} seeds. Bulk discount: $${INITIAL_OPERATION.seedCostPerUnit - seedPrice(qty)} off per seed!`}>
            <button
              onClick={() => handleBuy(qty)}
              disabled={!canAfford}
              className={`flex-1 py-1.5 rounded border text-[10px] font-semibold transition ${
                canAfford ? 'bg-green-800 hover:bg-green-700 text-green-200 border-white/30' : 'bg-gray-700 text-white cursor-not-allowed border-white/30'
              }`}
            >
              x{fmtQty(qty)} ({formatMoney(cost)})
            </button>
            </Tooltip>
          );
        })}
        <Tooltip text="Enter a custom seed quantity to buy.">
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="flex-1 py-1.5 rounded border border-white/30 text-[10px] font-semibold transition bg-green-800 hover:bg-green-700 text-green-200"
        >
          Custom
        </button>
        </Tooltip>
      </div>
      {showCustom && (
        <div className="flex gap-1.5 mt-1">
          <input
            type="number"
            min={1}
            value={customQty}
            onChange={(e) => setCustomQty(e.target.value)}
            placeholder="# seeds"
            className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-[10px] text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
          />
          {(() => {
            const qty = Math.max(0, Math.floor(Number(customQty) || 0));
            const cost = qty > 0 ? seedPrice(qty) * qty : 0;
            const canAfford = qty > 0 && dirtyCash >= cost;
            return (
              <button
                onClick={() => { if (qty > 0) handleBuy(qty); setCustomQty(''); setShowCustom(false); }}
                disabled={!canAfford}
                className={`flex-1 py-1.5 rounded border border-white/30 text-[10px] font-semibold transition ${
                  canAfford ? 'bg-green-800 hover:bg-green-700 text-green-200' : 'bg-gray-700 text-white cursor-not-allowed'
                }`}
              >
                Buy {qty > 0 ? fmtQty(qty) : '...'} ({formatMoney(cost)})
              </button>
            );
          })()}
        </div>
      )}
    </div>
  );
}
