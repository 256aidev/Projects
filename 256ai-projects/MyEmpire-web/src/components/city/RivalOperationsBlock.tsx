import { useGameStore } from '../../store/gameStore';
import Tooltip from '../ui/Tooltip';
import type { RivalSyndicate } from '../../data/types';

const BLOCK_W = 164;

/** 6 buildings in a rival's turf */
const BUILDINGS: { icon: string; label: string; bgColor: string }[] = [
  { icon: '🏠', label: 'Home', bgColor: '#8B735520' },
  { icon: '🏢', label: 'HQ', bgColor: '#6366F120' },
  { icon: '🚗', label: 'Garage', bgColor: '#71717A20' },
  { icon: '🕳️', label: 'Hideout', bgColor: '#78716C20' },
  { icon: '📦', label: 'Warehouse', bgColor: '#92400E20' },
  { icon: '🌿', label: 'Grow House', bgColor: '#16A34A20' },
];

interface Props {
  rivalIndex: number;
}

export default function RivalOperationsBlock({ rivalIndex }: Props) {
  const rival = useGameStore(s => s.rivals?.[rivalIndex]) as RivalSyndicate | undefined;
  const tickCount = useGameStore(s => s.tickCount);

  // Rival not yet active or doesn't exist
  if (!rival) {
    return (
      <div
        style={{ width: BLOCK_W }}
        className="rounded-lg border border-dashed border-gray-700/40 p-2 flex flex-col items-center justify-center opacity-30"
      >
        <span className="text-2xl">❓</span>
        <p className="text-[10px] text-gray-600 mt-1">Unknown Territory</p>
        <p className="text-[8px] text-gray-700">A rival will claim this turf...</p>
      </div>
    );
  }

  const notYetActive = (rival.activeAtTick ?? 0) > tickCount;
  const defeated = rival.isDefeated;

  if (notYetActive) {
    return (
      <div
        style={{ width: BLOCK_W, borderColor: '#555' }}
        className="rounded-lg border border-dashed p-2 flex flex-col items-center justify-center opacity-40"
      >
        <span className="text-2xl">🔒</span>
        <p className="text-[10px] text-gray-500 mt-1">Unclaimed Territory</p>
        <p className="text-[8px] text-gray-600">A new rival is moving in soon...</p>
      </div>
    );
  }

  return (
    <Tooltip text={`${rival.name}'s turf — Power: ${Math.floor(rival.power)} | Hitmen: ${rival.hitmen} | Businesses: ${rival.businesses.length}`}>
      <div
        style={{ width: BLOCK_W, borderColor: defeated ? '#555' : rival.color + '60', backgroundColor: defeated ? '#11111140' : rival.color + '08' }}
        className={`rounded-lg border p-2 flex flex-col ${defeated ? 'opacity-40' : ''}`}
      >
        {/* Header */}
        <div className="flex items-center gap-1.5 mb-1.5 justify-center">
          <span className="text-sm">{rival.icon}</span>
          <p className="text-[10px] font-bold" style={{ color: defeated ? '#666' : rival.color }}>
            {rival.name}
          </p>
          {defeated && <span className="text-[8px] text-red-500 font-bold">DEFEATED</span>}
        </div>

        {/* Rival operations label */}
        <p className="text-[8px] text-gray-500 text-center mb-1.5">Rival Operations</p>

        {/* 2x3 building grid */}
        <div className="grid grid-cols-2 gap-1">
          {BUILDINGS.map((b, i) => {
            const active = !defeated;
            return (
              <div
                key={i}
                className={`rounded border flex flex-col items-center justify-center py-1.5 px-1 ${defeated ? 'border-gray-800 opacity-50' : 'border-gray-700/50'}`}
                style={{ backgroundColor: active ? b.bgColor : '#11111140' }}
              >
                <span className="text-sm leading-none">{defeated ? '💀' : b.icon}</span>
                <span className="text-[8px] text-gray-400 mt-0.5">{b.label}</span>
              </div>
            );
          })}
        </div>

        {/* Rival stats */}
        {!defeated && (
          <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[7px]">
            <span className="text-gray-500">Power:</span>
            <span className="text-white font-bold">{Math.floor(rival.power)}</span>
            <span className="text-gray-500">Hitmen:</span>
            <span className="text-white">{rival.hitmen}</span>
            <span className="text-gray-500">Fronts:</span>
            <span className="text-white">{rival.businesses.length}</span>
            <span className="text-gray-500">Weakness:</span>
            <span className={rival.weakness > 50 ? 'text-red-400' : 'text-yellow-400'}>{Math.floor(rival.weakness)}%</span>
          </div>
        )}
      </div>
    </Tooltip>
  );
}
