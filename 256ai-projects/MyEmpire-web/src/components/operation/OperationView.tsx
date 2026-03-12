import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { GROW_ROOM_TYPE_DEFS, DEALER_TIERS, ROOM_UPGRADE_DEFS, INITIAL_OPERATION, getStrainUnlockCost, getDealerHireCost } from '../../data/types';
import { getRoomBonus, getRoomCycleCost } from '../../engine/economy';
import { formatMoney, formatUnits } from '../../engine/economy';
import { sound } from '../../engine/sound';
import CannabisLeaf from '../ui/CannabisLeaf';

function seedPrice(qty: number): number {
  const base = INITIAL_OPERATION.seedCostPerUnit;
  const discount = qty >= 30000 ? 3 : qty >= 20000 ? 2 : qty >= 10000 ? 1 : 0;
  return base - discount;
}

export default function OperationView() {
  const op = useGameStore((s) => s.operation);
  const dirtyCash = useGameStore((s) => s.dirtyCash);
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
              {formatUnits(streetSellQuotaOz)} / 10lb · +1lb/min
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${streetSellQuotaOz < 32 ? 'bg-orange-500' : 'bg-green-600'}`}
              style={{ width: `${(streetSellQuotaOz / 160) * 100}%` }}
            />
          </div>
        </div>

        {totalInventoryOz > 0 && streetSellQuotaOz > 0 ? (
          <div className="flex gap-2">
            {([16, 160] as const).map((qty) => {
              const units = Math.min(qty, Math.floor(totalInventoryOz), Math.floor(streetSellQuotaOz));
              const earned = Math.floor(units * weightedAvgPrice * 0.7);
              const label = qty === 16 ? '1lb' : '10lb';
              const canSell = units > 0;
              return (
                <button
                  key={qty}
                  onClick={() => {
                    const cash = sellProduct(units);
                    if (cash > 0) addNotification(`Sold ${formatUnits(units)} for ${formatMoney(cash)} 💵`, 'success');
                    else addNotification('Street demand exhausted — use dealers!', 'warning');
                  }}
                  disabled={!canSell}
                  className={`flex-1 py-2 rounded-lg border border-white/30 text-xs font-semibold transition ${canSell ? 'bg-green-800 hover:bg-green-700 text-green-200' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                >
                  Sell {label}<br />
                  <span className={canSell ? 'text-green-400' : 'text-gray-600'}>{formatMoney(earned)}</span>
                </button>
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
            <p className="text-white font-semibold text-xs">Seeds <span className="text-gray-400 font-normal">{op.seedStock} in stock · {formatMoney(INITIAL_OPERATION.seedCostPerUnit)}/seed</span></p>
            <span className="text-lg">🌱</span>
          </div>
          {[
            [10, 25, 50],
            [1000, 10000, 100000],
          ].map((row, rowIdx) => (
            <div key={rowIdx} className={`flex gap-1.5 ${rowIdx > 0 ? 'mt-1' : ''}`}>
              {row.map((qty) => {
                const cost = seedPrice(qty) * qty;
                const canAfford = dirtyCash >= cost;
                return (
                  <button
                    key={qty}
                    onClick={() => {
                      if (buySeed(qty)) { sound.play('buy'); addNotification(`Bought ${qty} seeds`, 'success'); }
                      else addNotification(`Need ${formatMoney(cost)} dirty cash`, 'warning');
                    }}
                    disabled={!canAfford}
                    className={`flex-1 py-1.5 rounded border text-[10px] font-semibold transition ${
                      canAfford ? 'bg-green-800 hover:bg-green-700 text-green-200 border-white/30' : 'bg-gray-700 text-gray-500 cursor-not-allowed border-white/30'
                    }`}
                  >
                    x{qty >= 1000 ? `${qty / 1000}k` : qty} ({formatMoney(cost)})
                  </button>
                );
              })}
            </div>
          ))}
          {/* Bulk seed buttons with volume discount */}
          <BulkSeedRow buySeed={buySeed} dirtyCash={dirtyCash} addNotification={addNotification} />
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
                <button
                  key={qty}
                  onClick={() => {
                    if (hireDealers(qty)) { sound.play('dealer_hire'); addNotification(`Hired ${qty} dealer${qty > 1 ? 's' : ''}`, 'success'); }
                    else addNotification(`Need ${formatMoney(cost)} dirty cash`, 'warning');
                  }}
                  disabled={!canAfford}
                  className={`flex-1 py-1.5 rounded border border-white/30 text-[10px] font-semibold transition ${
                    canAfford ? 'bg-indigo-800 hover:bg-indigo-700 text-indigo-200' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  +{qty} ({formatMoney(cost)})
                </button>
              );
            })}
            {op.dealerCount > 0 && [1, 3, 5].map((qty) => {
              const canFire = op.dealerCount >= qty;
              return (
                <button
                  key={`fire-${qty}`}
                  onClick={() => { fireDealers(qty); addNotification(`Fired ${qty} dealer${qty > 1 ? 's' : ''} (no refund)`, 'warning'); }}
                  disabled={!canFire}
                  className={`flex-1 py-1.5 rounded border border-white/30 text-[9px] font-semibold transition ${
                    canFire ? 'bg-red-900/60 hover:bg-red-800/70 text-red-300' : 'bg-gray-700 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  −{qty} Fire
                </button>
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
                <button
                  onClick={() => {
                    if (downgradeDealerTier()) addNotification(`Downgraded to ${prevTier.name} (+${formatMoney(refund)} refund)`, 'warning');
                  }}
                  className="flex-1 py-1.5 rounded border border-white/30 text-[9px] font-semibold transition bg-red-900/60 hover:bg-red-800/70 text-red-300"
                >
                  ▼ {prevTier.name}<br />
                  <span className="font-normal opacity-75">
                    {prevTier.salesRatePerTick} oz/tick · ${prevTier.cutPer8oz} cut/8oz<br />+{formatMoney(refund)} refund
                  </span>
                </button>
              ) : null;
            })()}
            {/* Upgrade */}
            {nextDealerTier && (() => {
              const canUpgrade = dirtyCash >= nextDealerTier.hireCost * 3;
              return (
                <button
                  onClick={() => {
                    if (upgradeDealerTier()) addNotification(`Upgraded to ${nextDealerTier.name}!`, 'success');
                    else addNotification(`Need ${formatMoney(nextDealerTier.hireCost * 3)} dirty cash`, 'warning');
                  }}
                  disabled={!canUpgrade}
                  className={`flex-1 py-1.5 rounded border border-white/30 text-[9px] font-semibold transition ${
                    canUpgrade ? 'bg-purple-800 hover:bg-purple-700 text-purple-200' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  ▲ {nextDealerTier.name} — {formatMoney(nextDealerTier.hireCost * 3)} 💵<br />
                  <span className="font-normal opacity-75">
                    {nextDealerTier.salesRatePerTick} oz/tick · ${nextDealerTier.cutPer8oz} cut/8oz · base ${formatMoney(nextDealerTier.hireCost)}/ea
                  </span>
                </button>
              );
            })()}
          </div>
        </div>

      </div>

      {/* ── SCROLLABLE BODY ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

      {/* Grow Rooms */}
      <section>
        <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-2 px-1">Grow Rooms · 🌱 {op.seedStock} seeds</h3>
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

            return (
              <div key={room.id} className="bg-gray-800/60 border border-gray-700 rounded-xl overflow-hidden">
                {/* Room header */}
                <div className="flex items-center justify-between px-3 py-2 bg-gray-900/50 border-b border-gray-700">
                  <div>
                    <p className="text-white font-bold text-sm">{room.name}</p>
                    <p className="text-gray-500 text-xs">{room.slots.length} strain{room.slots.length > 1 ? 's' : ''} · +{Math.round(totalYieldBonus * 100)}% yield · <span className="text-red-400">{formatMoney(maintenancePerCycle)}/cycle overhead</span></p>
                  </div>
                  {isMaxLevel ? (
                    <span className="text-yellow-500 text-xs font-bold px-2 py-0.5 bg-yellow-900/30 rounded-full">MAX</span>
                  ) : (
                    <button
                      onClick={() => {
                        if (upgradeRoom(room.id)) {
                          const newSlotName = def?.strainSlots[room.upgradeLevel + 1]?.strainName;
                          addNotification(`Unlocked ${newSlotName} slot!`, 'success');
                        } else {
                          addNotification(`Need ${formatMoney(nextUpgradeCost)} dirty cash to upgrade`, 'warning');
                        }
                      }}
                      disabled={!canUpgrade}
                      className={`text-xs px-2 py-1 rounded-lg border border-white/30 font-semibold transition ${
                        canUpgrade ? 'bg-purple-700 hover:bg-purple-600 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      + {def?.strainSlots[room.upgradeLevel + 1]?.strainName} · {formatMoney(nextUpgradeCost)}
                    </button>
                  )}
                </div>

                {/* Split layout: left = strains, right = maintenance */}
                <div className="flex">
                  {/* LEFT — Strain slots */}
                  <div className="flex-1 p-3 flex flex-col gap-2 border-r border-gray-700">
                    {room.slots.map((slot, slotIndex) => {
                      const progress = slot.isHarvesting && slot.growTimerTicks > 0
                        ? 1 - slot.ticksRemaining / slot.growTimerTicks
                        : slot.isHarvesting ? 1 : 0;
                      const ready = slot.isHarvesting && slot.ticksRemaining === 0;
                      const idle = !slot.isHarvesting;

                      return (
                        <div key={slotIndex} className="bg-gray-900/50 rounded-lg p-2">
                          <div className="flex items-center justify-between mb-1">
                            <div>
                              <p className="text-green-400 font-semibold text-xs">{slot.strainName}</p>
                              <p className="text-gray-600 text-[10px]">${slot.pricePerUnit}/oz · {slot.plantsCapacity}p</p>
                            </div>
                            <span>{ready ? <CannabisLeaf size={18} /> : idle ? '💤' : '🌱'}</span>
                          </div>
                          <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden mb-1.5">
                            <div className="h-full rounded-full transition-all" style={{ width: `${progress * 100}%`, backgroundColor: ready ? '#22c55e' : '#65a30d' }} />
                          </div>
                          {ready ? (
                            <button onClick={() => { const u = harvestGrowRoom(room.id, slotIndex); if (u > 0) { sound.play('harvest'); addNotification(`Harvested ${formatUnits(u)} ${slot.strainName}!${op.seedStock > 0 ? ' Auto-replanting…' : ' Buy seeds.'}`, 'success'); } }}
                              className="w-full py-1 rounded border border-white/30 bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold transition">
                              Harvest!
                            </button>
                          ) : idle ? (
                            <button onClick={() => { if (plantSeeds(room.id, slotIndex)) { sound.play('plant'); addNotification(`${slot.strainName} planted!`, 'success'); } else addNotification('No seeds', 'warning'); }}
                              disabled={op.seedStock < 1}
                              className={`w-full py-1 rounded border border-white/30 text-[10px] font-semibold transition ${op.seedStock > 0 ? 'bg-lime-700 hover:bg-lime-600 text-lime-100' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>
                              🌱 Plant {op.seedStock < 1 ? '(no seeds)' : ''}
                            </button>
                          ) : (
                            <p className="text-center text-gray-500 text-[10px]">{slot.ticksRemaining}s left</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* RIGHT — Maintenance: data-driven 3×2 grid */}
                  <div className="grid grid-cols-3 gap-2 p-3">
                    {ROOM_UPGRADE_DEFS.map((upgDef) => {
                      const level = room.upgradeLevels?.[upgDef.id] ?? 0;
                      const currentLvl = level > 0 ? upgDef.levels[level - 1] : null;
                      const nextLvl = upgDef.levels[level];
                      const scaledCost = nextLvl ? nextLvl.cost * upgMult : 0;
                      const canAfford = nextLvl && dirtyCash >= scaledCost;
                      const isToggle = upgDef.bonusType === 'toggle';
                      const isActive = isToggle && level > 0;

                      // Format current bonus label
                      const bonusLabel = currentLvl
                        ? (upgDef.bonusType === 'speed' ? `-${Math.round(currentLvl.speedBonus * 100)}% time`
                          : upgDef.bonusType === 'yield' ? `+${Math.round(currentLvl.yieldBonus * 100)}% yield`
                          : upgDef.bonusType === 'double' ? `${Math.round(currentLvl.doubleChance * 100)}% chance`
                          : null)
                        : null;

                      // Format next upgrade bonus label
                      const nextBonusLabel = nextLvl
                        ? (upgDef.bonusType === 'speed' ? `-${Math.round(nextLvl.speedBonus * 100)}% time`
                          : upgDef.bonusType === 'yield' ? `+${Math.round(nextLvl.yieldBonus * 100)}% yield`
                          : upgDef.bonusType === 'double' ? `${Math.round(nextLvl.doubleChance * 100)}% 2×`
                          : 'Enable')
                        : null;

                      return (
                        <div key={upgDef.id} className={`flex flex-col justify-between gap-1 p-2 rounded-lg border ${level > 0 ? `border-opacity-40 ${upgDef.bgColor}` : upgDef.borderColor}`}>
                          <span className={`text-[11px] font-semibold ${upgDef.color}`}>{upgDef.icon} {upgDef.name}</span>
                          <p className={`text-[11px] font-semibold leading-tight ${upgDef.color}`}>
                            {isToggle
                              ? (isActive ? null : <span className="text-gray-600">Auto-replants</span>)
                              : (bonusLabel ?? <span className="text-gray-600">None</span>)}
                          </p>
                          {isActive ? (
                            <span className="text-[11px] text-green-400 text-center font-bold">ACTIVE ✓</span>
                          ) : nextLvl ? (
                            <button
                              onClick={() => {
                                if (buyRoomUpgrade(room.id, upgDef.id)) addNotification(`${nextLvl.name} applied!`, 'success');
                                else addNotification(`Need ${formatMoney(scaledCost)}`, 'warning');
                              }}
                              disabled={!canAfford}
                              className={`w-full py-1.5 rounded border border-white/30 text-[11px] font-semibold transition mt-0.5 ${canAfford ? `${upgDef.bgColor} hover:opacity-80 ${upgDef.color}` : 'bg-gray-700 text-gray-600 cursor-not-allowed'}`}
                            >
                              {nextBonusLabel}
                              {!isToggle && <><br/>{nextLvl.name}</>}
                              <br/>{formatMoney(scaledCost)}
                              {nextLvl.costPerCycle > 0 && <><br/><span className="text-red-300">${nextLvl.costPerCycle}/cyc</span></>}
                            </button>
                          ) : (
                            <span className={`text-[11px] ${upgDef.color} text-center mt-0.5`}>MAX ✓</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Buy new room buttons */}
          {GROW_ROOM_TYPE_DEFS.filter((def) => def.id !== 'closet' && !ownedTypeIds.has(def.id)).map((def) => {
            const canAfford = dirtyCash >= def.purchaseCost;
            return (
              <button
                key={def.id}
                onClick={() => {
                  if (buyGrowRoom(def.id)) {
                    addNotification(`Built ${def.name}!`, 'success');
                  } else {
                    addNotification(`Need ${formatMoney(def.purchaseCost)} dirty cash`, 'warning');
                  }
                }}
                disabled={!canAfford}
                className={`border-2 border-dashed rounded-xl p-4 text-center transition ${
                  canAfford ? 'border-green-600/50 hover:border-green-500 bg-green-900/10' : 'border-gray-700 opacity-40 cursor-not-allowed'
                }`}
              >
                <p className="text-green-400 text-lg mb-1">+</p>
                <p className="text-white text-sm font-semibold">{def.name}</p>
                <p className="text-gray-400 text-xs mt-0.5">
                  Starts with {def.strainSlots[0].strainName} · up to {def.strainSlots.length} strains
                </p>
                <p className="text-yellow-400 text-sm font-bold mt-1">{formatMoney(def.purchaseCost)} 💵</p>
              </button>
            );
          })}
        </div>
      </section>

      </div>{/* end scrollable body */}
    </div>
  );
}

function BulkSeedRow({ buySeed, dirtyCash, addNotification }: {
  buySeed: (qty: number) => boolean;
  dirtyCash: number;
  addNotification: (msg: string, type: string) => void;
}) {
  const [customQty, setCustomQty] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const bulkButtons = [
    { qty: 1000, label: '1k' },
    { qty: 10000, label: '10k' },
  ];

  const handleBuy = (qty: number) => {
    const price = seedPrice(qty);
    const cost = price * qty;
    if (buySeed(qty)) {
      sound.play('buy');
      const saved = (INITIAL_OPERATION.seedCostPerUnit - price) * qty;
      addNotification(`Bought ${qty >= 1000 ? `${qty / 1000}k` : qty} seeds at $${price}/ea${saved > 0 ? ` (saved ${formatMoney(saved)})` : ''}`, 'success');
    } else {
      addNotification(`Need ${formatMoney(cost)} dirty cash`, 'warning');
    }
  };

  return (
    <div className="mt-1">
      <div className="flex gap-1.5">
        {bulkButtons.map(({ qty, label }) => {
          const price = seedPrice(qty);
          const cost = price * qty;
          const discount = INITIAL_OPERATION.seedCostPerUnit - price;
          const canAfford = dirtyCash >= cost;
          return (
            <button
              key={qty}
              onClick={() => handleBuy(qty)}
              disabled={!canAfford}
              className={`flex-1 py-1.5 rounded border text-[10px] font-semibold transition ${
                canAfford ? 'bg-emerald-800 hover:bg-emerald-700 text-emerald-200 border-white/30' : 'bg-gray-700 text-gray-500 cursor-not-allowed border-white/30'
              }`}
            >
              {label} ({formatMoney(cost)})
              {discount > 0 && <span className="text-yellow-400"> -${discount}</span>}
            </button>
          );
        })}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="flex-1 py-1.5 rounded border border-white/30 text-[10px] font-semibold transition bg-emerald-800 hover:bg-emerald-700 text-emerald-200"
        >
          Custom
        </button>
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
            const price = qty > 0 ? seedPrice(qty) : INITIAL_OPERATION.seedCostPerUnit;
            const cost = price * qty;
            const discount = INITIAL_OPERATION.seedCostPerUnit - price;
            const canAfford = qty > 0 && dirtyCash >= cost;
            return (
              <button
                onClick={() => { if (qty > 0) handleBuy(qty); setCustomQty(''); setShowCustom(false); }}
                disabled={!canAfford}
                className={`flex-1 py-1.5 rounded text-[10px] font-semibold transition ${
                  canAfford ? 'bg-emerald-800 hover:bg-emerald-700 text-emerald-200 border-white/30' : 'bg-gray-700 text-gray-500 cursor-not-allowed border-white/30'
                }`}
              >
                Buy {qty > 0 ? `${qty >= 1000 ? `${(qty/1000).toFixed(qty%1000?1:0)}k` : qty}` : '...'} · {formatMoney(cost)}
                {discount > 0 && <span className="text-yellow-400"> (${price}/ea)</span>}
              </button>
            );
          })()}
        </div>
      )}
      <p className="text-gray-600 text-[9px] mt-0.5">Bulk: 10k+ $4/seed · 20k+ $3/seed · 30k+ $2/seed</p>
    </div>
  );
}
