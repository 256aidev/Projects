import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { BUSINESS_MAP } from '../../data/businesses';
import { DISTRICT_MAP } from '../../data/districts';
import { calculateLaunderCapacity, calculateBusinessRevenue, calculateBusinessExpenses, formatMoney } from '../../engine/economy';

export default function BuildingMenu() {
  const selectedBusinessId = useUIStore((s) => s.selectedBusinessId);
  const closeAll = useUIStore((s) => s.closeAll);
  const addNotification = useUIStore((s) => s.addNotification);

  const businesses = useGameStore((s) => s.businesses);
  const cleanCash = useGameStore((s) => s.cleanCash);
  const upgradeBusiness = useGameStore((s) => s.upgradeBusiness);
  const sellBusiness = useGameStore((s) => s.sellBusiness);
  const setLaunderRate = useGameStore((s) => s.setLaunderRate);

  const biz = businesses.find((b) => b.instanceId === selectedBusinessId);
  if (!biz) return null;

  const def = BUSINESS_MAP[biz.businessDefId];
  const district = DISTRICT_MAP[biz.districtId];
  if (!def || !district) return null;

  const tier = def.upgradeTiers[biz.upgradeLevel];
  const nextTier = def.upgradeTiers[biz.upgradeLevel + 1];
  const revenue = calculateBusinessRevenue(biz);
  const expenses = calculateBusinessExpenses(biz);
  const launderCap = calculateLaunderCapacity(biz);
  const sellValue = Math.floor(def.purchaseCost * 0.5);
  const canUpgrade = nextTier && cleanCash >= nextTier.upgradeCost;

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
          </div>
        </div>

        {/* Laundering stats */}
        <div className="bg-green-900/20 border border-green-800/30 rounded-xl p-3 mb-3">
          <p className="text-green-400 text-xs font-bold uppercase tracking-wide mb-2">💰 Laundering</p>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <p className="text-[10px] text-gray-500">Capacity</p>
              <p className="text-green-400 font-bold text-sm">{formatMoney(launderCap)}/s</p>
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

          {/* Launder rate slider */}
          <div className="mt-3">
            <p className="text-[10px] text-gray-400 mb-1">Dirty cash to push/tick</p>
            <input
              type="range"
              min={0}
              max={Math.ceil(launderCap)}
              step={1}
              value={Math.min(biz.dirtyQueuedPerTick, Math.ceil(launderCap))}
              onChange={(e) => setLaunderRate(biz.instanceId, Number(e.target.value))}
              className="w-full accent-green-500"
            />
          </div>
        </div>

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
