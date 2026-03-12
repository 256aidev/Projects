import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { DISTRICT_MAP } from '../../data/districts';
import BuildingLot from './BuildingLot';

export default function CityMap() {
  const activeDistrictId = useUIStore((s) => s.activeDistrictId);
  const businesses = useGameStore((s) => s.businesses);
  const unlockedSlots = useGameStore((s) => s.unlockedSlots);
  const cleanCash = useGameStore((s) => s.cleanCash);
  const unlockLot = useGameStore((s) => s.unlockLot);
  const district = DISTRICT_MAP[activeDistrictId];

  if (!district) return null;

  const { rows, cols } = district.gridLayout;
  const totalSlots = rows * cols;
  const districtUnlocked = unlockedSlots?.[activeDistrictId] ?? 2;

  // Cost for the next lot to unlock
  const nextLotCost = 1000 * Math.pow(2, districtUnlocked - 2);

  // Map businesses to slots
  const slotMap = new Map<number, typeof businesses[0]>();
  for (const biz of businesses) {
    if (biz.districtId === activeDistrictId) {
      slotMap.set(biz.slotIndex, biz);
    }
  }

  return (
    <div className="flex-1 overflow-auto city-scroll p-6 flex items-center justify-center">
      <div className="relative">
        {/* District name */}
        <div className="text-center mb-4">
          <h2
            className="text-xl font-bold text-white/90"
            style={{ textShadow: `0 0 20px ${district.themeColor}40` }}
          >
            {district.name}
          </h2>
          <p className="text-xs text-gray-400 mt-1">{district.description}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {businesses.filter((b) => b.districtId === activeDistrictId).length} built · {districtUnlocked} lots open
          </p>
        </div>

        {/* City grid */}
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
          }}
        >
          {Array.from({ length: totalSlots }, (_, i) => {
            const business = slotMap.get(i);
            const isUnlocked = i < districtUnlocked;
            const isBusinessSlot = i < district.maxBusinessSlots;
            const isBuyableLot = i === districtUnlocked && isBusinessSlot && !business;

            if (!isUnlocked && !business && !isBuyableLot) return null;

            return (
              <BuildingLot
                key={i}
                slotIndex={i}
                districtId={activeDistrictId}
                business={business ?? null}
                isAvailable={isUnlocked && isBusinessSlot && !business}
                isLocked={!isBusinessSlot}
                buyLot={isBuyableLot ? { cost: nextLotCost, canAfford: cleanCash >= nextLotCost, onBuy: () => unlockLot(activeDistrictId) } : undefined}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
