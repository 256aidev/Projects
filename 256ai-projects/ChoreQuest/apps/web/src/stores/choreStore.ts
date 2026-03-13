import { create } from 'zustand';
import * as choresApi from '../api/chores';
import * as rotationApi from '../api/rotation';
import type { Chore, CreateChoreDto, UpdateChoreDto } from '../api/chores';

interface ChoreState {
  chores: Chore[];
  loading: boolean;
  error: string | null;

  // Derived
  activeChores: () => Chore[];

  // Actions
  loadChores: () => Promise<void>;
  createChore: (dto: CreateChoreDto, rotationChildIds?: string[]) => Promise<Chore>;
  updateChore: (id: string, dto: UpdateChoreDto) => Promise<void>;
  archiveChore: (id: string) => Promise<void>;
  restoreChore: (id: string) => Promise<void>;
}

export const useChoreStore = create<ChoreState>((set, get) => ({
  chores: [],
  loading: false,
  error: null,

  activeChores: () =>
    get().chores.filter((c) => !c.is_archived),

  loadChores: async () => {
    set({ loading: true, error: null });
    try {
      const chores = await choresApi.getChores();
      set({ chores, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load chores';
      console.error('Load chores error:', err);
      set({ loading: false, error: message });
    }
  },

  createChore: async (dto, rotationChildIds) => {
    set({ loading: true, error: null });
    try {
      const chore = await choresApi.createChore(dto);
      if (dto.assignment_mode === 'rotation' && rotationChildIds?.length) {
        await rotationApi.setRotation(chore.id, rotationChildIds);
      }
      const chores = await choresApi.getChores();
      set({ chores, loading: false });
      return chore;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create chore';
      console.error('Create chore error:', err);
      set({ loading: false, error: message });
      throw err;
    }
  },

  updateChore: async (id, dto) => {
    set({ loading: true, error: null });
    try {
      await choresApi.updateChore(id, dto);
      const chores = await choresApi.getChores();
      set({ chores, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update chore';
      console.error('Update chore error:', err);
      set({ loading: false, error: message });
      throw err;
    }
  },

  archiveChore: async (id) => {
    set({ loading: true, error: null });
    try {
      await choresApi.archiveChore(id);
      const chores = await choresApi.getChores();
      set({ chores, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to archive chore';
      console.error('Archive chore error:', err);
      set({ loading: false, error: message });
      throw err;
    }
  },

  restoreChore: async (id) => {
    set({ loading: true, error: null });
    try {
      await choresApi.restoreChore(id);
      const chores = await choresApi.getChores();
      set({ chores, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to restore chore';
      console.error('Restore chore error:', err);
      set({ loading: false, error: message });
      throw err;
    }
  },
}));
