import type { TickState, TickContext } from './types';
import { getCrewUpkeep } from '../../data/crewDefs';
import { JOB_MAP } from '../../data/types';

/**
 * Jobs + crew system: job income (clean cash), heat-based firing,
 * and crew upkeep (dirty cash).
 * Players can hold multiple jobs simultaneously (bribed ghost jobs).
 */
export function tickJobsSystem(ts: TickState, ctx: TickContext): void {
  let jobIncome = 0;
  let activeJobIds = [...(ctx.prevState.activeJobIds ?? [])];
  let jobFiredCooldown = Math.max(0, (ctx.prevState.jobFiredCooldown ?? 0) - 1);

  // Process each active job — fire individually if heat too high
  const firedJobs: string[] = [];
  for (const jobId of activeJobIds) {
    const jobDef = JOB_MAP[jobId];
    if (!jobDef) continue;
    if (ts.heat > jobDef.maxHeat) {
      firedJobs.push(jobId);
    } else {
      jobIncome += jobDef.cleanPerTick;
    }
  }

  // Remove fired jobs
  if (firedJobs.length > 0) {
    activeJobIds = activeJobIds.filter(id => !firedJobs.includes(id));
    jobFiredCooldown = 60; // 1 minute cooldown
  }

  ts.cleanCash += jobIncome;
  ts.activeJobIds = activeJobIds;
  ts.jobFiredCooldown = jobFiredCooldown;
  ts.jobIncome = jobIncome;

  // Crew upkeep (dirty cash per tick)
  const crewCost = getCrewUpkeep(ctx.prevState.crew ?? []);
  ts.dirtyCash = Math.max(0, ts.dirtyCash - crewCost);
  ts.hitmanCost = crewCost;
}
