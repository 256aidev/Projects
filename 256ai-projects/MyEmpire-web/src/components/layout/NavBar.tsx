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
    <div className="flex bg-gray-900 border-t border-gray-700/80">
      {TABS.map((tab) => {
        const active = activeView === tab.id;
        const hasBadge = tab.id === 'legal' && heatNoticeShown;
        return (
          <button
            key={tab.id}
            data-tutorial={`nav-${tab.id}`}
            onClick={() => setActiveView(tab.id)}
            className={`
              flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition
              ${active
                ? 'text-white bg-gray-800 border-t-2 border-indigo-500'
                : 'text-gray-500 hover:text-gray-300'
              }
            `}
          >
            <span className="relative flex items-center justify-center">
              {tab.icon === null
                ? <CannabisLeaf size={22} className={active ? 'opacity-100' : 'opacity-40'} />
                : <span className="text-lg">{tab.icon}</span>
              }
              {hasBadge && (
                <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </span>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}

      {/* Leaderboard button */}
      <button
        onClick={() => setShowLeaderboard(true)}
        className="flex flex-col items-center justify-center py-2.5 gap-0.5 px-3 text-gray-500 hover:text-yellow-400 transition"
      >
        <span className="text-lg">🏆</span>
        <span className="text-[10px] font-medium">Ranks</span>
      </button>
    </div>
  );
}
