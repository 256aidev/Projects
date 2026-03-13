import { useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { GROW_ROOM_TYPE_DEFS } from '../../data/types';
import { formatUnits } from '../../engine/economy';
import type { GrowRoom } from '../../data/types';

const BLOCK_W = 164;

/** Visual labels for each grow room type */
const ROOM_VISUALS: Record<string, { emoji: string; label: string; bg: string; border: string }> = {
  closet: { emoji: '🏠', label: "Grandma's House", bg: '#8B735530', border: '#8B7355' },
  shed:   { emoji: '🏚️', label: 'The Shed',        bg: '#78716C30', border: '#78716C' },
  garage: { emoji: '🔧', label: 'The Garage',      bg: '#CA8A0430', border: '#CA8A04' },
  small_grow: { emoji: '🏭', label: 'Grow House',   bg: '#16A34A30', border: '#16A34A' },
  grow_facility: { emoji: '🏗️', label: 'Grow Facility', bg: '#0EA5E930', border: '#0EA5E9' },
};

function RoomBuilding({ roomTypeId, isOwned, room }: { roomTypeId: string; isOwned: boolean; room: GrowRoom | undefined }) {
  const vis = ROOM_VISUALS[roomTypeId] ?? { emoji: '🏠', label: roomTypeId, bg: '#33333330', border: '#555' };

  if (!isOwned) {
    return (
      <div
        className="w-[72px] h-[72px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-0.5 opacity-40"
        style={{ borderColor: vis.border + '60' }}
      >
        <span className="text-lg">🔒</span>
        <span className="text-[8px] text-gray-400 text-center leading-tight">{vis.label}</span>
      </div>
    );
  }

  const activeSlots = room?.slots?.filter(s => s.isHarvesting).length ?? 0;
  const totalSlots = room?.slots?.length ?? 0;
  const readySlots = room?.slots?.filter(s => s.isHarvesting && s.ticksRemaining === 0).length ?? 0;

  return (
    <div
      className="w-[72px] h-[72px] rounded-lg border-2 flex flex-col items-center justify-center gap-0.5 relative overflow-hidden"
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
        <span className="text-lg leading-none">{vis.emoji}</span>
        <span className="text-[8px] font-bold text-white/90 text-center leading-tight">{vis.label}</span>
        <span className="text-[7px] text-gray-400">
          {activeSlots}/{totalSlots} growing
        </span>
        {readySlots > 0 && (
          <span className="text-[7px] text-green-400 font-bold animate-pulse">
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
  const dealerCount = useGameStore(s => s.operation?.dealerCount ?? 0);
  const productInventory = useGameStore(s => s.operation?.productInventory ?? {});
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
      style={{ width: BLOCK_W, borderColor: '#22c55e50', backgroundColor: '#22c55e08' }}
      className="rounded-lg border p-2"
    >
      <p className="text-[9px] font-bold text-center mb-1 text-green-400">🌿 Operations</p>

      <div className="flex items-center justify-center gap-2 mb-1.5">
        <span className="text-[7px] text-gray-400">🌱 {seedStock}</span>
        <span className="text-[7px] text-gray-400">🤝 {dealerCount}</span>
        <span className="text-[7px] text-green-400">{formatUnits(totalOz)}</span>
      </div>

      <div className="grid grid-cols-2 gap-1">
        {GROW_ROOM_TYPE_DEFS.map(def => (
          <RoomBuilding
            key={def.id}
            roomTypeId={def.id}
            isOwned={ownedTypeIds.has(def.id)}
            room={roomMap.get(def.id)}
          />
        ))}
        {dealerCount > 0 && (
          <div
            className="w-[72px] h-[72px] rounded-lg border-2 flex flex-col items-center justify-center gap-0.5"
            style={{ backgroundColor: '#6366F130', borderColor: '#6366F180' }}
          >
            <span className="text-lg leading-none">🤝</span>
            <span className="text-[8px] font-bold text-white/90 text-center leading-tight">Dealer HQ</span>
            <span className="text-[7px] text-indigo-400">{dealerCount} dealers</span>
          </div>
        )}
      </div>
    </div>
  );
}
