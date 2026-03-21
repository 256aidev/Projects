import { Component, useEffect, useRef, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

class ViewErrorBoundary extends Component<{ children: ReactNode; name: string }, { hasError: boolean; error?: Error }> {
  state = { hasError: false, error: undefined as Error | undefined };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error(`[${(this.props as { name: string }).name}] Render error:`, error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 text-white p-4">
          <p className="text-red-400 font-bold mb-2">Something went wrong in {(this.props as { name: string }).name}</p>
          <p className="text-gray-500 text-xs mb-3">{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })} className="px-3 py-1 rounded bg-gray-800 text-sm hover:bg-gray-700">Retry</button>
        </div>
      );
    }
    return (this.props as { children: ReactNode }).children;
  }
}
import { sound } from './engine/sound';
import { useGameTick } from './hooks/useGameTick';
import { useUIStore } from './store/uiStore';
import { useAuthStore } from './store/authStore';
import { useGameStore } from './store/gameStore';
import HUD from './components/layout/HUD';
import NavBar from './components/layout/NavBar';
import CityMap from './components/city/CityMap';
import OperationView from './components/operation/OperationView';
import LegalView from './components/legal/LegalView';
import RivalsView from './components/rivals/RivalsView';
import FamilyView from './components/family/FamilyView';
import WarehouseView from './components/warehouse/WarehouseView';
import FinanceView from './components/finance/FinanceView';
import BuyBusinessPanel from './components/panels/BuyBusinessPanel';
import BuildingMenu from './components/panels/BuildingMenu';
import ResourceMarketPanel from './components/panels/ResourceMarketPanel';
import Notifications from './components/ui/Notifications';
import LoginScreen from './components/auth/LoginScreen';
import AccountScreen from './components/auth/AccountScreen';
import LeaderboardView from './components/ui/LeaderboardView';
import StartGameScreen from './components/ui/StartGameScreen';
import TechMenu from './components/tech/TechMenu';
import SessionTechMenu from './components/tech/SessionTechMenu';
import RunTechMenu from './components/tech/RunTechMenu';
import PrestigeConfirmModal from './components/tech/PrestigeConfirmModal';
import CasinoView from './components/casino/CasinoView';
import JewelryStoreView from './components/jewelry/JewelryStoreView';
import CarDealershipView from './components/cars/CarDealershipView';
import BankView from './components/bank/BankView';
import EventPopup from './components/ui/EventPopup';
import TutorialOverlay from './components/ui/TutorialOverlay';
import VictoryScreen from './components/ui/VictoryScreen';
import AdminDashboard from './components/admin/AdminDashboard';
import { useTuningStore } from './store/tuningStore';

// Auto-sync to Firestore every 60 ticks (≈ 1 min)
const SYNC_INTERVAL_TICKS = 60;

export default function App() {
  useGameTick();

  // Admin dashboard accessed via #admin hash
  const [isAdmin, setIsAdmin] = useState(window.location.hash === '#admin');
  useEffect(() => {
    const onHash = () => setIsAdmin(window.location.hash === '#admin');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  if (isAdmin) return <AdminDashboard />;

  // Subscribe to live tuning config from Firestore
  useEffect(() => useTuningStore.getState().subscribe(), []);

  const activeView = useUIStore((s) => s.activeView);
  const selectedSlot = useUIStore((s) => s.selectedSlot);
  const selectedBusinessId = useUIStore((s) => s.selectedBusinessId);
  const activePanel = useUIStore((s) => s.activePanel);
  const showAccountScreen = useUIStore((s) => s.showAccountScreen);
  const showTechMenu = useUIStore((s) => s.showTechMenu);
  const showPrestigeConfirm = useUIStore((s) => s.showPrestigeConfirm);
  const showCasino = useUIStore((s) => s.showCasino);
  const showJewelryStore = useUIStore((s) => s.showJewelryStore);
  const showCarDealership = useUIStore((s) => s.showCarDealership);
  const showBank = useUIStore((s) => s.showBank);
  const showSessionTechMenu = useUIStore((s) => s.showSessionTechMenu);
  const showRunTechMenu = useUIStore((s) => s.showRunTechMenu);
  const setPanel = useUIStore((s) => s.setPanel);

  const { user, loading, syncToCloud } = useAuthStore();
  const tickCount = useGameStore((s) => s.tickCount);
  const gameStarted = useGameStore((s) => s.gameSettings?.gameStarted);
  const rivals = useGameStore((s) => s.rivals);
  const [victoryDismissed, setVictoryDismissed] = useState(false);

  // Victory detection: all rivals defeated (and there are rivals)
  const allRivalsDefeated = rivals.length > 0 && rivals.every(r => r.isDefeated);
  const showVictory = allRivalsDefeated && !victoryDismissed;
  const lastSyncTick = useRef(0);

  // Cloud auto-sync on interval
  useEffect(() => {
    if (!user || (user as { uid: string }).uid === 'guest') return;
    if (tickCount - lastSyncTick.current >= SYNC_INTERVAL_TICKS) {
      lastSyncTick.current = tickCount;
      syncToCloud();
    }
  }, [tickCount, user, syncToCloud]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950">
        <div className="text-gray-600 text-sm">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (!gameStarted) {
    return <StartGameScreen />;
  }

  return (
    <div className="h-full flex flex-col bg-gray-950 relative" onClick={() => sound.startMusic()} onTouchStart={() => sound.startMusic()}>
      {/* Top HUD — always visible */}
      <HUD />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeView === 'operation' && <OperationView />}

        {activeView === 'city' && (
          <ViewErrorBoundary name="City">
            <div className="flex-1 flex flex-col overflow-hidden relative">
              <button
                onClick={() => setPanel(activePanel === 'market' ? null : 'market')}
                className="absolute top-2 right-2 z-10 px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-xs font-semibold transition whitespace-nowrap shadow-lg"
              >
                🛒 Market
              </button>
              <CityMap />
            </div>
          </ViewErrorBoundary>
        )}

        {activeView === 'legal' && <LegalView />}
        {activeView === 'rivals' && <RivalsView />}
        {activeView === 'family' && <FamilyView />}
        {activeView === 'finance' && <FinanceView />}
        {activeView === 'ranks' && <LeaderboardView />}
      </div>

      {/* Bottom nav tabs */}
      <NavBar />

      {/* Overlays */}
      {selectedSlot && <BuyBusinessPanel />}
      {selectedBusinessId && <BuildingMenu />}
      {activePanel === 'market' && <ResourceMarketPanel />}
      {activePanel === 'warehouse' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end" onClick={() => setPanel(null)}>
          <div className="flex-1" />
          <div
            className="bg-gray-900 border-t border-gray-700 rounded-t-2xl max-h-[75vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 pt-3 pb-1 border-b border-gray-800">
              <p className="text-white font-bold text-sm">Stash</p>
              <button onClick={() => setPanel(null)} className="text-gray-500 hover:text-white text-lg leading-none">✕</button>
            </div>
            <WarehouseView />
          </div>
        </div>
      )}

      <Notifications />
      {showAccountScreen && <AccountScreen />}
      {showTechMenu && <TechMenu />}
      {showSessionTechMenu && <SessionTechMenu />}
      {showRunTechMenu && <RunTechMenu />}
      {showPrestigeConfirm && <PrestigeConfirmModal />}
      {showCasino && <CasinoView />}
      {showJewelryStore && <JewelryStoreView />}
      {showCarDealership && <CarDealershipView />}
      {showBank && <BankView />}
      <EventPopup />
      <TutorialOverlay />
      {showVictory && <VictoryScreen onContinue={() => setVictoryDismissed(true)} />}
    </div>
  );
}
