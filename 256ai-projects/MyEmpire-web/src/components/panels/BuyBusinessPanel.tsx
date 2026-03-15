import { BUSINESSES } from '../../data/businesses';
import { DISTRICT_MAP } from '../../data/districts';
import { LOT_BUILD_COOLDOWN } from '../../data/types';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { formatMoney } from '../../engine/economy';
import { sound } from '../../engine/sound';
import Tooltip from '../ui/Tooltip';

export default function BuyBusinessPanel() {
  const selectedSlot = useUIStore((s) => s.selectedSlot);
  const closeAll = useUIStore((s) => s.closeAll);
  const addNotification = useUIStore((s) => s.addNotification);

  const cleanCash = useGameStore((s) => s.cleanCash);
  const tickCount = useGameStore((s) => s.tickCount);
  const lotBuildTimers = useGameStore((s) => s.lotBuildTimers);
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
      : isGenBlock || b.allowedDistrictIds.includes(selectedSlot.districtId),
  );

  // Check lot build cooldown
  const slotTimerKey = `${selectedSlot.districtId}:${selectedSlot.slotIndex}`;
  const lotBoughtAt = lotBuildTimers?.[slotTimerKey];
  const ticksElapsed = lotBoughtAt != null ? tickCount - lotBoughtAt : LOT_BUILD_COOLDOWN;
  const onCooldown = ticksElapsed < LOT_BUILD_COOLDOWN;
  const cooldownRemaining = LOT_BUILD_COOLDOWN - ticksElapsed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeAll}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl p-5 w-80 shadow-2xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-bold text-lg mb-1">Buy Business</h3>
        <p className="text-gray-400 text-xs mb-4">{districtName} - Lot #{selectedSlot.slotIndex + 1}</p>

        {onCooldown && (
          <div className="bg-orange-900/30 border border-orange-700/50 rounded-lg p-3 mb-4 text-center">
            <p className="text-orange-400 font-semibold text-sm">Lot Under Development</p>
            <p className="text-orange-300 text-xs mt-1">Ready to build in {cooldownRemaining}s</p>
            <div className="w-full h-1.5 bg-gray-800 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${(ticksElapsed / LOT_BUILD_COOLDOWN) * 100}%` }} />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {available.map((def) => {
            const canAfford = cleanCash >= def.purchaseCost && !onCooldown;
            const baseProfitPerSec = (def.baseRevenuePerTick * revenueMultiplier)
              - (def.baseOperatingCostPerTick * opCostMultiplier)
              - (def.baseEmployeeCount * def.employeeSalaryPerTick);

            return (
              <Tooltip text={def.description || "Purchase this front business to launder dirty cash."}>
              <button
                key={def.id}
                onClick={() => {
                  if (purchaseBusiness(def.id, selectedSlot.districtId, selectedSlot.slotIndex)) {
                    sound.play('buy');
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
              </Tooltip>
            );
          })}

          {available.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">No businesses available for this district</p>
          )}
        </div>

        <Tooltip text="Close this panel.">
        <button
          onClick={closeAll}
          className="w-full mt-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition"
        >
          Cancel
        </button>
        </Tooltip>
      </div>
    </div>
  );
}
