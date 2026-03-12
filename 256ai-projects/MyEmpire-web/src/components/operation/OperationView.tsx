import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { GROW_ROOM_TYPE_DEFS, DEALER_TIERS, WATER_TIERS, LIGHT_TIERS, NUTRIENT_DEFS, INITIAL_OPERATION } from '../../data/types';
import { formatMoney, formatUnits } from '../../engine/economy';
import { sound } from '../../engine/sound';
import CannabisLeaf from '../ui/CannabisLeaf';

export default function OperationView() {
  const op = useGameStore((s) => s.operation);
  const dirtyCash = useGameStore((s) => s.dirtyCash);
  const harvestGrowRoom = useGameStore((s) => s.harvestGrowRoom);
  const buyGrowRoom = useGameStore((s) => s.buyGrowRoom);
  const upgradeRoom = useGameStore((s) => s.upgradeRoom);
  const upgradeWater = useGameStore((s) => s.upgradeWater);
  const upgradeLighting = useGameStore((s) => s.upgradeLighting);
  const upgradeFloraGro = useGameStore((s) => s.upgradeFloraGro);
  const upgradefloraMicro = useGameStore((s) => s.upgradefloraMicro);
  const upgradeFloraBloom = useGameStore((s) => s.upgradeFloraBloom);
  const buyAutoHarvest = useGameStore((s) => s.buyAutoHarvest);
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
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${canSell ? 'bg-green-800 hover:bg-green-700 text-green-200' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
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
                const cost = INITIAL_OPERATION.seedCostPerUnit * qty;
                const canAfford = dirtyCash >= cost;
                return (
                  <button
                    key={qty}
                    onClick={() => {
                      if (buySeed(qty)) { sound.play('buy'); addNotification(`Bought ${qty} seeds`, 'success'); }
                      else addNotification(`Need ${formatMoney(cost)} dirty cash`, 'warning');
                    }}
                    disabled={!canAfford}
                    className={`flex-1 py-1.5 rounded text-[10px] font-semibold transition ${
                      canAfford ? 'bg-green-800 hover:bg-green-700 text-green-200' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    x{qty >= 1000 ? `${qty / 1000}k` : qty} ({formatMoney(cost)})
                  </button>
                );
              })}
            </div>
          ))}
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
              const cost = currentDealerTier.hireCost * qty;
              const canAfford = dirtyCash >= cost;
              return (
                <button
                  key={qty}
                  onClick={() => {
                    if (hireDealers(qty)) { sound.play('dealer_hire'); addNotification(`Hired ${qty} dealer${qty > 1 ? 's' : ''}`, 'success'); }
                    else addNotification(`Need ${formatMoney(cost)} dirty cash`, 'warning');
                  }}
                  disabled={!canAfford}
                  className={`flex-1 py-1.5 rounded text-[10px] font-semibold transition ${
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
                  className={`flex-1 py-1.5 rounded text-[9px] font-semibold transition ${
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
                  className="flex-1 py-1.5 rounded text-[9px] font-semibold transition bg-red-900/60 hover:bg-red-800/70 text-red-300"
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
                  className={`flex-1 py-1.5 rounded text-[9px] font-semibold transition ${
                    canUpgrade ? 'bg-purple-800 hover:bg-purple-700 text-purple-200' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  ▲ {nextDealerTier.name} — {formatMoney(nextDealerTier.hireCost * 3)} 💵<br />
                  <span className="font-normal opacity-75">
                    {nextDealerTier.salesRatePerTick} oz/tick · ${nextDealerTier.cutPer8oz} cut/8oz · hire ${nextDealerTier.hireCost}/ea
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
            const nextUpgradeCost = def?.upgradeCosts[room.upgradeLevel];
            const canUpgrade = !!nextUpgradeCost && dirtyCash >= nextUpgradeCost;
            const isMaxLevel = !nextUpgradeCost;

            const waterTier = room.waterTier ?? 0;
            const lightTier = room.lightTier ?? 0;
            const waterData = WATER_TIERS[waterTier];
            const lightData = LIGHT_TIERS[lightTier];
            const nextWater = WATER_TIERS[waterTier + 1];
            const nextLight = LIGHT_TIERS[lightTier + 1];
            const totalYieldBonus = waterData.yieldBonus + lightData.yieldBonus;
            const maintenancePerCycle = waterData.costPerCycle + lightData.costPerCycle;
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
                          addNotification(`Need ${formatMoney(nextUpgradeCost!)} dirty cash to upgrade`, 'warning');
                        }
                      }}
                      disabled={!canUpgrade}
                      className={`text-xs px-2 py-1 rounded-lg font-semibold transition ${
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
                              className="w-full py-1 rounded bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold transition">
                              Harvest!
                            </button>
                          ) : idle ? (
                            <button onClick={() => { if (plantSeeds(room.id, slotIndex)) { sound.play('plant'); addNotification(`${slot.strainName} planted!`, 'success'); } else addNotification('No seeds', 'warning'); }}
                              disabled={op.seedStock < 1}
                              className={`w-full py-1 rounded text-[10px] font-semibold transition ${op.seedStock > 0 ? 'bg-lime-700 hover:bg-lime-600 text-lime-100' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>
                              🌱 Plant {op.seedStock < 1 ? '(no seeds)' : ''}
                            </button>
                          ) : (
                            <p className="text-center text-gray-500 text-[10px]">{slot.ticksRemaining}s left</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* RIGHT — Maintenance: 3×2 grid (row1: nutrients, row2: systems) */}
                  <div className="grid grid-cols-3 gap-1.5 p-3">

                    {/* ROW 1 — Nutrients (FloraGro | FloraMicro | FloraBloom) */}
                    {[
                      { def: NUTRIENT_DEFS[0], level: room.nutrientSpeed  ?? 0, upgrade: () => upgradeFloraGro(room.id) },
                      { def: NUTRIENT_DEFS[1], level: room.nutrientYield  ?? 0, upgrade: () => upgradefloraMicro(room.id) },
                      { def: NUTRIENT_DEFS[2], level: room.nutrientDouble ?? 0, upgrade: () => upgradeFloraBloom(room.id) },
                    ].map(({ def, level, upgrade }) => {
                      const nextLevel = def.levels[level];
                      const currentLevel = level > 0 ? def.levels[level - 1] : null;
                      const scaledCost = nextLevel ? nextLevel.cost * upgMult : 0;
                      const canAfford = nextLevel && dirtyCash >= scaledCost;
                      return (
                        <div key={def.id} className={`flex flex-col justify-between gap-0.5 p-1.5 rounded-lg border ${level > 0 ? `border-opacity-40 ${def.bgColor}` : 'border-gray-700/40'}`}>
                          <span className={`text-[9px] font-semibold ${def.color}`}>{def.icon} {def.name}</span>
                          <p className={`text-[9px] font-semibold leading-tight ${def.color}`}>
                            {currentLevel
                              ? (def.id === 'speed'  ? `-${Math.round(currentLevel.speedBonus * 100)}% time`
                                : def.id === 'yield' ? `+${Math.round(currentLevel.yieldBonus * 100)}% yield`
                                : `${Math.round(currentLevel.doubleChance * 100)}% chance`)
                              : <span className="text-gray-600">None</span>}
                          </p>
                          {nextLevel ? (
                            <button
                              onClick={() => {
                                if (upgrade()) addNotification(`${nextLevel.name} applied!`, 'success');
                                else addNotification(`Need ${formatMoney(scaledCost)}`, 'warning');
                              }}
                              disabled={!canAfford}
                              className={`w-full py-1 rounded text-[9px] font-semibold transition mt-0.5 ${canAfford ? `${def.bgColor} hover:opacity-80 ${def.color}` : 'bg-gray-700 text-gray-600 cursor-not-allowed'}`}
                            >
                              {def.id === 'speed'  && `-${Math.round(nextLevel.speedBonus * 100)}% time`}
                              {def.id === 'yield'  && `+${Math.round(nextLevel.yieldBonus * 100)}% yield`}
                              {def.id === 'double' && `${Math.round(nextLevel.doubleChance * 100)}% 2×`}
                              <br/>{nextLevel.name}
                              <br/>{formatMoney(scaledCost)}
                              <br/><span className="text-red-300">${nextLevel.costPerCycle}/cyc</span>
                            </button>
                          ) : (
                            <span className={`text-[9px] ${def.color} text-center mt-0.5`}>MAX ✓</span>
                          )}
                        </div>
                      );
                    })}

                    {/* ROW 2 — Water | Light | Auto-Harvest */}

                    {/* Water */}
                    <div className="flex flex-col justify-between gap-0.5 p-1.5 rounded-lg border border-blue-900/40">
                      <span className="text-[9px] text-gray-400">💧 Water</span>
                      <span className="text-[9px] text-blue-400">{waterData.yieldBonus > 0 ? `+${Math.round(waterData.yieldBonus * 100)}% yield` : 'No bonus'}</span>
                      {nextWater ? (
                        <button
                          onClick={() => { if (upgradeWater(room.id)) addNotification(`${nextWater.name} installed!`, 'success'); else addNotification(`Need ${formatMoney(nextWater.cost * upgMult)}`, 'warning'); }}
                          disabled={dirtyCash < nextWater.cost * upgMult}
                          className={`w-full py-1 rounded text-[9px] font-semibold transition ${dirtyCash >= nextWater.cost * upgMult ? 'bg-blue-800 hover:bg-blue-700 text-blue-200' : 'bg-gray-700 text-gray-600 cursor-not-allowed'}`}
                        >
                          +{Math.round(nextWater.yieldBonus * 100)}% yield
                          <br/>{nextWater.icon} {nextWater.name}
                          <br/>{formatMoney(nextWater.cost * upgMult)}
                          <br/><span className="text-red-300">${nextWater.costPerCycle}/cyc</span>
                        </button>
                      ) : (
                        <span className="text-[9px] text-blue-500 text-center">MAX ✓</span>
                      )}
                    </div>

                    {/* Light */}
                    <div className="flex flex-col justify-between gap-0.5 p-1.5 rounded-lg border border-yellow-900/40">
                      <span className="text-[9px] text-gray-400">💡 Light</span>
                      <span className="text-[9px] text-yellow-400">{lightData.yieldBonus > 0 ? `+${Math.round(lightData.yieldBonus * 100)}% yield` : 'No bonus'}</span>
                      {nextLight ? (
                        <button
                          onClick={() => { if (upgradeLighting(room.id)) addNotification(`${nextLight.name} installed!`, 'success'); else addNotification(`Need ${formatMoney(nextLight.cost * upgMult)}`, 'warning'); }}
                          disabled={dirtyCash < nextLight.cost * upgMult}
                          className={`w-full py-1 rounded text-[9px] font-semibold transition ${dirtyCash >= nextLight.cost * upgMult ? 'bg-yellow-800 hover:bg-yellow-700 text-yellow-200' : 'bg-gray-700 text-gray-600 cursor-not-allowed'}`}
                        >
                          +{Math.round(nextLight.yieldBonus * 100)}% yield
                          <br/>{nextLight.icon} {nextLight.name}
                          <br/>{formatMoney(nextLight.cost * upgMult)}
                          <br/><span className="text-red-300">${nextLight.costPerCycle}/cyc</span>
                        </button>
                      ) : (
                        <span className="text-[9px] text-yellow-500 text-center">MAX ✓</span>
                      )}
                    </div>

                    {/* Auto-Harvest */}
                    <div className="flex flex-col justify-between gap-0.5 p-1.5 rounded-lg border border-orange-900/40">
                      <span className="text-[9px] text-gray-400">⚙️ Auto</span>
                      <span className="text-[9px] text-gray-600 leading-tight">Auto-replants</span>
                      {room.autoHarvest ? (
                        <span className="text-[9px] text-green-400 text-center font-bold">ACTIVE ✓</span>
                      ) : (
                        <button
                          onClick={() => {
                            if (buyAutoHarvest(room.id)) addNotification(`Auto-harvest enabled for ${room.name}!`, 'success');
                            else addNotification(`Need ${formatMoney(def?.autoHarvestCost ?? 0)}`, 'warning');
                          }}
                          disabled={dirtyCash < (def?.autoHarvestCost ?? Infinity)}
                          className={`w-full py-1 rounded text-[9px] font-semibold transition ${dirtyCash >= (def?.autoHarvestCost ?? Infinity) ? 'bg-orange-800 hover:bg-orange-700 text-orange-200' : 'bg-gray-700 text-gray-600 cursor-not-allowed'}`}
                        >
                          Enable
                          <br/>{formatMoney(def?.autoHarvestCost ?? 0)}
                        </button>
                      )}
                    </div>

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
