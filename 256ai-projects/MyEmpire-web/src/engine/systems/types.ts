import type { GameState, CriminalOperation, BusinessInstance } from '../../data/types';
import type { TechBonuses } from '../tech';
import type { SessionTechBonuses } from '../sessionTech';
import type { SeasonDef } from '../../data/seasons';

export interface CarBonuses {
  heatReduction: number;
  growSpeed: number;
  dealerBoost: number;
  incomeMultiplier: number;
  launderBoost: number;
  streetDemand: number;
}

// Mutable accumulator that passes through all systems
export interface TickState {
  dirtyCash: number;
  cleanCash: number;
  heat: number;
  rivalHeat: number;
  operation: CriminalOperation;
  activeLawyerId: string | null;
  currentJobId: string | null;
  jobFiredCooldown: number;
  streetSellQuotaOz: number;
  rivals: GameState['rivals'];
  rivalAttackLog: string[];
  unlockedDistricts: string[];
  eventSystem: GameState['eventSystem'];
  // Metrics tracked across systems
  dirtyEarned: number;
  maintenanceCost: number;
  cleanProduced: number;
  legitProfit: number;
  jobIncome: number;
  hitmanCost: number;
  tickCount: number;
  heatNoticeShown: boolean;
  totalDirtyEarned: number;
  totalCleanEarned: number;
}

export interface TickContext {
  prevState: GameState;          // original immutable state
  tech: TechBonuses;             // merged tech bonuses
  sessionTech: SessionTechBonuses;
  carBonuses: CarBonuses;
  gameSpeed: number;
  season: SeasonDef;             // current season with multipliers
}

export type GameSystem = (ts: TickState, ctx: TickContext) => void;  // mutates ts in-place
