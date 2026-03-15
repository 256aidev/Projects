import { useGameStore } from '../store/gameStore';
import { getCrewCount } from '../data/crewDefs';

/** Computed rival status — used by LegalView, LeaderboardView */
export function useRivalStatus() {
  const rivals = useGameStore((s) => s.rivals ?? []);
  const crew = useGameStore((s) => s.crew ?? []);

  const defeated = rivals.filter(r => r.isDefeated).length;
  const active = rivals.filter(r => !r.isDefeated);
  const totalCrew = getCrewCount(crew);

  return {
    rivals,
    defeated,
    total: rivals.length,
    activeRivals: active,
    crew,
    totalCrew,
  };
}
