import { useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { GROW_ROOM_TYPE_DEFS } from '../../data/types';
import { formatUnits } from '../../engine/economy';
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
        className="w-[72px] h-[88px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-0.5 opacity-40"
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
      className="w-[72px] h-[88px] rounded-lg border-2 flex flex-col items-center justify-center gap-0.5 relative overflow-hidden"
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

        {/* Vacant lots — future expansion space */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`vacant-${i}`}
            className="w-[72px] h-[88px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-0.5 opacity-25"
            style={{ borderColor: '#22c55e30' }}
          >
            <span className="text-lg text-gray-600">🏗️</span>
            <span className="text-[8px] text-gray-500 text-center leading-tight">Vacant Lot</span>
          </div>
        ))}

        {/* Warehouse — last building in the block */}
        <button
          onClick={() => setPanel('warehouse')}
          className="w-[72px] h-[88px] rounded-lg border-2 flex flex-col items-center justify-center gap-0.5 hover:bg-amber-900/20 transition relative overflow-hidden"
          style={{ backgroundColor: '#92400E20', borderColor: '#92400E60' }}
        >
          <span className="text-xl leading-none">📦</span>
          <span className="text-[9px] font-bold text-amber-400 text-center leading-tight">Stash House</span>
          <span className="text-[8px] text-gray-400">
            {totalOz > 0 ? `${formatUnits(totalOz)} stored` : 'Empty'}
          </span>
        </button>
      </div>
    </div>
  );
}
