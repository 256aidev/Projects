import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { calculatePrestigeTP } from '../../data/techDefs';
import { PRESTIGE_THRESHOLD } from '../../data/types';
import { formatMoney } from '../../engine/economy';
import { sound } from '../../engine/sound';
import Tooltip from '../ui/Tooltip';

export default function PrestigeConfirmModal() {
  const state = useGameStore();
  const setShowPrestigeConfirm = useUIStore((s) => s.setShowPrestigeConfirm);
  const setShowTechMenu = useUIStore((s) => s.setShowTechMenu);

  const eligible = state.totalDirtyEarned >= PRESTIGE_THRESHOLD;
  const { total, milestones } = calculatePrestigeTP(state);

  const handlePrestige = () => {
    const success = state.prestige();
    if (success) {
      sound.play('prestige');
      setShowPrestigeConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-cyan-900/50 max-w-md w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 text-center">
          <span className="text-3xl">🔄</span>
          <h2 className="text-xl font-bold text-white mt-1">Prestige Reset</h2>
          <p className="text-gray-400 text-sm mt-1">
            Reset all progress for permanent Tech Point upgrades
          </p>
        </div>

        {/* TP Earned Preview */}
        <div className="p-4 bg-cyan-900/20 border-b border-gray-800 text-center">
          <p className="text-gray-400 text-xs">You will earn</p>
          <p className="text-4xl font-bold text-cyan-400 my-1">{total} TP</p>
          <p className="text-gray-500 text-[10px]">1 base + {total - 1} from milestones</p>
        </div>

        {/* Milestone Breakdown */}
        <div className="p-4 space-y-1.5">
          <p className="text-gray-400 text-xs font-semibold mb-2">MILESTONES</p>
          {milestones.map(({ milestone, achieved }) => (
            <div
              key={milestone.id}
              className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs ${
                achieved ? 'bg-green-900/20 text-green-400' : 'bg-gray-800/50 text-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{achieved ? '✅' : '⬜'}</span>
                <span>{milestone.icon}</span>
                <span>{milestone.name}</span>
              </div>
              <span className="font-bold">+{milestone.bonusTP} TP</span>
            </div>
          ))}
        </div>

        {/* Warning */}
        <div className="px-4 py-3 bg-red-900/10 border-t border-gray-800">
          <p className="text-red-400 text-xs text-center">
            This will reset: cash, grow rooms, businesses, dealers, districts, heat, rivals.
            <br />
            <span className="text-gray-500">Tech upgrades and Tech Points are permanent.</span>
          </p>
        </div>

        {/* Actions */}
        <div className="p-4 flex gap-2">
          <Tooltip text="Go back without prestiging.">
          <button
            onClick={() => setShowPrestigeConfirm(false)}
            className="flex-1 py-2.5 rounded-lg bg-gray-800 text-gray-400 font-semibold text-sm hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          </Tooltip>
          <Tooltip text="View and spend Tech Points in the Tech Lab.">
          <button
            onClick={() => { setShowPrestigeConfirm(false); setShowTechMenu(true); }}
            className="py-2.5 px-4 rounded-lg bg-gray-700 text-cyan-400 font-semibold text-sm hover:bg-gray-600 transition"
          >
            🔬 Tech
          </button>
          </Tooltip>
          {eligible ? (
            <Tooltip text="Reset all progress and earn Tech Points. Tech upgrades are permanent.">
            <button
              onClick={handlePrestige}
              className="flex-1 py-2.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-sm transition"
            >
              Prestige (+{total} TP)
            </button>
            </Tooltip>
          ) : (
            <div className="flex-1 py-2.5 rounded-lg bg-gray-800 text-gray-500 font-bold text-sm text-center">
              Need {formatMoney(PRESTIGE_THRESHOLD)} dirty
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
