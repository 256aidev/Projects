import { useUIStore, type ViewName } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import CannabisLeaf from '../ui/CannabisLeaf';
import Tooltip from '../ui/Tooltip';

const TABS: { id: ViewName; label: string; icon: string | null }[] = [
  { id: 'operation', label: 'Operation', icon: null },  // null = use CannabisLeaf
  { id: 'city',      label: 'City',      icon: '🏙️' },
  { id: 'legal',     label: 'Legal & Rivals', icon: '⚖️' },
  { id: 'finance',   label: 'Stats',     icon: '📊' },
  { id: 'ranks',     label: 'Ranks',     icon: '🏆' },
];

const TAB_TOOLTIPS: Record<string, string> = {
  operation: 'Manage your grow operation, seeds, dealers, and product sales.',
  city: 'View the city map, buy lots, and build front businesses.',
  legal: 'Police heat, lawyers, hitmen, and rival warfare.',
  finance: 'View detailed financial stats and game metrics.',
  ranks: 'Leaderboards, rankings, and empire score breakdown.',
};

export default function NavBar() {
  const activeView = useUIStore((s) => s.activeView);
  const setActiveView = useUIStore((s) => s.setActiveView);
  const heatNoticeShown = useGameStore((s) => s.heatNoticeShown);

  return (
    <div className="flex bg-gray-900 border-t-2 border-gray-700/80">
      {TABS.map((tab) => {
        const active = activeView === tab.id;
        const hasBadge = tab.id === 'legal' && heatNoticeShown;
        return (
          <Tooltip key={tab.id} text={TAB_TOOLTIPS[tab.id]}>
            <button
              data-tutorial={`nav-${tab.id}`}
              onClick={() => setActiveView(tab.id)}
              className={`
                flex-1 flex flex-col items-center justify-center py-4 gap-1 transition
                ${active
                  ? 'text-white bg-gray-800 border-t-3 border-indigo-500'
                  : 'text-gray-500 hover:text-gray-300'
                }
              `}
            >
              <span className="relative flex items-center justify-center">
                {tab.icon === null
                  ? <CannabisLeaf size={32} className={active ? 'opacity-100' : 'opacity-40'} />
                  : <span className="text-3xl">{tab.icon}</span>
                }
                {hasBadge && (
                  <span className="absolute -top-1 -right-1.5 w-3 h-3 rounded-full bg-red-500" />
                )}
              </span>
              <span className="text-sm font-semibold">{tab.label}</span>
            </button>
          </Tooltip>
        );
      })}

    </div>
  );
}
