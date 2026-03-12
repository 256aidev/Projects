import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { GROW_ROOM_TYPE_DEFS, DEALER_TIERS, WATER_TIERS, LIGHT_TIERS, INITIAL_OPERATION } from '../../data/types';
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
  const buyAutoHarvest = useGameStore((s) => s.buyAutoHarvest);
  const hireDealers = useGameStore((s) => s.hireDealers);
  const upgradeDealerTier = useGameStore((s) => s.upgradeDealerTier);
  const buySeed = useGameStore((s) => s.buySeed);
  const plantSeeds = useGameStore((s) => s.plantSeeds);
  const sellProduct = useGameStore((s) => s.sellProduct);
  const addNotification = useUIStore((s) => s.addNotification);

  const currentDealerTier = DEALER_TIERS[op.dealerTierIndex];
  const nextDealerTier = DEALER_TIERS[op.dealerTierIndex + 1];
  const allSlots = op.growRooms.flatMap((r) => r.slots);
  const avgPrice = allSlots.length > 0
    ? allSlots.reduce((sum, s) => sum + s.pricePerUnit, 0) / allSlots.length
    : 10;
  const dealerIncome = currentDealerTier.salesRatePerTick * op.dealerCount * avgPrice * (1 - currentDealerTier.cutPercent / 100);

  // Which room types are already owned
  const ownedTypeIds = new Set(op.growRooms.map((r) => r.typeId));

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Location header */}
      <div className="text-center py-2">
        <p className="text-gray-500 text-xs uppercase tracking-widest">Current Location</p>
        <h2 className="text-white font-bold text-xl">{op.locationName}</h2>
      </div>

      {/* Product inventory + sell */}
      <section className="bg-green-900/20 border border-green-800/40 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-green-400 font-semibold text-sm">Product Inventory</h3>
            <p className="text-gray-400 text-xs">{formatUnits(op.productInventory)} · avg ${avgPrice.toFixed(0)}/oz</p>
          </div>
          <CannabisLeaf size={32} />
        </div>
        {op.productInventory > 0 ? (
          <div className="flex gap-2">
            {([16, 160, 'All'] as const).map((qty) => {
              const units = qty === 'All' ? Math.floor(op.productInventory) : Math.min(qty as number, Math.floor(op.productInventory));
              const earned = Math.floor(units * avgPrice * 0.7);
              const label = qty === 'All' ? 'All' : qty === 16 ? '1lb' : '10lb';
              return (
                <button
                  key={qty}
                  onClick={() => {
                    const cash = sellProduct(units);
                    if (cash > 0) addNotification(`Sold ${formatUnits(units)} for ${formatMoney(cash)} 💵`, 'success');
                  }}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold bg-green-800 hover:bg-green-700 text-green-200 transition"
                >
                  Sell {label}<br />
                  <span className="text-green-400">{formatMoney(earned)}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-600 text-xs text-center py-1">No product — grow some weed first</p>
        )}
        <p className="text-gray-600 text-[10px] mt-2 text-center">Street sell = 70% of avg price · 16oz = 1lb · 100lb = 1 crate</p>
      </section>

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

            return (
              <div key={room.id} className="bg-gray-800/60 border border-gray-700 rounded-xl overflow-hidden">
                {/* Room header */}
                <div className="flex items-center justify-between px-3 py-2 bg-gray-900/50 border-b border-gray-700">
                  <div>
                    <p className="text-white font-bold text-sm">{room.name}</p>
                    <p className="text-gray-500 text-xs">{room.slots.length} strain{room.slots.length > 1 ? 's' : ''} · +{Math.round(totalYieldBonus * 100)}% yield</p>
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

                  {/* RIGHT — Maintenance */}
                  <div className="w-32 p-3 flex flex-col gap-3">
                    <p className="text-gray-500 text-[10px] uppercase tracking-widest text-center">Maintenance</p>

                    {/* Water */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">💧 Water</span>
                        <span className="text-[10px] text-blue-400">+{Math.round(waterData.yieldBonus * 100)}%</span>
                      </div>
                      <p className="text-[10px] text-gray-500">{waterData.name}</p>
                      {nextWater ? (
                        <button
                          onClick={() => { if (upgradeWater(room.id)) addNotification(`${nextWater.name} installed!`, 'success'); else addNotification(`Need ${formatMoney(nextWater.cost)} dirty cash`, 'warning'); }}
                          disabled={dirtyCash < nextWater.cost}
                          className={`w-full py-1 rounded text-[10px] font-semibold transition ${dirtyCash >= nextWater.cost ? 'bg-blue-800 hover:bg-blue-700 text-blue-200' : 'bg-gray-700 text-gray-600 cursor-not-allowed'}`}
                        >
                          {nextWater.icon} {nextWater.name}<br/>{formatMoney(nextWater.cost)}
                        </button>
                      ) : (
                        <span className="text-[10px] text-blue-500 text-center">MAX ✓</span>
                      )}
                    </div>

                    {/* Lighting */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">💡 Light</span>
                        <span className="text-[10px] text-yellow-400">+{Math.round(lightData.yieldBonus * 100)}%</span>
                      </div>
                      <p className="text-[10px] text-gray-500">{lightData.name}</p>
                      {nextLight ? (
                        <button
                          onClick={() => { if (upgradeLighting(room.id)) addNotification(`${nextLight.name} installed!`, 'success'); else addNotification(`Need ${formatMoney(nextLight.cost)} dirty cash`, 'warning'); }}
                          disabled={dirtyCash < nextLight.cost}
                          className={`w-full py-1 rounded text-[10px] font-semibold transition ${dirtyCash >= nextLight.cost ? 'bg-yellow-800 hover:bg-yellow-700 text-yellow-200' : 'bg-gray-700 text-gray-600 cursor-not-allowed'}`}
                        >
                          {nextLight.icon} {nextLight.name}<br/>{formatMoney(nextLight.cost)}
                        </button>
                      ) : (
                        <span className="text-[10px] text-yellow-500 text-center">MAX ✓</span>
                      )}
                    </div>

                    {/* Auto-Harvest */}
                    <div className="flex flex-col gap-1 pt-1 border-t border-gray-700">
                      <span className="text-[10px] text-gray-400 text-center">⚙️ Auto-Harvest</span>
                      {room.autoHarvest ? (
                        <span className="text-[10px] text-green-400 text-center font-bold">ACTIVE ✓</span>
                      ) : (
                        <button
                          onClick={() => {
                            if (buyAutoHarvest(room.id)) addNotification(`Auto-harvest enabled for ${room.name}!`, 'success');
                            else addNotification(`Need ${formatMoney(def?.autoHarvestCost ?? 0)} dirty cash`, 'warning');
                          }}
                          disabled={dirtyCash < (def?.autoHarvestCost ?? Infinity)}
                          className={`w-full py-1 rounded text-[10px] font-semibold transition ${dirtyCash >= (def?.autoHarvestCost ?? Infinity) ? 'bg-orange-800 hover:bg-orange-700 text-orange-200' : 'bg-gray-700 text-gray-600 cursor-not-allowed'}`}
                        >
                          Enable<br/>{formatMoney(def?.autoHarvestCost ?? 0)}
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

      {/* Seeds */}
      <section className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-white font-semibold text-sm">Seeds</h3>
            <p className="text-gray-400 text-xs">{op.seedStock} in stock · {formatMoney(INITIAL_OPERATION.seedCostPerUnit)}/seed</p>
          </div>
          <span className="text-2xl">🌱</span>
        </div>
        <div className="flex gap-2">
          {[10, 25, 50].map((qty) => {
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
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
                  canAfford ? 'bg-green-800 hover:bg-green-700 text-green-200' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                x{qty} ({formatMoney(cost)})
              </button>
            );
          })}
        </div>
      </section>

      {/* Dealer Network */}
      <section className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-white font-semibold text-sm">Dealer Network</h3>
            <p className="text-gray-400 text-xs">
              {currentDealerTier.name} · {op.dealerCount} dealers
              {op.dealerCount > 0 && ` · ${formatMoney(dealerIncome)}/s`}
            </p>
          </div>
          <span className="text-2xl">🤝</span>
        </div>
        <p className="text-gray-600 text-[10px] mb-3">
          Sell passively at avg ${avgPrice.toFixed(0)}/oz ({currentDealerTier.cutPercent}% cut)
        </p>
        <div className="flex gap-2 mb-3">
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
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
                  canAfford ? 'bg-indigo-800 hover:bg-indigo-700 text-indigo-200' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                +{qty} ({formatMoney(cost)})
              </button>
            );
          })}
        </div>
        {nextDealerTier && (
          <button
            onClick={() => {
              if (upgradeDealerTier()) addNotification(`Upgraded to ${nextDealerTier.name}!`, 'success');
              else addNotification(`Need ${formatMoney(nextDealerTier.hireCost * 3)} dirty cash`, 'warning');
            }}
            disabled={dirtyCash < nextDealerTier.hireCost * 3}
            className={`w-full py-2 rounded-lg text-xs font-semibold transition ${
              dirtyCash >= nextDealerTier.hireCost * 3
                ? 'bg-purple-800 hover:bg-purple-700 text-purple-200'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            Upgrade to {nextDealerTier.name} ({formatMoney(nextDealerTier.hireCost * 3)} 💵)
          </button>
        )}
      </section>
    </div>
  );
}
