import { BUSINESSES } from '../../data/businesses';
import { DISTRICT_MAP } from '../../data/districts';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { formatMoney } from '../../engine/economy';

export default function BuyBusinessPanel() {
  const selectedSlot = useUIStore((s) => s.selectedSlot);
  const closeAll = useUIStore((s) => s.closeAll);
  const addNotification = useUIStore((s) => s.addNotification);

  const cleanCash = useGameStore((s) => s.cleanCash);
  const purchaseBusiness = useGameStore((s) => s.purchaseBusiness);

  if (!selectedSlot) return null;

  const district = DISTRICT_MAP[selectedSlot.districtId];
  const isGenBlock = !district && selectedSlot.districtId.startsWith('gen_');
  if (!district && !isGenBlock) return null;

  const revenueMultiplier = district?.revenueMultiplier ?? 1;
  const opCostMultiplier = district?.operatingCostMultiplier ?? 1;
  const districtName = district?.name ?? 'New Block';

  const available = BUSINESSES.filter((b) =>
    b.isRental
      ? true  // rentals allowed everywhere
      : b.allowedDistrictIds.includes(selectedSlot.districtId),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeAll}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl p-5 w-80 shadow-2xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-bold text-lg mb-1">Buy Business</h3>
        <p className="text-gray-400 text-xs mb-4">{districtName} - Lot #{selectedSlot.slotIndex + 1}</p>

        <div className="flex flex-col gap-3">
          {available.map((def) => {
            const canAfford = cleanCash >= def.purchaseCost;
            const baseProfitPerSec = (def.baseRevenuePerTick * revenueMultiplier)
              - (def.baseOperatingCostPerTick * opCostMultiplier)
              - (def.baseEmployeeCount * def.employeeSalaryPerTick);

            return (
              <button
                key={def.id}
                onClick={() => {
                  if (purchaseBusiness(def.id, selectedSlot.districtId, selectedSlot.slotIndex)) {
                    addNotification(`Built ${def.displayName}!`, 'success');
                    closeAll();
                  } else {
                    addNotification(`Need ${formatMoney(def.purchaseCost)} clean cash 🏦`, 'warning');
                  }
                }}
                disabled={!canAfford}
                className={`
                  flex items-center gap-3 p-3 rounded-xl text-left transition
                  ${canAfford
                    ? 'bg-gray-800 hover:bg-gray-750 hover:ring-1 hover:ring-gray-600'
                    : 'bg-gray-800/50 opacity-50 cursor-not-allowed'
                  }
                `}
              >
                <span className="text-3xl">{def.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{def.displayName}</p>
                  <p className="text-gray-400 text-[10px] leading-tight">{def.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-yellow-400 text-xs font-bold">🏦 {formatMoney(def.purchaseCost)}</span>
                    <span className="text-green-400 text-[10px]">+{formatMoney(baseProfitPerSec)}/s</span>
                  </div>
                </div>
              </button>
            );
          })}

          {available.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">No businesses available for this district</p>
          )}
        </div>

        <button
          onClick={closeAll}
          className="w-full mt-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
