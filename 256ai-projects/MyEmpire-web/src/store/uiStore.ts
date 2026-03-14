import { create } from 'zustand';
import { sound } from '../engine/sound';

type PanelName = 'buy' | 'market' | 'lawyer' | 'event' | 'settings' | 'warehouse' | null;
export type ViewName = 'operation' | 'city' | 'warehouse' | 'legal' | 'finance';

export type GameSpeed = 0 | 1 | 2 | 4 | 8;

interface UIState {
  activeView: ViewName;
  activeDistrictId: string;
  selectedSlot: { districtId: string; slotIndex: number } | null;
  selectedBusinessId: string | null;
  activePanel: PanelName;
  showAccountScreen: boolean;
  showLeaderboard: boolean;
  showTechMenu: boolean;
  showPrestigeConfirm: boolean;
  showCasino: boolean;
  showJewelryStore: boolean;
  showCarDealership: boolean;
  gameSpeed: GameSpeed;
  notifications: { id: number; message: string; type: 'success' | 'warning' | 'error' }[];
}

interface UIActions {
  setActiveView: (view: ViewName) => void;
  setActiveDistrict: (id: string) => void;
  selectSlot: (districtId: string, slotIndex: number) => void;
  selectBusiness: (instanceId: string | null) => void;
  setPanel: (panel: PanelName) => void;
  setShowAccountScreen: (show: boolean) => void;
  setShowLeaderboard: (show: boolean) => void;
  setShowTechMenu: (show: boolean) => void;
  setShowPrestigeConfirm: (show: boolean) => void;
  setShowCasino: (show: boolean) => void;
  setShowJewelryStore: (show: boolean) => void;
  setShowCarDealership: (show: boolean) => void;
  setGameSpeed: (speed: GameSpeed) => void;
  closeAll: () => void;
  addNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
  removeNotification: (id: number) => void;
}

let notifId = 0;

export const useUIStore = create<UIState & UIActions>()((set) => ({
  activeView: 'operation',
  activeDistrictId: 'starter',
  selectedSlot: null,
  selectedBusinessId: null,
  activePanel: null,
  showAccountScreen: false,
  showLeaderboard: false,
  showTechMenu: false,
  showPrestigeConfirm: false,
  showCasino: false,
  showJewelryStore: false,
  showCarDealership: false,
  gameSpeed: 1,
  notifications: [],

  setActiveView: (view) => {
    set({ activeView: view, selectedSlot: null, selectedBusinessId: null, activePanel: null });
    // Tutorial advance on tab switch
    try {
      const { useGameStore } = require('./gameStore');
      const gs = useGameStore.getState().gameSettings;
      if (gs?.tutorialActive) {
        const { TUTORIAL_STEPS } = require('../data/tutorial');
        const step = TUTORIAL_STEPS[gs.tutorialStep];
        if (step?.advanceOn === `switch-${view}`) {
          useGameStore.getState().advanceTutorial();
        }
      }
    } catch { /* ignore during init */ }
  },
  setActiveDistrict: (id) => set({ activeDistrictId: id, selectedSlot: null, selectedBusinessId: null }),
  selectSlot: (districtId, slotIndex) => set({ selectedSlot: { districtId, slotIndex }, selectedBusinessId: null, activePanel: null }),
  selectBusiness: (instanceId) => set({ selectedBusinessId: instanceId, selectedSlot: null }),
  setPanel: (panel) => set({ activePanel: panel, selectedSlot: null, selectedBusinessId: null }),
  setShowAccountScreen: (show) => set({ showAccountScreen: show }),
  setShowLeaderboard: (show) => set({ showLeaderboard: show }),
  setShowTechMenu: (show) => set({ showTechMenu: show }),
  setShowPrestigeConfirm: (show) => set({ showPrestigeConfirm: show }),
  setShowCasino: (show) => set({ showCasino: show }),
  setShowJewelryStore: (show) => set({ showJewelryStore: show }),
  setShowCarDealership: (show) => set({ showCarDealership: show }),
  setGameSpeed: (speed) => set({ gameSpeed: speed }),
  closeAll: () => set({ selectedSlot: null, selectedBusinessId: null, activePanel: null }),

  addNotification: (message, type) => {
    const id = ++notifId;
    sound.play(type === 'success' ? 'notify_success' : 'notify_warning');
    set((s) => ({ notifications: [...s.notifications, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));
    }, 3000);
  },
  removeNotification: (id) => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
}));
