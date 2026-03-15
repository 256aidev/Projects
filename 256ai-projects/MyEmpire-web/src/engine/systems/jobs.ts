import type { TickState, TickContext } from './types';
import { getCrewUpkeep } from '../../data/crewDefs';
import { JOB_MAP } from '../../data/types';

/**
 * Jobs + crew system: job income (clean cash), heat-based firing,
 * and crew upkeep (dirty cash).
 */
export function tickJobsSystem(ts: TickState, ctx: TickContext): void {
  // Job income (clean cash) + heat-based firing
  let jobIncome = 0;
  let currentJobId = ctx.prevState.currentJobId;
  let jobFiredCooldown = Math.max(0, (ctx.prevState.jobFiredCooldown ?? 0) - 1);

  if (currentJobId) {
    const jobDef = JOB_MAP[currentJobId];
    if (jobDef && ts.heat > jobDef.maxHeat) {
      // FIRED — heat too high
      currentJobId = null;
      jobFiredCooldown = 60; // 1 minute cooldown
    } else if (jobDef) {
      jobIncome = jobDef.cleanPerTick;
    }
  }

  ts.cleanCash += jobIncome;
  ts.currentJobId = currentJobId;
  ts.jobFiredCooldown = jobFiredCooldown;
  ts.jobIncome = jobIncome;

  // Crew upkeep (dirty cash per tick)
  const crewCost = getCrewUpkeep(ctx.prevState.crew ?? []);
  ts.dirtyCash = Math.max(0, ts.dirtyCash - crewCost);
  ts.hitmanCost = crewCost;
}
