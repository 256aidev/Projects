import { useGameTick } from './hooks/useGameTick';
import { useUIStore } from './store/uiStore';
import HUD from './components/layout/HUD';
import NavBar from './components/layout/NavBar';
import DistrictSelector from './components/city/DistrictSelector';
import CityMap from './components/city/CityMap';
import OperationView from './components/operation/OperationView';
import LegalView from './components/legal/LegalView';
import BuyBusinessPanel from './components/panels/BuyBusinessPanel';
import BuildingMenu from './components/panels/BuildingMenu';
import ResourceMarketPanel from './components/panels/ResourceMarketPanel';
import Notifications from './components/ui/Notifications';

export default function App() {
  useGameTick();

  const activeView = useUIStore((s) => s.activeView);
  const selectedSlot = useUIStore((s) => s.selectedSlot);
  const selectedBusinessId = useUIStore((s) => s.selectedBusinessId);
  const activePanel = useUIStore((s) => s.activePanel);
  const setPanel = useUIStore((s) => s.setPanel);

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Top HUD — always visible */}
      <HUD />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeView === 'operation' && <OperationView />}

        {activeView === 'city' && (
          <>
            <div className="flex items-center justify-between bg-gray-800/50 px-3 py-1.5 border-b border-gray-700/50">
              <DistrictSelector />
              <button
                onClick={() => setPanel(activePanel === 'market' ? null : 'market')}
                className="px-3 py-1 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-xs font-semibold transition whitespace-nowrap ml-2"
              >
                🛒 Market
              </button>
            </div>
            <CityMap />
          </>
        )}

        {activeView === 'legal' && <LegalView />}
      </div>

      {/* Bottom nav tabs */}
      <NavBar />

      {/* Overlays */}
      {selectedSlot && <BuyBusinessPanel />}
      {selectedBusinessId && <BuildingMenu />}
      {activePanel === 'market' && <ResourceMarketPanel />}

      <Notifications />
    </div>
  );
}
