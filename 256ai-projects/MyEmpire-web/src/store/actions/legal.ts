import type { GameState } from '../../data/types';
import { JOB_MAP, JOB_DEFS } from '../../data/types';
import { LAWYER_MAP } from '../../data/lawyers';
import { HEAT_MAX, getHeatTier } from '../../engine/heat';

type SetState = (partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)) => void;
type GetState = () => GameState;

/** Get the cost to hire the Nth lawyer of a given type (doubles each time) */
function getLawyerHireCost(baseCost: number, currentCount: number): number {
  return Math.floor(baseCost * Math.pow(2, currentCount));
}

export function createLegalActions(set: SetState, get: GetState) {
  return {
    applyForJob: (jobId: string) => {
      const state = get();
      const jobDef = JOB_MAP[jobId];
      if (!jobDef) return false;
      if ((state.jobFiredCooldown ?? 0) > 0) return false;
      if (state.heat > jobDef.maxHeat) return false;
      if (state.dirtyCash < jobDef.bribeCost) return false;
      const activeJobs = state.activeJobIds ?? [];
      if (activeJobs.includes(jobId)) return false; // already have this job
      const jobIndex = JOB_DEFS.findIndex(j => j.id === jobId);
      const heatBump = 5 + (jobIndex >= 0 ? jobIndex : 0) * 5;
      set({
        dirtyCash: state.dirtyCash - jobDef.bribeCost,
        totalSpent: state.totalSpent + jobDef.bribeCost,
        activeJobIds: [...activeJobs, jobId],
        currentJobId: jobId, // backward compat
        heat: Math.min(HEAT_MAX, state.heat + heatBump),
      });
      return true;
    },

    quitJob: (jobId?: string) => {
      const state = get();
      const activeJobs = state.activeJobIds ?? [];
      if (jobId) {
        const filtered = activeJobs.filter(id => id !== jobId);
        set({ activeJobIds: filtered, currentJobId: filtered.length > 0 ? filtered[0] : null });
      } else {
        set({ activeJobIds: [], currentJobId: null });
      }
    },

    hireLawyer: (lawyerId: string) => {
      const state = get();
      const lawyer = LAWYER_MAP[lawyerId];
      if (!lawyer) return false;
      if (getHeatTier(state.heat) < lawyer.requiredHeatTier) return false;

      const hired = state.hiredLawyers ?? [];
      const existing = hired.find(h => h.defId === lawyerId);
      const currentCount = existing?.count ?? 0;
      const maxCount = 5;
      if (currentCount >= maxCount) return false;

      const cost = getLawyerHireCost(lawyer.unlockCost, currentCount);
      if (state.cleanCash < cost) return false;

      const newHired = existing
        ? hired.map(h => h.defId === lawyerId ? { ...h, count: h.count + 1 } : h)
        : [...hired, { defId: lawyerId, count: 1 }];

      set({
        cleanCash: state.cleanCash - cost,
        totalSpent: state.totalSpent + cost,
        hiredLawyers: newHired,
        activeLawyerId: lawyerId, // keep for backward compat — points to last hired
      });
      return true;
    },

    fireLawyer: (lawyerId?: string) => {
      const state = get();
      const hired = state.hiredLawyers ?? [];
      if (!lawyerId) {
        // Fire all lawyers (legacy behavior)
        set({ hiredLawyers: [], activeLawyerId: null });
        return;
      }
      const existing = hired.find(h => h.defId === lawyerId);
      if (!existing || existing.count <= 0) return;
      const newHired = existing.count <= 1
        ? hired.filter(h => h.defId !== lawyerId)
        : hired.map(h => h.defId === lawyerId ? { ...h, count: h.count - 1 } : h);
      set({
        hiredLawyers: newHired,
        activeLawyerId: newHired.length > 0 ? newHired[0].defId : null,
      });
    },
  };
}
