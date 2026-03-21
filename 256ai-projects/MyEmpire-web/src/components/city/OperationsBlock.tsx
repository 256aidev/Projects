import { useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { GROW_ROOM_TYPE_DEFS } from '../../data/types';
import { formatUnits, formatMoney } from '../../engine/economy';
import { HOUSE_TIERS, HQ_TIERS } from '../../data/houseDefs';
import { sound } from '../../engine/sound';
import Tooltip from '../ui/Tooltip';
import {
  ROOM_SPRITE_MAP, LegalDistroSprite, GarageCarSprite,
  HouseSprite, BackyardSprite, HQSprite, WarehouseSprite,
} from './OperationSprites';
import type { GrowRoom } from '../../data/types';

const BLOCK_W = 164;
const BLOCK_H = 258;
const ROAD_W = 22;
const DOUBLE_H = BLOCK_H * 2 + ROAD_W;

const ROOM_VISUALS: Record<string, { label: string; border: string }> = {
  closet:        { label: "Grandma's House", border: '#8B7355' },
  shed:          { label: 'The Shed',        border: '#78716C' },
  garage:        { label: 'The Garage',      border: '#CA8A04' },
  small_grow:    { label: 'Grow House',      border: '#16A34A' },
  grow_facility: { label: 'Grow Facility',   border: '#0EA5E9' },
  large_grow:    { label: 'Large Grow',      border: '#7C3AED' },
};

function RoomBuilding({ roomTypeId, isOwned, room }: { roomTypeId: string; isOwned: boolean; room: GrowRoom | undefined }) {
  const vis = ROOM_VISUALS[roomTypeId] ?? { label: roomTypeId, border: '#555' };
  const Sprite = ROOM_SPRITE_MAP[roomTypeId];

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
    <div className="w-[72px] h-[78px] rounded-lg border-2 relative overflow-hidden"
      style={{ borderColor: vis.border + '80' }}>
      {/* SVG sprite background */}
      {Sprite && <Sprite w={72} h={72} />}
      {/* Overlay with text */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-1 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
        <span className="text-[9px] font-bold text-white/90 text-center leading-tight drop-shadow">{vis.label}</span>
        <span className="text-[8px] text-gray-300 drop-shadow">
          {activeSlots}/{totalSlots} growing
        </span>
        {readySlots > 0 && (
          <span className="text-[8px] text-green-400 font-bold animate-pulse drop-shadow">
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
        className="w-[72px] h-[78px] rounded-lg border-2 relative overflow-hidden transition hover:brightness-110"
        style={{ borderColor: isMax ? '#F59E0B' : '#F59E0B60' }}
      >
        <HouseSprite w={72} h={72} level={houseLevel} />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
          {isMax && <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />}
          <span className="text-[9px] font-bold text-amber-400 text-center leading-tight drop-shadow">{current.name}</span>
          {isMax ? (
            <span className="text-[7px] text-yellow-500 font-bold drop-shadow">MAX</span>
          ) : (
            <span className={`text-[7px] drop-shadow ${canAfford ? 'text-green-400' : 'text-gray-400'}`}>
              {formatMoney(next.upgradeCost)}
            </span>
          )}
        </div>
      </button>
    </Tooltip>
  );
}

function HouseBackyard() {
  const houseLevel = useGameStore(s => s.houseLevel ?? 0);
  const labels = ['Empty Lot', 'Small Yard', 'Pool', 'Big Pool', 'Estate Grounds'];
  return (
    <div className="w-[72px] h-[78px] rounded-lg border-2 relative overflow-hidden"
      style={{ borderColor: '#16A34A40' }}>
      <BackyardSprite w={72} h={72} level={houseLevel} />
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-1 bg-gradient-to-t from-black/60 via-transparent to-transparent">
        <span className="text-[9px] font-bold text-green-400 text-center leading-tight drop-shadow">
          {labels[houseLevel]}
        </span>
      </div>
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
        className="w-[72px] h-[78px] rounded-lg border-2 relative overflow-hidden transition hover:brightness-110"
        style={{ borderColor: isMax ? '#6366F1' : '#6366F160' }}
      >
        <HQSprite w={72} h={72} level={hqLevel} />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
          {isMax && <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />}
          <span className="text-[9px] font-bold text-indigo-400 text-center leading-tight drop-shadow">{current.name}</span>
          {isMax ? (
            <span className="text-[7px] text-indigo-400 font-bold drop-shadow">MAX</span>
          ) : (
            <span className={`text-[7px] drop-shadow ${canAfford ? 'text-green-400' : 'text-gray-400'}`}>
              {formatMoney(next.upgradeCost)}
            </span>
          )}
        </div>
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
          className="w-[72px] h-[78px] rounded-lg border-2 relative overflow-hidden hover:brightness-110 transition"
          style={{ borderColor: '#71717A60' }}
        >
          <GarageCarSprite w={72} h={72} />
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-1 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
            <span className="text-[9px] font-bold text-gray-300 text-center leading-tight drop-shadow">Large Garage</span>
            <span className="text-[8px] text-gray-400 drop-shadow">View Cars</span>
          </div>
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
          className="w-[72px] h-[78px] rounded-lg border-2 relative overflow-hidden hover:brightness-110 transition"
          style={{ borderColor: '#92400E60' }}
        >
          <WarehouseSprite w={72} h={72} />
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-1 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
            <span className="text-[9px] font-bold text-amber-400 text-center leading-tight drop-shadow">Warehouse</span>
            <span className="text-[8px] text-gray-300 drop-shadow">
              {totalOz > 0 ? `${formatUnits(totalOz)} stored` : 'Empty'}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
