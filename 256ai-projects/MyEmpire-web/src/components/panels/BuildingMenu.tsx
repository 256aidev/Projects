import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { BUSINESS_MAP } from '../../data/businesses';
import { DISTRICT_MAP } from '../../data/districts';
import { calculateLaunderCapacity, calculateDispensaryCapacity, calculateBusinessRevenue, calculateBusinessExpenses, formatMoney, formatUnits } from '../../engine/economy';

export default function BuildingMenu() {
  const selectedBusinessId = useUIStore((s) => s.selectedBusinessId);
  const closeAll = useUIStore((s) => s.closeAll);
  const addNotification = useUIStore((s) => s.addNotification);

  const businesses = useGameStore((s) => s.businesses);
  const cleanCash = useGameStore((s) => s.cleanCash);
  const operation = useGameStore((s) => s.operation);
  const upgradeBusiness = useGameStore((s) => s.upgradeBusiness);
  const sellBusiness = useGameStore((s) => s.sellBusiness);
  const setLaunderRate = useGameStore((s) => s.setLaunderRate);
  const setDispensaryRate = useGameStore((s) => s.setDispensaryRate);

  const biz = businesses.find((b) => b.instanceId === selectedBusinessId);
  if (!biz) return null;

  const def = BUSINESS_MAP[biz.businessDefId];
  const district = DISTRICT_MAP[biz.districtId];
  if (!def || !district) return null;

  const tier = def.upgradeTiers[biz.upgradeLevel];
  const nextTier = def.upgradeTiers[biz.upgradeLevel + 1];
  const revenue = calculateBusinessRevenue(biz);
  const expenses = calculateBusinessExpenses(biz);
  const sellValue = Math.floor(def.purchaseCost * 0.5);
  const canUpgrade = nextTier && cleanCash >= nextTier.upgradeCost;

  // avg street price from grow rooms
  const allSlots = operation.growRooms.flatMap((r) => r.slots);
  const avgPrice = allSlots.length > 0
    ? allSlots.reduce((sum, s) => sum + s.pricePerUnit, 0) / allSlots.length
    : 10;

  const upgradeLabel = def.isDispensary ? 'capacity' : 'launder';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={closeAll}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl p-5 w-80 shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{def.icon}</span>
          <div>
            <h3 className="text-white font-bold text-lg leading-tight">{def.displayName}</h3>
            <p className="text-gray-400 text-xs">{tier?.name} · {district.name}</p>
            {def.isDispensary && <p className="text-green-400 text-[10px] font-semibold mt-0.5">LEGAL DISPENSARY</p>}
          </div>
        </div>

        {def.isDispensary ? (
          /* ── DISPENSARY PANEL ── */
          <div className="bg-green-900/20 border border-green-800/30 rounded-xl p-3 mb-3">
            <p className="text-green-400 text-xs font-bold uppercase tracking-wide mb-2">🌿 Product Sales</p>
            <div className="grid grid-cols-2 gap-2 text-center mb-2">
              <div>
                <p className="text-[10px] text-gray-500">Capacity</p>
                <p className="text-green-400 font-bold text-sm">{calculateDispensaryCapacity(biz).toFixed(1)} oz/tick</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Price Efficiency</p>
                <p className="text-green-400 font-bold text-sm">{Math.round(def.launderEfficiency * 100)}% of street</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Queued</p>
                <p className="text-yellow-400 font-bold text-sm">{formatUnits(biz.productQueuedPerTick ?? 0)}/tick</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Clean/tick</p>
                <p className="text-blue-400 font-bold text-sm">{formatMoney((biz.productQueuedPerTick ?? 0) * avgPrice * def.launderEfficiency)}</p>
              </div>
            </div>
            <p className="text-gray-600 text-[9px] text-center mb-2">
              Avg street price: ${avgPrice.toFixed(0)}/oz · Stash: {formatUnits(Object.values(operation.productInventory).reduce((s, e) => s + e.oz, 0))}
            </p>
            <div>
              <p className="text-[10px] text-gray-400 mb-1">Oz to sell per tick</p>
              <input
                type="range"
                min={0}
                max={Math.ceil(calculateDispensaryCapacity(biz))}
                step={0.5}
                value={Math.min(biz.productQueuedPerTick ?? 0, Math.ceil(calculateDispensaryCapacity(biz)))}
                onChange={(e) => setDispensaryRate(biz.instanceId, Number(e.target.value))}
                className="w-full accent-green-500"
              />
            </div>
          </div>
        ) : (
          /* ── LAUNDERING PANEL ── */
          <div className="bg-green-900/20 border border-green-800/30 rounded-xl p-3 mb-3">
            <p className="text-green-400 text-xs font-bold uppercase tracking-wide mb-2">💰 Laundering</p>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-[10px] text-gray-500">Capacity</p>
                <p className="text-green-400 font-bold text-sm">{formatMoney(calculateLaunderCapacity(biz))}/s</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Efficiency</p>
                <p className="text-green-400 font-bold text-sm">{Math.round(def.launderEfficiency * 100)}%</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Queued</p>
                <p className="text-yellow-400 font-bold text-sm">{formatMoney(biz.dirtyQueuedPerTick)}/s</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Output</p>
                <p className="text-blue-400 font-bold text-sm">{formatMoney(biz.dirtyQueuedPerTick * def.launderEfficiency)}/s</p>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-[10px] text-gray-400 mb-1">Dirty cash to push/tick</p>
              <input
                type="range"
                min={0}
                max={Math.ceil(calculateLaunderCapacity(biz))}
                step={1}
                value={Math.min(biz.dirtyQueuedPerTick, Math.ceil(calculateLaunderCapacity(biz)))}
                onChange={(e) => setLaunderRate(biz.instanceId, Number(e.target.value))}
                className="w-full accent-green-500"
              />
            </div>
          </div>
        )}

        {/* Legit revenue */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gray-800 rounded-lg p-2 text-center">
            <p className="text-[10px] text-gray-500">Legit Revenue</p>
            <p className="text-blue-400 font-semibold text-sm">{formatMoney(revenue)}/s</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-2 text-center">
            <p className="text-[10px] text-gray-500">Expenses</p>
            <p className="text-red-400 font-semibold text-sm">{formatMoney(expenses)}/s</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {nextTier ? (
            <button
              onClick={() => {
                if (upgradeBusiness(biz.instanceId)) {
                  addNotification(`Upgraded to ${nextTier.name}!`, 'success');
                  closeAll();
                } else {
                  addNotification(`Need ${formatMoney(nextTier.upgradeCost)} clean cash 🏦`, 'warning');
                }
              }}
              disabled={!canUpgrade}
              className={`w-full py-2.5 rounded-xl text-sm font-bold transition ${canUpgrade ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
            >
              Upgrade to {nextTier.name} ({formatMoney(nextTier.upgradeCost)} 🏦)
              <br />
              <span className="font-normal text-xs opacity-80">
                +{Math.round((nextTier.launderMultiplier / tier.launderMultiplier - 1) * 100)}% {upgradeLabel}
                {' · '}+{Math.round((nextTier.revenueMultiplier / tier.revenueMultiplier - 1) * 100)}% revenue
                {nextTier.additionalEmployees > tier.additionalEmployees && ` · +${nextTier.additionalEmployees - tier.additionalEmployees} staff`}
              </span>
            </button>
          ) : (
            <div className="text-center text-xs text-yellow-400 py-2">MAX LEVEL</div>
          )}

          <button
            onClick={() => {
              sellBusiness(biz.instanceId);
              addNotification(`Sold for ${formatMoney(sellValue)} 🏦`, 'success');
              closeAll();
            }}
            className="w-full py-2 rounded-xl text-sm font-semibold bg-red-900/50 hover:bg-red-800/50 text-red-300 transition"
          >
            Sell ({formatMoney(sellValue)} 🏦)
          </button>

          <button onClick={closeAll} className="w-full py-2 rounded-xl text-sm text-gray-400 hover:text-white transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
