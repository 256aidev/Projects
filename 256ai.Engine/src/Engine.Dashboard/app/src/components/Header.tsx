import { type TabId } from '../types';

const tabs: { id: TabId; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'machines', label: 'Machines' },
  { id: 'settings', label: 'Settings' },
];

interface HeaderProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  connected: boolean;
  lastUpdated: Date | null;
}

export default function Header({ activeTab, onTabChange, connected, lastUpdated }: HeaderProps) {
  return (
    <header className="bg-[#1e293b] border-b border-slate-700/50 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        {/* Top bar */}
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center font-bold text-white text-sm">
              AI
            </div>
            <span className="text-lg font-semibold text-white">256ai Swarm</span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-sm text-slate-400">
            <span>Control Plane:</span>
            <code className="text-slate-300 bg-slate-800 px-2 py-0.5 rounded text-xs">
              http://10.0.1.147:5100
            </code>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span
                className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}
              />
              <span className={connected ? 'text-green-400' : 'text-red-400'}>
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {lastUpdated && (
              <span className="text-xs text-slate-500 hidden sm:inline">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <nav className="flex gap-1 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#0f172a] text-white border-t border-x border-slate-700/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
