import type { GameState } from '../../data/types';
import { JOB_MAP, JOB_DEFS } from '../../data/types';
import { LAWYER_MAP } from '../../data/lawyers';
import { HEAT_MAX, getHeatTier } from '../../engine/heat';

type SetState = (partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)) => void;
type GetState = () => GameState;

export function createLegalActions(set: SetState, get: GetState) {
  return {
    applyForJob: (jobId: string) => {
      const state = get();
      const jobDef = JOB_MAP[jobId];
      if (!jobDef) return false;
      if ((state.jobFiredCooldown ?? 0) > 0) return false;
      if (state.heat > jobDef.maxHeat) return false;
      if (state.dirtyCash < jobDef.bribeCost) return false;
      const jobIndex = JOB_DEFS.findIndex(j => j.id === jobId);
      const heatBump = 5 + (jobIndex >= 0 ? jobIndex : 0) * 5;
      set({
        dirtyCash: state.dirtyCash - jobDef.bribeCost,
        totalSpent: state.totalSpent + jobDef.bribeCost,
        currentJobId: jobId,
        heat: Math.min(HEAT_MAX, state.heat + heatBump),
      });
      return true;
    },

    quitJob: () => {
      set({ currentJobId: null });
    },

    hireLawyer: (lawyerId: string) => {
      const state = get();
      const lawyer = LAWYER_MAP[lawyerId];
      if (!lawyer) return false;
      if (state.cleanCash < lawyer.unlockCost) return false;
      if (getHeatTier(state.heat) < lawyer.requiredHeatTier) return false;
      set({
        cleanCash: state.cleanCash - lawyer.unlockCost,
        totalSpent: state.totalSpent + lawyer.unlockCost,
        activeLawyerId: lawyerId,
      });
      return true;
    },

    fireLawyer: () => {
      set({ activeLawyerId: null });
    },
  };
}
