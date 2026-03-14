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

    // Each speed step is 125ms faster: 1x=1000, 2x=875, 4x=750, 8x=625
    const SPEED_MS: Record<number, number> = { 1: 1000, 2: 875, 4: 750, 8: 625 };
    const ms = SPEED_MS[gameSpeed] ?? 1000;
    intervalRef.current = setInterval(tick, ms);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tick, gameSpeed]);
}
