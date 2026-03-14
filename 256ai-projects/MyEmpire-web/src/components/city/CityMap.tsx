import { useRef, useState } from 'react';
import type { BusinessInstance, RivalSyndicate, RivalBusiness } from '../../data/types';
import { RIVAL_ACTIONS } from '../../data/types';
import { BUSINESS_MAP } from '../../data/businesses';
import { DISTRICTS, DISTRICT_MAP } from '../../data/districts';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { formatMoney } from '../../engine/economy';
import { getPlayerHitmanCount } from '../../engine/rivals';
import BuildingLot from './BuildingLot';
import OperationsBlock from './OperationsBlock';
import DealerNetworkBlock from './DealerNetworkBlock';
import JobDistrictBlock from './JobDistrictBlock';

const BLOCK_W = 164;
const BLOCK_H = 258;
const ROAD_W = 22;

/** Operations spans 2 block rows (removes road between them) */
const OPS_DISTRICT_ID = 'operations';
const OPS_SPAN_ROWS = 2; // how many block-rows operations covers

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

function RivalLot({ rivalBiz, rival, size, onAction }: {
  rivalBiz: RivalBusiness;
  rival: RivalSyndicate;
  size: 'xs' | 'sm';
  onAction: (rivalId: string, actionType: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const bizDef = BUSINESS_MAP[rivalBiz.businessDefId];
  const rootSize = size === 'xs' ? 'w-[56px] h-[56px]' : 'w-[72px] h-[72px]';
  const textSz = size === 'xs' ? 'text-[6px]' : 'text-[7px]';

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`${rootSize} rounded-lg border-2 flex flex-col items-center justify-center gap-0.5 transition`}
        style={{ borderColor: rival.color + '80', backgroundColor: rival.color + '20' }}
      >
        <span className="text-xs">{rival.icon}</span>
        <span className={`${textSz} font-bold text-center leading-tight`} style={{ color: rival.color }}>{bizDef?.chainName ?? '???'}</span>
        <span className={`${textSz} text-gray-500`}>{rival.name.split(' ')[1]}</span>
        {rivalBiz.health < 100 && (
          <div className="absolute bottom-0.5 left-1 right-1 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full" style={{ width: `${rivalBiz.health}%` }} />
          </div>
        )}
      </button>
      {showMenu && (
        <div className="absolute z-30 top-full left-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg p-1.5 shadow-xl min-w-[100px]">
          <p className="text-[8px] text-gray-500 mb-1 px-1">{rival.icon} {rival.name}</p>
          {RIVAL_ACTIONS.map(action => (
            <button
              key={action.type}
              onClick={() => { onAction(rival.id, action.type); setShowMenu(false); }}
              className="block w-full text-left px-1.5 py-1 rounded text-[9px] text-red-300 hover:bg-red-900/40 transition"
            >
              {action.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UnlockedBlock({ districtId, name, color, businesses, unlockedSlots, cleanCash, onUnlockLot, maxSlots, rivals, onRivalAction }: {
  districtId: string;
  name: string;
  color: string;
  businesses: BusinessInstance[];
  unlockedSlots: Record<string, number> | undefined;
  cleanCash: number;
  onUnlockLot: () => void;
  maxSlots: number;
  rivals: RivalSyndicate[];
  onRivalAction: (rivalId: string, actionType: string) => void;
}) {
  const districtUnlocked = unlockedSlots?.[districtId] ?? 2;
  const nextLotCost = 1000 * Math.pow(2, districtUnlocked - 2);
  const slotMap = new Map<number, BusinessInstance>();
  for (const biz of businesses) {
    if (biz.districtId === districtId) slotMap.set(biz.slotIndex, biz);
  }

  const lotSize = maxSlots > 6 ? 'xs' as const : 'sm' as const;

  // Build rival slot map for this district
  const rivalSlotMap = new Map<number, { biz: RivalBusiness; rival: RivalSyndicate }>();
  for (const rival of rivals) {
    if (rival.isDefeated) continue;
    for (const rb of rival.businesses) {
      if (rb.districtId === districtId) {
        rivalSlotMap.set(rb.slotIndex, { biz: rb, rival });
      }
    }
  }

  return (
    <div
      style={{ width: BLOCK_W, borderColor: color + '50', backgroundColor: color + '12' }}
      className="rounded-lg border p-2"
    >
      <p className="text-[9px] font-bold text-center mb-1.5 truncate" style={{ color }}>{name}</p>
      <div className="grid grid-cols-2 gap-1">
        {Array.from({ length: maxSlots }, (_, i) => {
          const business = slotMap.get(i) ?? null;
          const rivalEntry = rivalSlotMap.get(i);
          const isUnlocked = i < districtUnlocked;
          const isBuyable = i === districtUnlocked && i < maxSlots && !business && !rivalEntry;

          // Rival business takes this slot
          if (rivalEntry && !business) {
            return (
              <RivalLot
                key={i}
                rivalBiz={rivalEntry.biz}
                rival={rivalEntry.rival}
                size={lotSize}
                onAction={onRivalAction}
              />
            );
          }

          if (!isUnlocked && !business && !isBuyable) {
            const sz = maxSlots > 6 ? 'w-[56px] h-[56px]' : 'w-[72px] h-[72px]';
            return <div key={i} className={`${sz} rounded bg-black/15`} />;
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
              size={lotSize}
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
  const rivals = useGameStore((s) => s.rivals ?? []);
  const attackRival = useGameStore((s) => s.attackRival);
  const addNotification = useUIStore((s) => s.addNotification);

  const handleRivalAction = (rivalId: string, actionType: string) => {
    const result = attackRival(rivalId, actionType);
    if (result) addNotification(result.message, result.success ? 'success' : 'warning');
  };

  // Pan / zoom state
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.9);
  const dragging = useRef(false);
  const hasMoved = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // Let buttons handle their own clicks — check target and all ancestors
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[data-clickable]')) return;
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
  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const wasDragging = dragging.current;
    dragging.current = false;
    // If we were dragging, release capture and prevent any stale clicks
    if (wasDragging && hasMoved.current) {
      try { (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId); } catch {}
    }
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    setZoom(z => Math.max(0.3, Math.min(4, z * (e.deltaY < 0 ? 1.12 : 0.9))));
  }

  // ── Build position map ────────────────────────────────────────────────────
  const positionMap = new Map<string, Cell>();

  // Compute operations span positions (reserve the row below operations)
  const opsDef = DISTRICT_MAP[OPS_DISTRICT_ID];
  const opsPos = opsDef?.gridPosition;
  const opsSpanKeys = new Set<string>(); // extra cells consumed by operations span
  if (opsPos) {
    for (let dr = 1; dr < OPS_SPAN_ROWS; dr++) {
      opsSpanKeys.add(`${opsPos.col},${opsPos.row + dr}`);
    }
  }

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

  // Add unlocked generated blocks that were removed from generatedBlocks state
  for (const districtId of unlockedDistricts) {
    if (!districtId.startsWith('gen_')) continue;
    const parts = districtId.split('_');
    const col = parseInt(parts[1]), row = parseInt(parts[2]);
    const key = `${col},${row}`;
    if (!positionMap.has(key)) {
      positionMap.set(key, {
        kind: 'district-unlocked',
        id: districtId,
        name: blockName(col, row),
        color: '#6B7280',
      });
    }
  }

  // Dynamically compute virtual neighbor blocks
  const covered = new Set(positionMap.keys());
  // Also mark operations-span cells as covered so gen-locked blocks aren't placed there
  for (const sk of opsSpanKeys) covered.add(sk);

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

  // Include span cells in bounding box calculation
  for (const sk of opsSpanKeys) {
    if (!positionMap.has(sk)) positionMap.set(sk, null);
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

  function getCell(c: number, r: number): Cell {
    return positionMap.get(`${c},${r}`) ?? null;
  }

  // Grid template
  const colTemplate = Array.from({ length: gridCols }, (_, i) =>
    i < gridCols - 1 ? `${BLOCK_W}px ${ROAD_W}px` : `${BLOCK_W}px`
  ).join(' ');
  const rowTemplate = Array.from({ length: gridRows }, (_, i) =>
    i < gridRows - 1 ? `${BLOCK_H}px ${ROAD_W}px` : `${BLOCK_H}px`
  ).join(' ');

  // ── Build grid children with explicit placement ───────────────────────────
  // Compute virtual grid coords for operations span cells to skip
  const opsSkipVirtual = new Set<string>();
  if (opsPos) {
    const opsVc = (opsPos.col - minCol) * 2;
    const opsVr = (opsPos.row - minRow) * 2;
    // Skip the road and block below operations (cells covered by the span)
    for (let dr = 1; dr < OPS_SPAN_ROWS; dr++) {
      opsSkipVirtual.add(`${opsVc},${opsVr + dr * 2 - 1}`); // road between
      opsSkipVirtual.add(`${opsVc},${opsVr + dr * 2}`);     // block below
    }
  }

  type GridItem =
    | { type: 'block'; cell: Cell; key: string; gc: number; gr: number }
    | { type: 'road'; dir: 'h' | 'v' | 'x'; visible: boolean; key: string; gc: number; gr: number };

  const gridItems: GridItem[] = [];
  const tvr = gridRows * 2 - 1;
  const tvc = gridCols * 2 - 1;
  for (let gr = 0; gr < tvr; gr++) {
    for (let gc = 0; gc < tvc; gc++) {
      // Skip cells covered by operations span
      if (opsSkipVirtual.has(`${gc},${gr}`)) continue;

      const bRow = gr % 2 === 0;
      const bCol = gc % 2 === 0;

      if (bRow && bCol) {
        gridItems.push({ type: 'block', cell: getCell(minCol + gc / 2, minRow + gr / 2), key: `b${gc}_${gr}`, gc, gr });
      } else {
        let vis = false;
        let dir: 'h' | 'v' | 'x' = 'x';
        if (!bRow && bCol) {
          dir = 'h';
          const c = minCol + gc / 2;
          vis = !!(getCell(c, minRow + (gr - 1) / 2) || getCell(c, minRow + (gr + 1) / 2));
        } else if (bRow && !bCol) {
          dir = 'v';
          const r = minRow + gr / 2;
          vis = !!(getCell(minCol + (gc - 1) / 2, r) || getCell(minCol + (gc + 1) / 2, r));
        } else {
          dir = 'x';
          const cL = minCol + (gc - 1) / 2, cR = minCol + (gc + 1) / 2;
          const rA = minRow + (gr - 1) / 2, rB = minRow + (gr + 1) / 2;
          vis = !!(getCell(cL, rA) || getCell(cR, rA) || getCell(cL, rB) || getCell(cR, rB));
        }
        gridItems.push({ type: 'road', dir, visible: vis, key: `r${gc}_${gr}`, gc, gr });
      }
    }
  }

  // Compute the grid-row span value for operations: block + road + block = 3 virtual rows
  const opsGridSpan = OPS_SPAN_ROWS * 2 - 1; // 2 blocks + 1 road = 3

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
          <div
            className="grid"
            style={{
              gridTemplateColumns: colTemplate,
              gridTemplateRows: rowTemplate,
            }}
          >
            {gridItems.map((item) => {
              // Explicit grid placement (1-indexed)
              const placement: React.CSSProperties = {
                gridColumn: item.gc + 1,
                gridRow: item.gr + 1,
              };

              if (item.type === 'road') {
                if (!item.visible) return <div key={item.key} style={placement} />;
                if (item.dir === 'h') {
                  return (
                    <div key={item.key} className="relative" style={{ ...placement, height: ROAD_W }}>
                      <div className="absolute inset-0 bg-gray-800 rounded-sm" />
                      <div className="absolute inset-x-2 top-1/2 -translate-y-px border-t-2 border-dashed border-yellow-600/40" />
                    </div>
                  );
                }
                if (item.dir === 'v') {
                  return (
                    <div key={item.key} className="relative" style={{ ...placement, width: ROAD_W }}>
                      <div className="absolute inset-0 bg-gray-800 rounded-sm" />
                      <div className="absolute inset-y-2 left-1/2 -translate-x-px border-l-2 border-dashed border-yellow-600/40" />
                    </div>
                  );
                }
                return (
                  <div key={item.key} className="relative" style={{ ...placement, width: ROAD_W, height: ROAD_W }}>
                    <div className="absolute inset-0 bg-gray-800 rounded-sm" />
                  </div>
                );
              }

              // Block cell
              const cell = item.cell;
              if (!cell) {
                return <div key={item.key} style={{ ...placement, width: BLOCK_W, height: BLOCK_H }} />;
              }
              if (cell.kind === 'district-unlocked') {
                // Operations spans multiple rows — no road between halves
                if (cell.id === OPS_DISTRICT_ID) {
                  return (
                    <div key={cell.id} style={{ ...placement, gridRow: `${item.gr + 1} / span ${opsGridSpan}` }}>
                      <OperationsBlock />
                    </div>
                  );
                }
                if (cell.id === 'dealer_network') {
                  return (
                    <div key={cell.id} style={placement}>
                      <DealerNetworkBlock />
                    </div>
                  );
                }
                if (cell.id === 'job_district') {
                  return (
                    <div key={cell.id} style={placement}>
                      <JobDistrictBlock />
                    </div>
                  );
                }
                const dist = DISTRICT_MAP[cell.id];
                return (
                  <div key={cell.id} style={placement}>
                    <UnlockedBlock
                      districtId={cell.id}
                      name={cell.name}
                      color={cell.color}
                      businesses={businesses}
                      unlockedSlots={unlockedSlots}
                      cleanCash={cleanCash}
                      onUnlockLot={() => unlockLot(cell.id)}
                      maxSlots={dist?.maxBusinessSlots ?? 6}
                      rivals={rivals}
                      onRivalAction={handleRivalAction}
                    />
                  </div>
                );
              }
              if (cell.kind === 'district-locked') {
                return (
                  <div key={cell.id} style={placement}>
                    <LockedBlock
                      name={cell.name}
                      cost={cell.cost}
                      color={cell.color}
                      canAfford={cleanCash >= cell.cost}
                      onUnlock={() => {
                        if (unlockDistrict(cell.id)) addNotification(`Unlocked ${cell.name}!`, 'success');
                        else addNotification(`Need ${formatMoney(cell.cost)} clean cash`, 'warning');
                      }}
                    />
                  </div>
                );
              }
              return (
                <div key={cell.id} style={placement}>
                  <LockedBlock
                    name={cell.name}
                    cost={cell.cost}
                    color="#4B5563"
                    canAfford={cleanCash >= cell.cost}
                    onUnlock={() => {
                      if (unlockGeneratedBlock(cell.id)) addNotification(`Expanded into ${cell.name}!`, 'success');
                      else addNotification(`Need ${formatMoney(cell.cost)} clean cash`, 'warning');
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-3 flex flex-col gap-1 z-10">
        <button
          onClick={() => setZoom(z => Math.min(z * 1.25, 4))}
          className="w-8 h-8 rounded-lg bg-gray-800/90 border border-gray-700 text-white text-lg font-bold flex items-center justify-center active:bg-gray-700"
        >+</button>
        <button
          onClick={() => setZoom(z => Math.max(z / 1.25, 0.3))}
          className="w-8 h-8 rounded-lg bg-gray-800/90 border border-gray-700 text-white text-lg font-bold flex items-center justify-center active:bg-gray-700"
        >−</button>
        <button
          onClick={() => { setOffset({ x: 0, y: 0 }); setZoom(0.9); }}
          className="w-8 h-8 rounded-lg bg-gray-800/90 border border-gray-700 text-gray-400 text-xs flex items-center justify-center active:bg-gray-700"
        >⌂</button>
      </div>

      {/* Hint */}
      <p className="absolute bottom-4 left-3 text-[9px] text-gray-700 pointer-events-none">drag to pan · pinch/scroll to zoom</p>
    </div>
  );
}
