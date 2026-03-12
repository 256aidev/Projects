import { useRef, useState } from 'react';
import type { BusinessInstance } from '../../data/types';
import { DISTRICTS, DISTRICT_MAP } from '../../data/districts';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { formatMoney } from '../../engine/economy';
import BuildingLot from './BuildingLot';

const BLOCK_W = 164;
const BLOCK_H = 258;

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
        canAfford ? 'bg-gray-800/40 active:bg-gray-800/70' : 'bg-gray-900/30 opacity-50'
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

  return (
    <div
      style={{ width: BLOCK_W, borderColor: color + '50', backgroundColor: color + '12' }}
      className="rounded-lg border p-2"
    >
      <p className="text-[9px] font-bold text-center mb-1.5 truncate" style={{ color }}>{name}</p>
      <div className="grid grid-cols-2 gap-1">
        {Array.from({ length: 6 }, (_, i) => {
          const business = slotMap.get(i) ?? null;
          const isUnlocked = i < districtUnlocked;
          const isBuyable = i === districtUnlocked && i < 6 && !business;

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

  // Pan / zoom state
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.78);
  const dragging = useRef(false);
  const hasMoved = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('button')) return;
    dragging.current = true;
    hasMoved.current = false;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) hasMoved.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset(o => ({ x: o.x + dx, y: o.y + dy }));
  }
  function onPointerUp() { dragging.current = false; }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    setZoom(z => Math.max(0.3, Math.min(2.2, z * (e.deltaY < 0 ? 1.12 : 0.9))));
  }

  // Build position map
  const positionMap = new Map<string, Cell>();

  for (const d of DISTRICTS) {
    const key = `${d.gridPosition.col},${d.gridPosition.row}`;
    const unlocked = unlockedDistricts.includes(d.id);
    positionMap.set(key, unlocked
      ? { kind: 'district-unlocked', id: d.id, name: d.name, color: d.themeColor }
      : { kind: 'district-locked', id: d.id, name: d.name, cost: d.unlockCost, color: d.themeColor },
    );
  }

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

  // Dynamically compute virtual neighbor blocks
  const covered = new Set(positionMap.keys());
  for (const districtId of unlockedDistricts) {
    let pos: { col: number; row: number } | undefined;
    const d = DISTRICT_MAP[districtId];
    if (d) pos = d.gridPosition;
    else if (districtId.startsWith('gen_')) {
      const p = districtId.split('_');
      pos = { col: parseInt(p[1]), row: parseInt(p[2]) };
    }
    if (!pos) continue;
    for (const [dc, dr] of [[0,-1],[0,1],[-1,0],[1,0]] as [number,number][]) {
      const nc = pos.col + dc, nr = pos.row + dr;
      const nkey = `${nc},${nr}`;
      if (covered.has(nkey)) continue;
      positionMap.set(nkey, { kind: 'gen-locked', id: `gen_${nc}_${nr}`, name: blockName(nc, nr), cost: nextBlockCost });
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
    <div
      className="flex-1 relative overflow-hidden bg-gray-950 select-none"
      style={{ cursor: dragging.current ? 'grabbing' : 'grab', touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
    >
      {/* Map canvas — pan + zoom wrapper */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            pointerEvents: 'auto',
          }}
        >
          {/* Isometric tilt */}
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
                        if (unlockDistrict(cell.id)) addNotification(`Unlocked ${cell.name}!`, 'success');
                        else addNotification(`Need ${formatMoney(cell.cost)} clean cash`, 'warning');
                      }}
                    />
                  );
                }

                return (
                  <LockedBlock
                    key={cell.id}
                    name={cell.name}
                    cost={cell.cost}
                    color="#4B5563"
                    canAfford={cleanCash >= cell.cost}
                    onUnlock={() => {
                      if (unlockGeneratedBlock(cell.id)) addNotification(`Expanded into ${cell.name}!`, 'success');
                      else addNotification(`Need ${formatMoney(cell.cost)} clean cash`, 'warning');
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-3 flex flex-col gap-1 z-10">
        <button
          onClick={() => setZoom(z => Math.min(z * 1.25, 2.2))}
          className="w-8 h-8 rounded-lg bg-gray-800/90 border border-gray-700 text-white text-lg font-bold flex items-center justify-center active:bg-gray-700"
        >+</button>
        <button
          onClick={() => setZoom(z => Math.max(z / 1.25, 0.3))}
          className="w-8 h-8 rounded-lg bg-gray-800/90 border border-gray-700 text-white text-lg font-bold flex items-center justify-center active:bg-gray-700"
        >−</button>
        <button
          onClick={() => { setOffset({ x: 0, y: 0 }); setZoom(0.78); }}
          className="w-8 h-8 rounded-lg bg-gray-800/90 border border-gray-700 text-gray-400 text-xs flex items-center justify-center active:bg-gray-700"
        >⌂</button>
      </div>

      {/* Hint */}
      <p className="absolute bottom-4 left-3 text-[9px] text-gray-700 pointer-events-none">drag to pan · pinch/scroll to zoom</p>
    </div>
  );
}
