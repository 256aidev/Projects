import { useGameStore } from '../store/gameStore';
import { getHeatTier, getRivalHeatTier, HEAT_MAX } from '../engine/heat';
import { HEAT_TIER_NAMES, HEAT_TIER_COLORS, RIVAL_TIER_NAMES, RIVAL_TIER_COLORS } from '../data/types';

/** Computed heat status — used by HUD, LegalView */
export function useHeatStatus() {
  const heat = useGameStore((s) => s.heat);
  const rivalHeat = useGameStore((s) => s.rivalHeat ?? 0);

  const heatTier = getHeatTier(heat);
  const tierColor = HEAT_TIER_COLORS[heatTier];
  const tierName = HEAT_TIER_NAMES[heatTier];

  const rivalTier = getRivalHeatTier(rivalHeat);
  const rivalColor = RIVAL_TIER_COLORS[rivalTier];
  const rivalTierName = RIVAL_TIER_NAMES[rivalTier];

  return {
    heat,
    heatTier,
    tierColor,
    tierName,
    rivalHeat,
    rivalTier,
    rivalColor,
    rivalTierName,
    heatMax: HEAT_MAX,
  };
}
