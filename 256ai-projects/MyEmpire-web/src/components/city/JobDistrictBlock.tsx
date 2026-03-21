import { useGameStore } from '../../store/gameStore';
import { JOB_DEFS, JOB_MAP } from '../../data/types';
import { formatMoney } from '../../engine/economy';
import { sound } from '../../engine/sound';
import { JOB_SPRITE_MAP } from './DealerJobSprites';

const BLOCK_W = 164;

export default function JobDistrictBlock() {
  const activeJobIds = useGameStore(s => s.activeJobIds ?? []);
  const jobFiredCooldown = useGameStore(s => s.jobFiredCooldown ?? 0);
  const heat = useGameStore(s => s.heat);
  const dirtyCash = useGameStore(s => s.dirtyCash);
  const applyForJob = useGameStore(s => s.applyForJob);
  const quitJob = useGameStore(s => s.quitJob);

  const totalIncome = activeJobIds.reduce((sum, id) => sum + (JOB_MAP[id]?.cleanPerTick ?? 0), 0);

  return (
    <div
      style={{ width: BLOCK_W, borderColor: '#10B98150', backgroundColor: '#10B98108' }}
      className="rounded-lg border p-2"
    >
      <p className="text-[9px] font-bold text-center mb-1 text-emerald-400">💼 Dirty Jobs</p>

      <div className="flex items-center justify-center gap-1 mb-1.5">
        {jobFiredCooldown > 0 ? (
          <span className="text-[7px] text-red-400 font-semibold">Fired! Wait {jobFiredCooldown}s</span>
        ) : activeJobIds.length > 0 ? (
          <span className="text-[7px] text-emerald-300 font-semibold">
            {activeJobIds.length} job{activeJobIds.length > 1 ? 's' : ''} — {formatMoney(totalIncome)}/s
          </span>
        ) : (
          <span className="text-[7px] text-gray-500">Unemployed — bribe your way in</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1">
        {JOB_DEFS.map((job) => {
          const isActive = activeJobIds.includes(job.id);
          const tooHot = heat > job.maxHeat;
          const cantAfford = dirtyCash < job.bribeCost;
          const onCooldown = jobFiredCooldown > 0;
          const canApply = !isActive && !tooHot && !cantAfford && !onCooldown;
          const Sprite = JOB_SPRITE_MAP[job.id];

          return (
            <button
              key={job.id}
              disabled={!canApply && !isActive}
              onClick={() => {
                if (isActive) { quitJob(job.id); sound.play('fire'); }
                else if (canApply) { applyForJob(job.id); sound.play('dealer_hire'); }
              }}
              className={`w-[72px] h-[72px] rounded-lg border-2 relative overflow-hidden transition-all ${
                isActive ? 'ring-1 ring-emerald-400/60'
                  : tooHot ? 'opacity-30'
                  : canApply ? 'hover:brightness-125 cursor-pointer'
                  : 'opacity-50'
              }`}
              style={{
                borderColor: isActive ? '#10B981' : tooHot ? '#EF444440' : '#10B98140',
              }}
            >
              {/* SVG sprite background */}
              {Sprite && <Sprite w={72} h={72} />}

              {/* Active pulse dot */}
              {isActive && (
                <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse z-20" />
              )}

              {/* Text overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-1 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10">
                <span className="text-[8px] font-bold text-white/90 text-center leading-tight drop-shadow">{job.name}</span>
                {isActive ? (
                  <>
                    <span className="text-[7px] text-emerald-300 font-semibold drop-shadow">
                      +{formatMoney(job.cleanPerTick)}/s
                    </span>
                    <span className="text-[6px] text-red-400/80 drop-shadow">tap to quit</span>
                  </>
                ) : tooHot ? (
                  <span className="text-[7px] text-red-400 drop-shadow">Too hot!</span>
                ) : (
                  <>
                    <span className={`text-[7px] drop-shadow ${cantAfford ? 'text-red-400' : 'text-gray-300'}`}>
                      Bribe {formatMoney(job.bribeCost)}
                    </span>
                    <span className="text-[6px] text-gray-500 drop-shadow">
                      Max heat: {job.maxHeat}
                    </span>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
