import type { BusinessInstance } from '../../data/types';
import { BUSINESS_MAP } from '../../data/businesses';
import { useUIStore } from '../../store/uiStore';
import { calculateBusinessRevenue, calculateBusinessExpenses, formatMoney } from '../../engine/economy';
import BuildingSprite, { hasSprite } from './BuildingSprite';

interface BuildingLotProps {
  slotIndex: number;
  districtId: string;
  business: BusinessInstance | null;
  isAvailable: boolean;
  isLocked: boolean;
  buyLot?: { cost: number; canAfford: boolean; onBuy: () => void };
  size?: 'xs' | 'sm' | 'md';
}

export default function BuildingLot({
  slotIndex,
  districtId,
  business,
  isAvailable,
  isLocked,
  buyLot,
  size = 'md',
}: BuildingLotProps) {
  const selectSlot = useUIStore((s) => s.selectSlot);
  const selectBusiness = useUIStore((s) => s.selectBusiness);
  const selectedSlot = useUIStore((s) => s.selectedSlot);
  const selectedBusinessId = useUIStore((s) => s.selectedBusinessId);

  const rootSize = size === 'xs' ? 'w-[56px] h-[56px]' : size === 'sm' ? 'w-[72px] h-[72px]' : 'w-28 h-28';
  const iconSize = size === 'xs' ? 'text-base' : size === 'sm' ? 'text-xl' : 'text-2xl';
  const textMd = size === 'xs' ? 'text-[7px]' : size === 'sm' ? 'text-[8px]' : 'text-[10px]';
  const textSm = size === 'xs' ? 'text-[6px]' : size === 'sm' ? 'text-[7px]' : 'text-[9px]';

  const isSelected =
    (selectedSlot?.districtId === districtId && selectedSlot?.slotIndex === slotIndex) ||
    (business && selectedBusinessId === business.instanceId);

  if (buyLot) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); buyLot.onBuy(); }}
        onPointerDown={(e) => e.stopPropagation()}
        disabled={!buyLot.canAfford}
        style={{ touchAction: 'manipulation' }}
        className={`${rootSize} rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition ${
          buyLot.canAfford
            ? 'border-amber-600 hover:border-amber-400 bg-amber-900/20 hover:bg-amber-900/30'
            : 'border-gray-700 bg-gray-800/20 opacity-50 cursor-not-allowed'
        }`}
      >
        <span className="text-lg">🔒</span>
        <span className={`${textMd} font-semibold text-amber-400 text-center leading-tight`}>Buy Lot</span>
        <span className={`${textMd} text-amber-300 font-bold`}>${(buyLot.cost / 1000).toFixed(0)}k</span>
        <span className={`${textSm} text-gray-500`}>clean cash</span>
      </button>
    );
  }

  if (isLocked) {
    return (
      <div className={`${rootSize} rounded-lg bg-gray-800/30 border border-gray-800/50`} />
    );
  }

  if (!business && isAvailable) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); selectSlot(districtId, slotIndex); }}
        onPointerDown={(e) => e.stopPropagation()}
        style={{ touchAction: 'manipulation' }}
        className={`
          building-lot ${rootSize} rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1
          ${isSelected
            ? 'border-white bg-white/10'
            : 'border-gray-600 hover:border-gray-400 bg-gray-800/40'
          }
        `}
      >
        <span className={`${iconSize} text-gray-500`}>+</span>
        <span className={`${textMd} text-gray-500`}>Empty Lot</span>
      </button>
    );
  }

  if (!business) return null;

  const def = BUSINESS_MAP[business.businessDefId];
  if (!def) return null;

  const profit = calculateBusinessRevenue(business) - calculateBusinessExpenses(business);
  const tier = def.upgradeTiers[business.upgradeLevel];
  const spriteAvailable = hasSprite(business.businessDefId);
  const lotPx = size === 'xs' ? 56 : size === 'sm' ? 72 : 112;

  const handleClick = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    selectBusiness(business.instanceId);
  };

  if (spriteAvailable) {
    return (
      <button
        onClick={handleClick}
        onPointerDown={(e) => e.stopPropagation()}
        className={`relative rounded-lg overflow-hidden ${isSelected ? 'ring-2 ring-white/50' : ''}`}
        style={{ width: lotPx, height: lotPx, touchAction: 'manipulation' }}
      >
        <BuildingSprite businessDefId={business.businessDefId} w={lotPx} h={lotPx} />
        {/* Profit overlay — bottom */}
        <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-center pointer-events-none">
          <span className={`${textMd} font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {profit >= 0 ? '+' : ''}{formatMoney(profit)}/s
          </span>
        </div>
        {/* Name badge — top left */}
        <div className="absolute top-0.5 left-0.5 bg-black/50 rounded px-1 pointer-events-none">
          <span className={`${textSm} text-white/90 font-semibold`}>{def.displayName}</span>
        </div>
        {/* Supply indicator */}
        {business.supplyModifier < 1 && (
          <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-yellow-500 animate-pulse pointer-events-none" title="Low supply" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      onPointerDown={(e) => e.stopPropagation()}
      className={`
        building-lot ${rootSize} rounded-lg border-2 flex flex-col items-center justify-center gap-0.5 relative overflow-hidden
        ${isSelected ? 'border-white ring-2 ring-white/30' : 'border-transparent'}
      `}
      style={{
        backgroundColor: def.themeColor + '30',
        borderColor: isSelected ? 'white' : def.themeColor + '60',
        touchAction: 'manipulation',
      }}
    >
      {/* Building visual */}
      <div
        className="absolute inset-x-2 bottom-0 rounded-t-md pointer-events-none"
        style={{
          backgroundColor: def.themeColor + '50',
          height: `${40 + business.upgradeLevel * 12}%`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center pointer-events-none">
        <span className={iconSize}>{def.icon}</span>
        <span className={`${textMd} font-bold text-white/90 leading-tight text-center`}>
          {def.chainName}
        </span>
        <span className={`${textSm} text-white/60`}>{tier?.name}</span>
        <span className={`${textMd} font-semibold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {profit >= 0 ? '+' : ''}{formatMoney(profit)}/s
        </span>
      </div>

      {/* Supply indicator */}
      {business.supplyModifier < 1 && (
        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-yellow-500 animate-pulse pointer-events-none" title="Low supply" />
      )}
    </button>
  );
}
