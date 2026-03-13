import { create } from 'zustand';
import * as householdApi from '../api/household';
import * as childrenApi from '../api/children';
import type { Household, HouseholdMember, HouseholdSettings } from '../api/household';
import type { AddChildDto, UpdateChildDto } from '../api/children';

interface HouseholdState {
  household: Household | null;
  members: HouseholdMember[];
  loading: boolean;
  error: string | null;

  // Derived
  activeChildren: () => HouseholdMember[];
  parents: () => HouseholdMember[];

  // Actions
  loadHousehold: () => Promise<void>;
  updateSettings: (updates: Partial<HouseholdSettings>) => Promise<void>;
  addChild: (dto: AddChildDto) => Promise<void>;
  updateChild: (id: string, dto: UpdateChildDto) => Promise<void>;
  deactivateChild: (id: string) => Promise<void>;
}

export const useHouseholdStore = create<HouseholdState>((set, get) => ({
  household: null,
  members: [],
  loading: false,
  error: null,

  activeChildren: () =>
    get().members.filter((m) => m.role === 'child' && m.is_active),

  parents: () =>
    get().members.filter((m) => m.role === 'parent'),

  loadHousehold: async () => {
    set({ loading: true, error: null });
    try {
      const [household, members] = await Promise.all([
        householdApi.getHousehold(),
        householdApi.getMembers(),
      ]);
      set({ household, members, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load household';
      console.error('Load household error:', err);
      set({ loading: false, error: message });
    }
  },

  updateSettings: async (updates) => {
    set({ loading: true, error: null });
    try {
      const household = await householdApi.updateSettings(updates);
      set({ household, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update settings';
      console.error('Update settings error:', err);
      set({ loading: false, error: message });
      throw err;
    }
  },

  addChild: async (dto) => {
    set({ loading: true, error: null });
    try {
      await childrenApi.addChild(dto);
      const members = await householdApi.getMembers();
      set({ members, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add child';
      console.error('Add child error:', err);
      set({ loading: false, error: message });
      throw err;
    }
  },

  updateChild: async (id, dto) => {
    set({ loading: true, error: null });
    try {
      await childrenApi.updateChild(id, dto);
      const members = await householdApi.getMembers();
      set({ members, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update child';
      console.error('Update child error:', err);
      set({ loading: false, error: message });
      throw err;
    }
  },

  deactivateChild: async (id) => {
    set({ loading: true, error: null });
    try {
      await childrenApi.deactivateChild(id);
      const members = await householdApi.getMembers();
      set({ members, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to deactivate child';
      console.error('Deactivate child error:', err);
      set({ loading: false, error: message });
      throw err;
    }
  },
}));
