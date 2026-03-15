import type { GameState, GeneratedBlock } from '../../data/types';
import { DISTRICTS, DISTRICT_MAP } from '../../data/districts';

type SetState = (partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)) => void;
type GetState = () => GameState;

function getBlockName(col: number, row: number): string {
  const dirs = ['East', 'West', 'North', 'South', 'Old', 'New', 'Upper', 'Lower', 'Central'];
  const types = ['Side', 'End', 'Quarter', 'Block', 'Row', 'Way', 'District', 'Heights'];
  return `${dirs[Math.abs(col * 3 + row * 7) % dirs.length]} ${types[Math.abs(col * 5 + row * 11) % types.length]}`;
}

function addNeighborBlocks(
  generatedBlocks: Record<string, GeneratedBlock>,
  unlockedDistricts: string[],
  nextBlockCost: number,
  newCol: number,
  newRow: number,
): Record<string, GeneratedBlock> {
  const covered = new Set<string>();
  for (const d of DISTRICTS) covered.add(`${d.gridPosition.col},${d.gridPosition.row}`);
  for (const b of Object.values(generatedBlocks)) covered.add(`${b.col},${b.row}`);
  for (const id of unlockedDistricts) {
    if (id.startsWith('gen_')) {
      const parts = id.split('_');
      covered.add(`${parts[1]},${parts[2]}`);
    }
  }
  const newBlocks: Record<string, GeneratedBlock> = {};
  for (const [dc, dr] of [[0, -1], [0, 1], [-1, 0], [1, 0]] as [number, number][]) {
    const nc = newCol + dc, nr = newRow + dr;
    const key = `${nc},${nr}`;
    if (covered.has(key) || generatedBlocks[`gen_${nc}_${nr}`]) continue;
    const id = `gen_${nc}_${nr}`;
    newBlocks[id] = { id, col: nc, row: nr, unlockCost: nextBlockCost, name: getBlockName(nc, nr) };
  }
  return newBlocks;
}

export function createTerritoryActions(set: SetState, get: GetState) {
  return {
    unlockLot: (districtId: string) => {
      const state = get();
      const district = DISTRICT_MAP[districtId];
      const isGenBlock = !district && districtId.startsWith('gen_') && state.unlockedDistricts.includes(districtId);
      if (!district && !isGenBlock) return false;
      const maxSlots = district?.maxBusinessSlots ?? 6;
      const currentUnlocked = state.unlockedSlots?.[districtId] ?? 0;
      if (currentUnlocked >= maxSlots) return false;
      // Linear lot pricing: baseCost × (slot+1) — starter: $1K, $2K, $3K...
      const baseCost = district?.lotBaseCost ?? 2000;
      const cost = baseCost * (currentUnlocked + 1);
      if (state.cleanCash < cost) return false;
      const slotKey = `${districtId}:${currentUnlocked}`;
      set({
        cleanCash: state.cleanCash - cost,
        totalSpent: state.totalSpent + cost,
        unlockedSlots: { ...(state.unlockedSlots ?? {}), [districtId]: currentUnlocked + 1 },
        lotBuildTimers: { ...(state.lotBuildTimers ?? {}), [slotKey]: state.tickCount },
      });
      return true;
    },

    unlockDistrict: (districtId: string) => {
      const state = get();
      if (state.unlockedDistricts.includes(districtId)) return false;
      const district = DISTRICT_MAP[districtId];
      if (!district || state.cleanCash < district.unlockCost) return false;
      const newNeighbors = addNeighborBlocks(
        state.generatedBlocks, state.unlockedDistricts,
        state.nextBlockCost, district.gridPosition.col, district.gridPosition.row,
      );
      set({
        cleanCash: state.cleanCash - district.unlockCost,
        totalSpent: state.totalSpent + district.unlockCost,
        unlockedDistricts: [...state.unlockedDistricts, districtId],
        generatedBlocks: { ...state.generatedBlocks, ...newNeighbors },
        unlockedSlots: { ...(state.unlockedSlots ?? {}), [districtId]: state.unlockedSlots?.[districtId] ?? 0 },
      });
      return true;
    },

    unlockGeneratedBlock: (blockId: string) => {
      const state = get();
      if (!blockId.startsWith('gen_')) return false;
      if (state.unlockedDistricts.includes(blockId)) return false;
      const parts = blockId.split('_');
      const col = parseInt(parts[1]), row = parseInt(parts[2]);
      if (isNaN(col) || isNaN(row)) return false;
      // Cost = $2K per generated block already unlocked + $2K base
      const genUnlocked = state.unlockedDistricts.filter(d => d.startsWith('gen_')).length;
      const cost = 2000 + genUnlocked * 2000;
      if (state.cleanCash < cost) return false;
      const newGenBlocks = { ...state.generatedBlocks };
      delete newGenBlocks[blockId];
      const nextCost = 2000 + (genUnlocked + 1) * 2000;
      const newNeighbors = addNeighborBlocks(
        newGenBlocks, [...state.unlockedDistricts, blockId],
        nextCost, col, row,
      );
      set({
        cleanCash: state.cleanCash - cost,
        totalSpent: state.totalSpent + cost,
        unlockedDistricts: [...state.unlockedDistricts, blockId],
        generatedBlocks: { ...newGenBlocks, ...newNeighbors },
        nextBlockCost: nextCost,
        unlockedSlots: { ...(state.unlockedSlots ?? {}), [blockId]: 0 },
      });
      return true;
    },
  };
}
