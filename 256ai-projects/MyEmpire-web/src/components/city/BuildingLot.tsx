import type { BusinessInstance } from '../../data/types';
import { BUSINESS_MAP } from '../../data/businesses';
import { useUIStore } from '../../store/uiStore';
import { calculateBusinessRevenue, calculateBusinessExpenses, formatMoney } from '../../engine/economy';

interface BuildingLotProps {
  slotIndex: number;
  districtId: string;
  business: BusinessInstance | null;
  isAvailable: boolean;
  isLocked: boolean;
}

export default function BuildingLot({
  slotIndex,
  districtId,
  business,
  isAvailable,
  isLocked,
}: BuildingLotProps) {
  const selectSlot = useUIStore((s) => s.selectSlot);
  const selectBusiness = useUIStore((s) => s.selectBusiness);
  const selectedSlot = useUIStore((s) => s.selectedSlot);
  const selectedBusinessId = useUIStore((s) => s.selectedBusinessId);

  const isSelected =
    (selectedSlot?.districtId === districtId && selectedSlot?.slotIndex === slotIndex) ||
    (business && selectedBusinessId === business.instanceId);

  if (isLocked) {
    return (
      <div className="w-28 h-28 rounded-lg bg-gray-800/30 border border-gray-800/50" />
    );
  }

  if (!business && isAvailable) {
    return (
      <button
        onClick={() => selectSlot(districtId, slotIndex)}
        className={`
          building-lot w-28 h-28 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1
          ${isSelected
            ? 'border-white bg-white/10'
            : 'border-gray-600 hover:border-gray-400 bg-gray-800/40'
          }
        `}
      >
        <span className="text-2xl text-gray-500">+</span>
        <span className="text-[10px] text-gray-500">Empty Lot</span>
      </button>
    );
  }

  if (!business) return null;

  const def = BUSINESS_MAP[business.businessDefId];
  if (!def) return null;

  const profit = calculateBusinessRevenue(business) - calculateBusinessExpenses(business);
  const tier = def.upgradeTiers[business.upgradeLevel];

  return (
    <button
      onClick={() => selectBusiness(business.instanceId)}
      className={`
        building-lot w-28 h-28 rounded-lg border-2 flex flex-col items-center justify-center gap-0.5 relative overflow-hidden
        ${isSelected ? 'border-white ring-2 ring-white/30' : 'border-transparent'}
      `}
      style={{
        backgroundColor: def.themeColor + '30',
        borderColor: isSelected ? 'white' : def.themeColor + '60',
      }}
    >
      {/* Building visual */}
      <div
        className="absolute inset-x-2 bottom-0 rounded-t-md"
        style={{
          backgroundColor: def.themeColor + '50',
          height: `${40 + business.upgradeLevel * 12}%`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        <span className="text-2xl">{def.icon}</span>
        <span className="text-[10px] font-bold text-white/90 leading-tight text-center">
          {def.chainName}
        </span>
        <span className="text-[9px] text-white/60">{tier?.name}</span>
        <span className={`text-[10px] font-semibold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {profit >= 0 ? '+' : ''}{formatMoney(profit)}/s
        </span>
      </div>

      {/* Supply indicator */}
      {business.supplyModifier < 1 && (
        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-yellow-500 animate-pulse" title="Low supply" />
      )}
    </button>
  );
}
