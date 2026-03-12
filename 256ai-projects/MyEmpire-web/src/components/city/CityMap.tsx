import type { BusinessInstance } from '../../data/types';
import { DISTRICTS, DISTRICT_MAP } from '../../data/districts';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { formatMoney } from '../../engine/economy';
import BuildingLot from './BuildingLot';

const BLOCK_W = 164;
const BLOCK_H = 258;
const COLS = 2;
const ROWS = 3;

// Deterministic block name from grid coords
function blockName(col: number, row: number): string {
  const dirs = ['East', 'West', 'North', 'South', 'Old', 'New', 'Upper', 'Lower', 'Central'];
  const types = ['Side', 'End', 'Quarter', 'Block', 'Row', 'Way', 'District', 'Heights'];
  return `${dirs[Math.abs(col * 3 + row * 7) % dirs.length]} ${types[Math.abs(col * 5 + row * 11) % types.length]}`;
}

type Cell =
  | { kind: 'district-unlocked'; id: string; name: string; color: string }
  | { kind: 'district-locked'; id: string; name: string; cost: number; color: string }
  | { kind: 'gen-locked'; id: string; name: string; cost: number }
  | null;

// ─── Sub-components ──────────────────────────────────────────────────────────

function LockedBlock({ name, cost, color, canAfford, onUnlock }: {
  name: string; cost: number; color: string; canAfford: boolean; onUnlock: () => void;
}) {
  return (
    <button
      onClick={onUnlock}
      style={{ width: BLOCK_W, height: BLOCK_H, borderColor: canAfford ? color + '80' : '#374151' }}
      className={`rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-colors ${
        canAfford ? 'bg-gray-800/40 hover:bg-gray-800/70' : 'bg-gray-900/30 opacity-50'
      }`}
    >
      <span className="text-2xl">🔒</span>
      <span className="text-[10px] font-semibold text-gray-300 text-center px-3 leading-tight">{name}</span>
      <span className="text-[11px] font-bold text-amber-400">{formatMoney(cost)}</span>
      <span className="text-[8px] text-gray-500">clean cash</span>
    </button>
  );
}

function UnlockedBlock({ districtId, name, color, businesses, unlockedSlots, cleanCash, onUnlockLot }: {
  districtId: string;
  name: string;
  color: string;
  businesses: BusinessInstance[];
  unlockedSlots: Record<string, number> | undefined;
  cleanCash: number;
  onUnlockLot: () => void;
}) {
  const districtUnlocked = unlockedSlots?.[districtId] ?? 2;
  const nextLotCost = 1000 * Math.pow(2, districtUnlocked - 2);
  const slotMap = new Map<number, BusinessInstance>();
  for (const biz of businesses) {
    if (biz.districtId === districtId) slotMap.set(biz.slotIndex, biz);
  }
  const totalSlots = COLS * ROWS; // 6

  return (
    <div
      style={{ width: BLOCK_W, borderColor: color + '50', backgroundColor: color + '12' }}
      className="rounded-lg border p-2"
    >
      <p
        className="text-[9px] font-bold text-center mb-1.5 truncate"
        style={{ color }}
      >
        {name}
      </p>
      <div className="grid grid-cols-2 gap-1">
        {Array.from({ length: totalSlots }, (_, i) => {
          const business = slotMap.get(i) ?? null;
          const isUnlocked = i < districtUnlocked;
          const isBuyable = i === districtUnlocked && i < totalSlots && !business;

          if (!isUnlocked && !business && !isBuyable) {
            return <div key={i} className="w-[72px] h-[72px] rounded bg-black/15" />;
          }

          return (
            <BuildingLot
              key={i}
              slotIndex={i}
              districtId={districtId}
              business={business}
              isAvailable={isUnlocked && !business}
              isLocked={false}
              buyLot={isBuyable ? {
                cost: nextLotCost,
                canAfford: cleanCash >= nextLotCost,
                onBuy: onUnlockLot,
              } : undefined}
              size="sm"
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function CityMap() {
  const unlockedDistricts = useGameStore((s) => s.unlockedDistricts);
  const generatedBlocks = useGameStore((s) => s.generatedBlocks);
  const nextBlockCost = useGameStore((s) => s.nextBlockCost);
  const cleanCash = useGameStore((s) => s.cleanCash);
  const businesses = useGameStore((s) => s.businesses);
  const unlockedSlots = useGameStore((s) => s.unlockedSlots);
  const unlockDistrict = useGameStore((s) => s.unlockDistrict);
  const unlockGeneratedBlock = useGameStore((s) => s.unlockGeneratedBlock);
  const unlockLot = useGameStore((s) => s.unlockLot);
  const addNotification = useUIStore((s) => s.addNotification);

  // Build a position → cell map
  const positionMap = new Map<string, Cell>();

  // All 6 defined districts (always visible)
  for (const d of DISTRICTS) {
    const key = `${d.gridPosition.col},${d.gridPosition.row}`;
    const unlocked = unlockedDistricts.includes(d.id);
    positionMap.set(key, unlocked
      ? { kind: 'district-unlocked', id: d.id, name: d.name, color: d.themeColor }
      : { kind: 'district-locked', id: d.id, name: d.name, cost: d.unlockCost, color: d.themeColor },
    );
  }

  // Generated blocks stored in state
  for (const block of Object.values(generatedBlocks)) {
    const key = `${block.col},${block.row}`;
    const unlocked = unlockedDistricts.includes(block.id);
    if (!positionMap.has(key)) {
      positionMap.set(key, unlocked
        ? { kind: 'district-unlocked', id: block.id, name: block.name, color: '#6B7280' }
        : { kind: 'gen-locked', id: block.id, name: block.name, cost: block.unlockCost },
      );
    }
  }

  // Dynamically compute virtual neighbor blocks not yet in state
  const covered = new Set(positionMap.keys());
  for (const districtId of unlockedDistricts) {
    let pos: { col: number; row: number } | undefined;
    const d = DISTRICT_MAP[districtId];
    if (d) {
      pos = d.gridPosition;
    } else if (districtId.startsWith('gen_')) {
      const parts = districtId.split('_');
      pos = { col: parseInt(parts[1]), row: parseInt(parts[2]) };
    }
    if (!pos) continue;
    for (const [dc, dr] of [[0, -1], [0, 1], [-1, 0], [1, 0]] as [number, number][]) {
      const nc = pos.col + dc, nr = pos.row + dr;
      const nkey = `${nc},${nr}`;
      if (covered.has(nkey)) continue;
      const id = `gen_${nc}_${nr}`;
      positionMap.set(nkey, { kind: 'gen-locked', id, name: blockName(nc, nr), cost: nextBlockCost });
      covered.add(nkey);
    }
  }

  // Bounding box
  let minCol = Infinity, maxCol = -Infinity, minRow = Infinity, maxRow = -Infinity;
  for (const key of positionMap.keys()) {
    const [c, r] = key.split(',').map(Number);
    minCol = Math.min(minCol, c); maxCol = Math.max(maxCol, c);
    minRow = Math.min(minRow, r); maxRow = Math.max(maxRow, r);
  }

  const gridCols = maxCol - minCol + 1;
  const gridRows = maxRow - minRow + 1;

  const cells: Cell[] = [];
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      cells.push(positionMap.get(`${c},${r}`) ?? null);
    }
  }

  return (
    <div className="flex-1 overflow-auto city-scroll">
      <div
        className="flex items-center justify-center"
        style={{ minWidth: '100%', minHeight: '100%', padding: '80px 48px 160px' }}
      >
        {/* Isometric wrapper */}
        <div style={{ transform: 'perspective(900px) rotateX(52deg) rotateZ(-8deg)', transformOrigin: 'center center' }}>
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${gridCols}, ${BLOCK_W}px)` }}
          >
            {cells.map((cell, i) => {
              if (!cell) {
                return <div key={i} style={{ width: BLOCK_W, height: BLOCK_H }} />;
              }

              if (cell.kind === 'district-unlocked') {
                return (
                  <UnlockedBlock
                    key={cell.id}
                    districtId={cell.id}
                    name={cell.name}
                    color={cell.color}
                    businesses={businesses}
                    unlockedSlots={unlockedSlots}
                    cleanCash={cleanCash}
                    onUnlockLot={() => unlockLot(cell.id)}
                  />
                );
              }

              if (cell.kind === 'district-locked') {
                return (
                  <LockedBlock
                    key={cell.id}
                    name={cell.name}
                    cost={cell.cost}
                    color={cell.color}
                    canAfford={cleanCash >= cell.cost}
                    onUnlock={() => {
                      if (unlockDistrict(cell.id)) {
                        addNotification(`Unlocked ${cell.name}!`, 'success');
                      } else {
                        addNotification(`Need ${formatMoney(cell.cost)} clean cash`, 'warning');
                      }
                    }}
                  />
                );
              }

              // gen-locked
              return (
                <LockedBlock
                  key={cell.id}
                  name={cell.name}
                  cost={cell.cost}
                  color="#4B5563"
                  canAfford={cleanCash >= cell.cost}
                  onUnlock={() => {
                    if (unlockGeneratedBlock(cell.id)) {
                      addNotification(`Expanded into ${cell.name}!`, 'success');
                    } else {
                      addNotification(`Need ${formatMoney(cell.cost)} clean cash`, 'warning');
                    }
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
