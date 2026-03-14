import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';

export function useGameTick() {
  const tick = useGameStore((s) => s.tick);
  const gameSpeed = useUIStore((s) => s.gameSpeed);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (gameSpeed === 0) return; // paused

    // At speed N, tick N times per second (every 1000/N ms)
    const ms = Math.round(1000 / gameSpeed);
    intervalRef.current = setInterval(tick, ms);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tick, gameSpeed]);
}
