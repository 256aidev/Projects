import { create } from 'zustand';
import { httpsCallable } from 'firebase/functions';
import { collection, doc, onSnapshot, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, functions } from '../firebase';

// ── Types ─────────────────────────────────────────────────────────────

export interface SyndicateMember {
  uid: string;
  displayName: string;
  role: 'leader' | 'underboss' | 'member';
  joinedAt: number;
  powerContribution: number;
  warFightsToday: number;
  warPointsTotal: number;
}

export interface SyndicateData {
  id: string;
  name: string;
  tag: string;
  icon: string;
  color: string;
  leaderId: string;
  underbossIds: string[];
  memberIds: string[];
  memberCount: number;
  totalPower: number;
  treasury: number;
  level: number;
  xp: number;
  createdAt: number;
  currentWarId: string | null;
  warWins: number;
  warLosses: number;
}

export interface WarData {
  id: string;
  syndicateA: string;
  syndicateB: string;
  syndicateAName: string;
  syndicateBName: string;
  startedAt: number;
  endsAt: number;
  status: 'active' | 'completed';
  winnerId: string | null;
  totalPointsA: number;
  totalPointsB: number;
}

export interface FightResult {
  attackerWins: boolean;
  attackerPower: number;
  defenderPower: number;
  pointsAwarded: number;
  attackerName: string;
  defenderName: string;
}

interface SyndicateState {
  syndicate: SyndicateData | null;
  members: SyndicateMember[];
  currentWar: WarData | null;
  enemyMembers: SyndicateMember[];
  searchResults: SyndicateData[];
  loading: boolean;
  error: string | null;
  // Unsubscribe functions for real-time listeners
  _unsubSyndicate: (() => void) | null;
  _unsubMembers: (() => void) | null;
  _unsubWar: (() => void) | null;
}

interface SyndicateActions {
  // Lifecycle
  subscribe: (syndicateId: string) => void;
  unsubscribe: () => void;
  // CRUD
  createSyndicate: (name: string, tag: string, icon: string, color: string) => Promise<string | null>;
  joinSyndicate: (syndicateId: string) => Promise<boolean>;
  leaveSyndicate: () => Promise<boolean>;
  kickMember: (targetUid: string) => Promise<boolean>;
  promoteMember: (targetUid: string) => Promise<boolean>;
  contributeTreasury: (amount: number) => Promise<boolean>;
  // War
  startFight: (defenderUid: string) => Promise<FightResult | null>;
  // Search
  searchSyndicates: (searchTerm?: string) => Promise<void>;
  fetchEnemyMembers: (syndicateId: string) => Promise<void>;
  // Errors
  clearError: () => void;
}

export const useSyndicateStore = create<SyndicateState & SyndicateActions>((set, get) => ({
  syndicate: null,
  members: [],
  currentWar: null,
  enemyMembers: [],
  searchResults: [],
  loading: false,
  error: null,
  _unsubSyndicate: null,
  _unsubMembers: null,
  _unsubWar: null,

  // ── Real-time listeners ───────────────────────────────────────────

  subscribe: (syndicateId: string) => {
    const state = get();
    // Clean up existing listeners
    state._unsubSyndicate?.();
    state._unsubMembers?.();
    state._unsubWar?.();

    // Listen to syndicate document
    const unsubSyndicate = onSnapshot(doc(db, 'syndicates', syndicateId), (snap) => {
      if (snap.exists()) {
        set({ syndicate: { id: snap.id, ...snap.data() } as SyndicateData });
        // If there's an active war, listen to it
        const warId = snap.data()?.currentWarId;
        if (warId && warId !== get().currentWar?.id) {
          get()._unsubWar?.();
          const unsubWar = onSnapshot(doc(db, 'wars', warId), (warSnap) => {
            if (warSnap.exists()) {
              set({ currentWar: { id: warSnap.id, ...warSnap.data() } as WarData });
              // Fetch enemy members
              const warData = warSnap.data();
              const enemySyndicateId = warData.syndicateA === syndicateId ? warData.syndicateB : warData.syndicateA;
              get().fetchEnemyMembers(enemySyndicateId);
            } else {
              set({ currentWar: null, enemyMembers: [] });
            }
          });
          set({ _unsubWar: unsubWar });
        } else if (!warId) {
          set({ currentWar: null, enemyMembers: [] });
        }
      } else {
        set({ syndicate: null, members: [], currentWar: null });
      }
    });

    // Listen to members subcollection
    const unsubMembers = onSnapshot(
      collection(db, 'syndicates', syndicateId, 'members'),
      (snap) => {
        const members = snap.docs.map(d => ({ uid: d.id, ...d.data() } as SyndicateMember));
        set({ members });
      },
    );

    set({ _unsubSyndicate: unsubSyndicate, _unsubMembers: unsubMembers });
  },

  unsubscribe: () => {
    const state = get();
    state._unsubSyndicate?.();
    state._unsubMembers?.();
    state._unsubWar?.();
    set({ _unsubSyndicate: null, _unsubMembers: null, _unsubWar: null, syndicate: null, members: [], currentWar: null });
  },

  // ── CRUD Actions (call Cloud Functions) ───────────────────────────

  createSyndicate: async (name, tag, icon, color) => {
    set({ loading: true, error: null });
    try {
      const fn = httpsCallable(functions, 'createSyndicate');
      const result = await fn({ name, tag, icon, color });
      const data = result.data as { syndicateId: string };
      get().subscribe(data.syndicateId);
      set({ loading: false });
      return data.syndicateId;
    } catch (e: any) {
      set({ loading: false, error: e.message ?? 'Failed to create syndicate' });
      return null;
    }
  },

  joinSyndicate: async (syndicateId) => {
    set({ loading: true, error: null });
    try {
      const fn = httpsCallable(functions, 'joinSyndicate');
      await fn({ syndicateId });
      get().subscribe(syndicateId);
      set({ loading: false });
      return true;
    } catch (e: any) {
      set({ loading: false, error: e.message ?? 'Failed to join syndicate' });
      return false;
    }
  },

  leaveSyndicate: async () => {
    const syndicate = get().syndicate;
    if (!syndicate) return false;
    set({ loading: true, error: null });
    try {
      const fn = httpsCallable(functions, 'leaveSyndicate');
      await fn({ syndicateId: syndicate.id });
      get().unsubscribe();
      set({ loading: false });
      return true;
    } catch (e: any) {
      set({ loading: false, error: e.message ?? 'Failed to leave syndicate' });
      return false;
    }
  },

  kickMember: async (targetUid) => {
    const syndicate = get().syndicate;
    if (!syndicate) return false;
    try {
      const fn = httpsCallable(functions, 'kickMember');
      await fn({ syndicateId: syndicate.id, targetUid });
      return true;
    } catch (e: any) {
      set({ error: e.message ?? 'Failed to kick member' });
      return false;
    }
  },

  promoteMember: async (targetUid) => {
    const syndicate = get().syndicate;
    if (!syndicate) return false;
    try {
      const fn = httpsCallable(functions, 'promoteMember');
      await fn({ syndicateId: syndicate.id, targetUid });
      return true;
    } catch (e: any) {
      set({ error: e.message ?? 'Failed to promote member' });
      return false;
    }
  },

  contributeTreasury: async (amount) => {
    const syndicate = get().syndicate;
    if (!syndicate) return false;
    try {
      const fn = httpsCallable(functions, 'contributeTreasury');
      await fn({ syndicateId: syndicate.id, amount });
      return true;
    } catch (e: any) {
      set({ error: e.message ?? 'Failed to contribute' });
      return false;
    }
  },

  // ── War Actions ───────────────────────────────────────────────────

  startFight: async (defenderUid) => {
    const { syndicate, currentWar } = get();
    if (!syndicate || !currentWar) return null;
    try {
      const fn = httpsCallable(functions, 'startFight');
      const result = await fn({
        warId: currentWar.id,
        syndicateId: syndicate.id,
        defenderUid,
      });
      return result.data as FightResult;
    } catch (e: any) {
      set({ error: e.message ?? 'Fight failed' });
      return null;
    }
  },

  // ── Search ────────────────────────────────────────────────────────

  searchSyndicates: async () => {
    try {
      const q = query(
        collection(db, 'syndicates'),
        orderBy('memberCount', 'desc'),
        limit(20),
      );
      const snap = await getDocs(q);
      const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as SyndicateData));
      set({ searchResults: results });
    } catch (e: any) {
      console.error('Search failed:', e);
    }
  },

  fetchEnemyMembers: async (syndicateId) => {
    try {
      const snap = await getDocs(collection(db, 'syndicates', syndicateId, 'members'));
      const members = snap.docs.map(d => ({ uid: d.id, ...d.data() } as SyndicateMember));
      set({ enemyMembers: members });
    } catch (e: any) {
      console.error('Failed to fetch enemy members:', e);
    }
  },

  clearError: () => set({ error: null }),
}));
