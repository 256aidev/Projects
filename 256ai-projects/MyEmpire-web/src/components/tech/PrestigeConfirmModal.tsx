import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { calculatePrestigeTP } from '../../data/techDefs';
import { PRESTIGE_THRESHOLD } from '../../data/types';
import { formatMoney } from '../../engine/economy';
import { sound } from '../../engine/sound';
import Tooltip from '../ui/Tooltip';

// Group milestone IDs by category
const MILESTONE_GROUPS: { label: string; icon: string; prefixes: string[] }[] = [
  { label: 'Money (Dirty)', icon: '💵', prefixes: ['dirty_'] },
  { label: 'Money (Clean)', icon: '🏦', prefixes: ['clean_'] },
  { label: 'Money (Spent)', icon: '💸', prefixes: ['spent_'] },
  { label: 'Grow Rooms', icon: '🌿', prefixes: ['rooms_'] },
  { label: 'Businesses & Lots', icon: '🏢', prefixes: ['biz_', 'lots_'] },
  { label: 'Districts', icon: '🗺️', prefixes: ['dist_'] },
  { label: 'Dealers', icon: '🤝', prefixes: ['dealers_', 'tier_'] },
  { label: 'Crew & Rivals', icon: '👊', prefixes: ['crew_', 'rival_'] },
  { label: 'Casino', icon: '🎰', prefixes: ['casino_'] },
  { label: 'Luxury', icon: '💎', prefixes: ['jewelry_', 'cars_'] },
  { label: 'Jobs & Lawyers', icon: '💼', prefixes: ['has_job', 'lawyers_'] },
  { label: 'Tech & Heat', icon: '🔧', prefixes: ['runtech_', 'heat_'] },
];

export default function PrestigeConfirmModal() {
  const state = useGameStore();
  const setShowPrestigeConfirm = useUIStore((s) => s.setShowPrestigeConfirm);
  const setShowTechMenu = useUIStore((s) => s.setShowTechMenu);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const eligible = state.totalDirtyEarned >= PRESTIGE_THRESHOLD;
  const { total, milestones } = calculatePrestigeTP(state);

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  };

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

        {/* Milestone Breakdown — Grouped Dropdowns */}
        <div className="p-4 space-y-1.5">
          <p className="text-gray-400 text-xs font-semibold mb-2">MILESTONES</p>
          {MILESTONE_GROUPS.map(group => {
            const groupMilestones = milestones.filter(({ milestone }) =>
              group.prefixes.some(p => milestone.id.startsWith(p))
            );
            if (groupMilestones.length === 0) return null;
            const achievedCount = groupMilestones.filter(m => m.achieved).length;
            const groupTP = groupMilestones.filter(m => m.achieved).reduce((sum, m) => sum + m.milestone.bonusTP, 0);
            const isOpen = openGroups.has(group.label);
            return (
              <div key={group.label}>
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition ${
                    achievedCount > 0 ? 'bg-green-900/15 text-green-300 hover:bg-green-900/25' : 'bg-gray-800/50 text-gray-500 hover:bg-gray-800/70'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px]">{isOpen ? '▼' : '▶'}</span>
                    <span>{group.icon}</span>
                    <span className="font-semibold">{group.label}</span>
                    <span className="text-[10px] opacity-60">{achievedCount}/{groupMilestones.length}</span>
                  </div>
                  {groupTP > 0 && <span className="font-bold text-green-400">+{groupTP} TP</span>}
                </button>
                {isOpen && (
                  <div className="ml-4 mt-1 space-y-1">
                    {groupMilestones.map(({ milestone, achieved }) => (
                      <div
                        key={milestone.id}
                        className={`flex items-center justify-between px-3 py-1 rounded text-[11px] ${
                          achieved ? 'bg-green-900/20 text-green-400' : 'bg-gray-800/30 text-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{achieved ? '✅' : '⬜'}</span>
                          <span>{milestone.name}</span>
                        </div>
                        <span className="font-bold">+{milestone.bonusTP} TP</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
