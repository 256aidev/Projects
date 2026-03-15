import { useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { GROW_ROOM_TYPE_DEFS } from '../../data/types';
import { formatUnits, formatMoney } from '../../engine/economy';
import { HOUSE_TIERS, HQ_TIERS } from '../../data/houseDefs';
import { sound } from '../../engine/sound';
import Tooltip from '../ui/Tooltip';
import type { GrowRoom } from '../../data/types';

const BLOCK_W = 164;
const BLOCK_H = 258;
const ROAD_W = 22;
const DOUBLE_H = BLOCK_H * 2 + ROAD_W; // spans 2 rows with road removed

/** Visual labels for each grow room type */
const ROOM_VISUALS: Record<string, { emoji: string; label: string; bg: string; border: string }> = {
  closet: { emoji: '🏠', label: "Grandma's House", bg: '#8B735530', border: '#8B7355' },
  shed:   { emoji: '🏚️', label: 'The Shed',        bg: '#78716C30', border: '#78716C' },
  garage: { emoji: '🔧', label: 'The Garage',      bg: '#CA8A0430', border: '#CA8A04' },
  small_grow: { emoji: '🏭', label: 'Grow House',   bg: '#16A34A30', border: '#16A34A' },
  grow_facility: { emoji: '🏗️', label: 'Grow Facility', bg: '#0EA5E930', border: '#0EA5E9' },
  large_grow:    { emoji: '🏢', label: 'Large Grow',    bg: '#7C3AED30', border: '#7C3AED' },
};

function RoomBuilding({ roomTypeId, isOwned, room }: { roomTypeId: string; isOwned: boolean; room: GrowRoom | undefined }) {
  const vis = ROOM_VISUALS[roomTypeId] ?? { emoji: '🏠', label: roomTypeId, bg: '#33333330', border: '#555' };

  if (!isOwned) {
    return (
      <div
        className="w-[72px] h-[78px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-0.5 opacity-40"
        style={{ borderColor: vis.border + '60' }}
      >
        <span className="text-xl">🔒</span>
        <span className="text-[8px] text-gray-400 text-center leading-tight">{vis.label}</span>
      </div>
    );
  }

  const activeSlots = room?.slots?.filter(s => s.isHarvesting).length ?? 0;
  const totalSlots = room?.slots?.length ?? 0;
  const readySlots = room?.slots?.filter(s => s.isHarvesting && s.ticksRemaining === 0).length ?? 0;

  return (
    <div
      className="w-[72px] h-[78px] rounded-lg border-2 flex flex-col items-center justify-center gap-0.5 relative overflow-hidden"
      style={{ backgroundColor: vis.bg, borderColor: vis.border + '80' }}
    >
      <div
        className="absolute inset-x-1 bottom-0 rounded-t-sm"
        style={{
          backgroundColor: vis.border + '40',
          height: `${30 + (totalSlots * 15)}%`,
        }}
      />
      <div className="relative z-10 flex flex-col items-center">
        <span className="text-xl leading-none">{vis.emoji}</span>
        <span className="text-[9px] font-bold text-white/90 text-center leading-tight">{vis.label}</span>
        <span className="text-[8px] text-gray-400">
          {activeSlots}/{totalSlots} growing
        </span>
        {readySlots > 0 && (
          <span className="text-[8px] text-green-400 font-bold animate-pulse">
            {readySlots} READY!
          </span>
        )}
      </div>
    </div>
  );
}

function HouseBuilding() {
  const houseLevel = useGameStore(s => s.houseLevel ?? 0);
  const cleanCash = useGameStore(s => s.cleanCash);
  const upgradeHouse = useGameStore(s => s.upgradeHouse);
  const addNotification = useUIStore(s => s.addNotification);

  const current = HOUSE_TIERS[houseLevel];
  const next = HOUSE_TIERS[houseLevel + 1];
  const isMax = !next;
  const canAfford = next ? cleanCash >= next.upgradeCost : false;

  return (
    <Tooltip text={`${current.name}: ${current.description}${next ? ` | Next: ${next.name} — ${formatMoney(next.upgradeCost)} clean` : ' | MAX LEVEL'}`}>
      <button
        onClick={() => {
          if (isMax) return;
          if (upgradeHouse()) { sound.play('upgrade'); addNotification(`House upgraded to ${HOUSE_TIERS[houseLevel + 1]?.name ?? 'MAX'}!`, 'success'); }
          else addNotification(next ? `Need ${formatMoney(next.upgradeCost)} clean cash` : 'Already maxed!', 'warning');
        }}
        disabled={isMax}
        className="w-[72px] h-[78px] rounded-lg border-2 flex flex-col items-center justify-center gap-0.5 relative overflow-hidden transition hover:brightness-110"
        style={{ backgroundColor: '#F59E0B20', borderColor: isMax ? '#F59E0B' : '#F59E0B60' }}
      >
        {isMax && <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />}
        <span className="text-xl leading-none">{current.icon}</span>
        <span className="text-[9px] font-bold text-amber-400 text-center leading-tight">{current.name}</span>
        {isMax ? (
          <span className="text-[7px] text-yellow-500 font-bold">MAX</span>
        ) : (
          <span className={`text-[7px] ${canAfford ? 'text-green-400' : 'text-gray-500'}`}>
            {formatMoney(next.upgradeCost)}
          </span>
        )}
      </button>
    </Tooltip>
  );
}

const BACKYARD_VISUALS = [
  { icon: '🏚️', label: 'Empty Lot', desc: 'Dirt and weeds' },
  { icon: '🌿', label: 'Small Yard', desc: 'Patch of grass' },
  { icon: '🏊', label: 'Pool', desc: 'Pool & patio' },
  { icon: '🏊', label: 'Big Pool', desc: 'Pool, garden & gazebo' },
  { icon: '🌴', label: 'Estate Grounds', desc: 'Nature paradise' },
];

function HouseBackyard() {
  const houseLevel = useGameStore(s => s.houseLevel ?? 0);
  const vis = BACKYARD_VISUALS[houseLevel];
  return (
    <div
      className="w-[72px] h-[78px] rounded-lg border-2 flex flex-col items-center justify-center gap-0.5 relative overflow-hidden"
      style={{ backgroundColor: '#16A34A15', borderColor: '#16A34A40' }}
    >
      <span className="text-xl leading-none">{vis.icon}</span>
      <span className="text-[9px] font-bold text-green-400 text-center leading-tight">{vis.label}</span>
      <span className="text-[8px] text-gray-500">{vis.desc}</span>
    </div>
  );
}

function HQBuilding() {
  const hqLevel = useGameStore(s => s.hqLevel ?? 0);
  const dirtyCash = useGameStore(s => s.dirtyCash);
  const upgradeHQ = useGameStore(s => s.upgradeHQ);
  const addNotification = useUIStore(s => s.addNotification);

  const current = HQ_TIERS[hqLevel];
  const next = HQ_TIERS[hqLevel + 1];
  const isMax = !next;
  const canAfford = next ? dirtyCash >= next.upgradeCost : false;

  return (
    <Tooltip text={`${current.name}: ${current.description}${current.crewCapBonus > 0 ? ` | +${current.crewCapBonus} crew slots` : ''}${current.planningBonus > 0 ? ` | +${Math.round(current.planningBonus * 100)}% attack` : ''}${next ? ` | Next: ${next.name} — ${formatMoney(next.upgradeCost)} dirty` : ' | MAX LEVEL'}`}>
      <button
        onClick={() => {
          if (isMax) return;
          if (upgradeHQ()) { sound.play('upgrade'); addNotification(`HQ upgraded to ${HQ_TIERS[hqLevel + 1]?.name ?? 'MAX'}!`, 'success'); }
          else addNotification(next ? `Need ${formatMoney(next.upgradeCost)} dirty cash` : 'Already maxed!', 'warning');
        }}
        disabled={isMax}
        className="w-[72px] h-[78px] rounded-lg border-2 flex flex-col items-center justify-center gap-0.5 relative overflow-hidden transition hover:brightness-110"
        style={{ backgroundColor: '#6366F120', borderColor: isMax ? '#6366F1' : '#6366F160' }}
      >
        {isMax && <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />}
        <span className="text-xl leading-none">{current.icon}</span>
        <span className="text-[9px] font-bold text-indigo-400 text-center leading-tight">{current.name}</span>
        {isMax ? (
          <span className="text-[7px] text-indigo-400 font-bold">MAX</span>
        ) : (
          <span className={`text-[7px] ${canAfford ? 'text-green-400' : 'text-gray-500'}`}>
            {formatMoney(next.upgradeCost)}
          </span>
        )}
      </button>
    </Tooltip>
  );
}

export default function OperationsBlock() {
  const growRooms = useGameStore(s => s.operation?.growRooms ?? []);
  const seedStock = useGameStore(s => s.operation?.seedStock ?? 0);
  const productInventory = useGameStore(s => s.operation?.productInventory ?? {});
  const setPanel = useUIStore(s => s.setPanel);
  const totalOz = useMemo(
    () => Object.values(productInventory).reduce((sum, e) => sum + (e?.oz ?? 0), 0),
    [productInventory],
  );

  const ownedTypeIds = useMemo(() => new Set(growRooms.map(r => r.typeId)), [growRooms]);
  const roomMap = useMemo(() => {
    const m = new Map<string, GrowRoom>();
    for (const r of growRooms) m.set(r.typeId, r);
    return m;
  }, [growRooms]);

  return (
    <div
      style={{ width: BLOCK_W, height: DOUBLE_H, borderColor: '#22c55e50', backgroundColor: '#22c55e08' }}
      className="rounded-lg border p-2 flex flex-col"
    >
      <p className="text-[10px] font-bold text-center mb-1 text-green-400">🌿 Home Turf — Operations</p>

      {/* Stats bar */}
      <div className="flex items-center justify-center gap-3 mb-2">
        <span className="text-[8px] text-gray-400">🌱 {seedStock} seeds</span>
        <span className="text-[8px] text-green-400 font-semibold">{formatUnits(totalOz)} stash</span>
      </div>

      {/* Grid of room buildings */}
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        {GROW_ROOM_TYPE_DEFS.map(def => (
          <RoomBuilding
            key={def.id}
            roomTypeId={def.id}
            isOwned={ownedTypeIds.has(def.id)}
            room={roomMap.get(def.id)}
          />
        ))}

        {/* Large Garage — right of legal_distribution */}
        <button
          onClick={() => setPanel('cars')}
          className="w-[72px] h-[78px] rounded-lg border-2 flex flex-col items-center justify-center gap-0.5 hover:bg-gray-700/30 transition relative overflow-hidden"
          style={{ backgroundColor: '#71717A20', borderColor: '#71717A60' }}
        >
          <span className="text-xl leading-none">🚗</span>
          <span className="text-[9px] font-bold text-gray-300 text-center leading-tight">Large Garage</span>
          <span className="text-[8px] text-gray-500">View Cars</span>
        </button>

        {/* Backyard — left side, upgrades with house */}
        <HouseBackyard />

        {/* House — right of backyard */}
        <HouseBuilding />

        {/* HQ — left side */}
        <HQBuilding />

        {/* Warehouse / Stash House — right of HQ */}
        <button
          onClick={() => setPanel('warehouse')}
          className="w-[72px] h-[78px] rounded-lg border-2 flex flex-col items-center justify-center gap-0.5 hover:bg-amber-900/20 transition relative overflow-hidden"
          style={{ backgroundColor: '#92400E20', borderColor: '#92400E60' }}
        >
          <span className="text-xl leading-none">📦</span>
          <span className="text-[9px] font-bold text-amber-400 text-center leading-tight">Warehouse</span>
          <span className="text-[8px] text-gray-400">
            {totalOz > 0 ? `${formatUnits(totalOz)} stored` : 'Empty'}
          </span>
        </button>
      </div>
    </div>
  );
}
