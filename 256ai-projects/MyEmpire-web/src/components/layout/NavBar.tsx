import { useUIStore, type ViewName } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import CannabisLeaf from '../ui/CannabisLeaf';

const TABS: { id: ViewName; label: string; icon: string | null }[] = [
  { id: 'operation', label: 'Operation', icon: null },  // null = use CannabisLeaf
  { id: 'city',      label: 'City',      icon: '🏙️' },
  { id: 'legal',     label: 'Legal',     icon: '⚖️' },
  { id: 'finance',   label: 'Stats',     icon: '📊' },
];

export default function NavBar() {
  const activeView = useUIStore((s) => s.activeView);
  const setActiveView = useUIStore((s) => s.setActiveView);
  const setShowLeaderboard = useUIStore((s) => s.setShowLeaderboard);
  const heatNoticeShown = useGameStore((s) => s.heatNoticeShown);

  return (
    <div className="flex bg-gray-900 border-t-2 border-gray-700/80">
      {TABS.map((tab) => {
        const active = activeView === tab.id;
        const hasBadge = tab.id === 'legal' && heatNoticeShown;
        return (
          <button
            key={tab.id}
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
        );
      })}

      {/* Leaderboard button */}
      <button
        onClick={() => setShowLeaderboard(true)}
        className="flex flex-col items-center justify-center py-4 gap-1 px-10 text-gray-500 hover:text-yellow-400 transition bg-gray-800/50 border-l border-gray-700/60"
      >
        <span className="text-3xl">🏆</span>
        <span className="text-sm font-semibold">Ranks</span>
      </button>
    </div>
  );
}
