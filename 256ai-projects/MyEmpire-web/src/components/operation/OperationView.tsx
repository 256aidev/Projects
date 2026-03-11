import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { DEALER_TIERS, GROW_ROOM_DEFS } from '../../data/types';
import { formatMoney, formatNumber } from '../../engine/economy';

export default function OperationView() {
  const op = useGameStore((s) => s.operation);
  const dirtyCash = useGameStore((s) => s.dirtyCash);
  const harvestGrowRoom = useGameStore((s) => s.harvestGrowRoom);
  const buyGrowRoom = useGameStore((s) => s.buyGrowRoom);
  const hireDealers = useGameStore((s) => s.hireDealers);
  const upgradeDealerTier = useGameStore((s) => s.upgradeDealerTier);
  const buySeed = useGameStore((s) => s.buySeed);
  const plantSeeds = useGameStore((s) => s.plantSeeds);
  const sellProduct = useGameStore((s) => s.sellProduct);
  const addNotification = useUIStore((s) => s.addNotification);

  const currentDealerTier = DEALER_TIERS[op.dealerTierIndex];
  const nextDealerTier = DEALER_TIERS[op.dealerTierIndex + 1];
  const dealerIncome = currentDealerTier.salesRatePerTick * op.dealerCount * 10 * (1 - currentDealerTier.cutPercent / 100);

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
            <p className="text-gray-400 text-xs">{formatNumber(op.productInventory)} units ready to move</p>
          </div>
          <span className="text-2xl">🌿</span>
        </div>

        {op.productInventory > 0 ? (
          <div className="flex gap-2">
            {[10, 25, 'All'].map((qty) => {
              const units = qty === 'All' ? op.productInventory : Math.min(qty as number, op.productInventory);
              const earned = units * 7;
              return (
                <button
                  key={qty}
                  onClick={() => {
                    const cash = sellProduct(units);
                    if (cash > 0) addNotification(`Sold ${units} units for ${formatMoney(cash)} 💵`, 'success');
                  }}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold bg-green-800 hover:bg-green-700 text-green-200 transition"
                >
                  Sell {qty === 'All' ? 'All' : `x${qty}`}<br />
                  <span className="text-green-400">{formatMoney(earned)}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-600 text-xs text-center py-1">No product — grow some weed first</p>
        )}
        <p className="text-gray-600 text-[10px] mt-2 text-center">Street price $7/unit · Dealers pay $10/unit (passive)</p>
      </section>

      {/* Grow Rooms */}
      <section>
        <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-2 px-1">Grow Rooms · 🌱 {op.seedStock} seeds</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {op.growRooms.map((room) => {
            const progress = room.isHarvesting && room.growTimerTicks > 0
              ? 1 - room.ticksRemaining / room.growTimerTicks
              : room.isHarvesting ? 1 : 0;
            const ready = room.isHarvesting && room.ticksRemaining === 0;
            const idle = !room.isHarvesting;

            return (
              <div key={room.id} className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-white font-semibold text-sm">{room.name}</p>
                    <p className="text-green-500 text-xs font-medium">{room.strainName}</p>
                    <p className="text-gray-500 text-[10px]">{room.plantsCapacity} plants · {room.harvestYield} units · ${room.pricePerUnit}/unit</p>
                  </div>
                  <span className="text-2xl">
                    {ready ? '🌿' : idle ? '💤' : '🌱'}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${progress * 100}%`,
                      backgroundColor: ready ? '#22c55e' : '#65a30d',
                    }}
                  />
                </div>

                {ready ? (
                  <button
                    onClick={() => {
                      const units = harvestGrowRoom(room.id);
                      if (units > 0) {
                        const msg = op.seedStock > 0
                          ? `Harvested ${units} units! Auto-replanting… 🌱`
                          : `Harvested ${units} units! Buy seeds to replant.`;
                        addNotification(msg, 'success');
                      }
                    }}
                    className="w-full py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition"
                  >
                    🌿 Harvest Now!
                  </button>
                ) : idle ? (
                  <button
                    onClick={() => {
                      if (plantSeeds(room.id)) {
                        addNotification('Seeds planted! Growing…', 'success');
                      } else {
                        addNotification('No seeds in stock — buy some below', 'warning');
                      }
                    }}
                    disabled={op.seedStock < 1}
                    className={`w-full py-2 rounded-lg text-sm font-semibold transition ${
                      op.seedStock > 0
                        ? 'bg-lime-700 hover:bg-lime-600 text-lime-100'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    🌱 Plant Seeds {op.seedStock < 1 ? '(no seeds)' : `(${op.seedStock} available)`}
                  </button>
                ) : (
                  <p className="text-center text-gray-500 text-xs">
                    {room.ticksRemaining}s remaining
                  </p>
                )}
              </div>
            );
          })}

          {/* Buy new grow room */}
          {GROW_ROOM_DEFS.map((def) => {
            const alreadyOwned = op.growRooms.filter((r) => r.tier === def.tier).length;
            if (alreadyOwned >= 3) return null;
            if (def.tier === 1 && op.growRooms.length > 0) return null; // starter already placed
            const canAfford = dirtyCash >= def.purchaseCost;

            return (
              <button
                key={def.tier}
                onClick={() => {
                  if (buyGrowRoom(def.tier)) {
                    addNotification(`Added Tier ${def.tier} grow room!`, 'success');
                  } else {
                    addNotification(`Need ${formatMoney(def.purchaseCost)} dirty cash`, 'warning');
                  }
                }}
                disabled={!canAfford}
                className={`border-2 border-dashed rounded-xl p-4 text-center transition ${
                  canAfford ? 'border-green-600/50 hover:border-green-500 bg-green-900/10' : 'border-gray-700 opacity-50 cursor-not-allowed'
                }`}
              >
                <p className="text-green-400 text-lg mb-1">+</p>
                <p className="text-white text-xs font-semibold">{def.name}</p>
                <p className="text-green-400 text-[10px] font-medium">{def.strainName}</p>
                <p className="text-gray-400 text-[10px]">{def.plantsCapacity} plants · {def.harvestYield} units · ${def.pricePerUnit}/unit</p>
                <p className="text-yellow-400 text-xs font-bold mt-1">{formatMoney(def.purchaseCost)} 💵</p>
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
            <p className="text-gray-400 text-xs">{op.seedStock} in stock · {formatMoney(op.seedCostPerUnit)}/seed</p>
          </div>
          <span className="text-2xl">🌱</span>
        </div>
        <div className="flex gap-2">
          {[10, 25, 50].map((qty) => {
            const cost = op.seedCostPerUnit * qty;
            const canAfford = dirtyCash >= cost;
            return (
              <button
                key={qty}
                onClick={() => {
                  if (buySeed(qty)) {
                    addNotification(`Bought ${qty} seeds`, 'success');
                  } else {
                    addNotification(`Need ${formatMoney(cost)} dirty cash`, 'warning');
                  }
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
          Dealers sell your product passively at $10/unit ({currentDealerTier.cutPercent}% cut)
        </p>

        <div className="flex gap-2 mb-3">
          {[1, 3, 5].map((qty) => {
            const cost = currentDealerTier.hireCost * qty;
            const canAfford = dirtyCash >= cost;
            return (
              <button
                key={qty}
                onClick={() => {
                  if (hireDealers(qty)) {
                    addNotification(`Hired ${qty} dealer${qty > 1 ? 's' : ''}`, 'success');
                  } else {
                    addNotification(`Need ${formatMoney(cost)} dirty cash`, 'warning');
                  }
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
              if (upgradeDealerTier()) {
                addNotification(`Upgraded to ${nextDealerTier.name}!`, 'success');
              } else {
                addNotification(`Need ${formatMoney(nextDealerTier.hireCost * 3)} dirty cash`, 'warning');
              }
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
