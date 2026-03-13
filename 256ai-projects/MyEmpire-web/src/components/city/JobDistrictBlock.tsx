import { useGameStore } from '../../store/gameStore';
import { JOB_DEFS } from '../../data/types';
import { formatMoney } from '../../engine/economy';

const BLOCK_W = 164;

export default function JobDistrictBlock() {
  const currentJobId = useGameStore(s => s.currentJobId);
  const jobFiredCooldown = useGameStore(s => s.jobFiredCooldown ?? 0);
  const heat = useGameStore(s => s.heat);
  const dirtyCash = useGameStore(s => s.dirtyCash);
  const applyForJob = useGameStore(s => s.applyForJob);
  const quitJob = useGameStore(s => s.quitJob);

  const currentJob = JOB_DEFS.find(j => j.id === currentJobId);

  return (
    <div
      style={{ width: BLOCK_W, borderColor: '#10B98150', backgroundColor: '#10B98108' }}
      className="rounded-lg border p-2"
    >
      <p className="text-[9px] font-bold text-center mb-1 text-emerald-400">💼 Dirty Jobs</p>

      {/* Status badge */}
      <div className="flex items-center justify-center gap-1 mb-1.5">
        {jobFiredCooldown > 0 ? (
          <span className="text-[7px] text-red-400 font-semibold">Fired! Wait {jobFiredCooldown}s</span>
        ) : currentJob ? (
          <span className="text-[7px] text-emerald-300 font-semibold">
            {currentJob.icon} {currentJob.name} — {formatMoney(currentJob.cleanPerTick)}/s
          </span>
        ) : (
          <span className="text-[7px] text-gray-500">Unemployed — bribe your way in</span>
        )}
      </div>

      {/* Job tiles grid (2x3 = 6 jobs) */}
      <div className="grid grid-cols-2 gap-1">
        {JOB_DEFS.map((job) => {
          const isCurrentJob = currentJobId === job.id;
          const tooHot = heat > job.maxHeat;
          const cantAfford = dirtyCash < job.bribeCost;
          const onCooldown = jobFiredCooldown > 0;
          const canApply = !isCurrentJob && !tooHot && !cantAfford && !onCooldown;

          return (
            <button
              key={job.id}
              disabled={!canApply && !isCurrentJob}
              onClick={() => {
                if (isCurrentJob) {
                  quitJob();
                } else if (canApply) {
                  applyForJob(job.id);
                }
              }}
              className={`w-[72px] h-[72px] rounded-lg border-2 flex flex-col items-center justify-center gap-0.5 relative overflow-hidden transition-all ${
                isCurrentJob
                  ? 'ring-1 ring-emerald-400/60'
                  : tooHot
                    ? 'opacity-30'
                    : canApply
                      ? 'hover:brightness-125 cursor-pointer'
                      : 'opacity-50'
              }`}
              style={{
                backgroundColor: isCurrentJob ? '#10B98125' : '#10B98110',
                borderColor: isCurrentJob ? '#10B981' : tooHot ? '#EF444440' : '#10B98140',
              }}
            >
              {/* Active job pulsing indicator */}
              {isCurrentJob && (
                <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}

              <div className="relative z-10 flex flex-col items-center">
                <span className="text-lg leading-none">{job.icon}</span>
                <span className="text-[8px] font-bold text-white/90 text-center leading-tight">{job.name}</span>

                {isCurrentJob ? (
                  <>
                    <span className="text-[7px] text-emerald-300 font-semibold">
                      +{formatMoney(job.cleanPerTick)}/s
                    </span>
                    <span className="text-[6px] text-red-400/70">tap to quit</span>
                  </>
                ) : tooHot ? (
                  <span className="text-[7px] text-red-400">Too hot!</span>
                ) : (
                  <span className={`text-[7px] ${cantAfford ? 'text-red-400' : 'text-gray-400'}`}>
                    Bribe {formatMoney(job.bribeCost)}
                  </span>
                )}

                {!isCurrentJob && (
                  <span className="text-[6px] text-gray-600">
                    Max heat: {job.maxHeat}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
