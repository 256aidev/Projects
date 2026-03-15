import { useGameStore } from '../store/gameStore';

/** Computed rival status — used by LegalView, LeaderboardView */
export function useRivalStatus() {
  const rivals = useGameStore((s) => s.rivals ?? []);
  const hitmen = useGameStore((s) => s.hitmen ?? []);

  const defeated = rivals.filter(r => r.isDefeated).length;
  const active = rivals.filter(r => !r.isDefeated);
  const totalHitmen = hitmen.reduce((s, h) => s + h.count, 0);

  return {
    rivals,
    defeated,
    total: rivals.length,
    activeRivals: active,
    hitmen,
    totalHitmen,
  };
}
