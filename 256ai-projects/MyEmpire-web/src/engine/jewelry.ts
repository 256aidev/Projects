import type { OwnedJewelry } from '../data/types';
import { JEWELRY_DEF_MAP } from '../data/jewelryDefs';

export interface JewelryBonuses {
  prestigeSpeed: number;       // fractional bonus to prestige progress
  hitmanDiscount: number;      // fractional discount on hitman costs
  operationDiscount: number;   // fractional discount on operation cycle costs
  yieldBoost: number;          // fractional boost to harvest yield
  heatDecay: number;           // fractional boost to heat decay rate
  launderBoost: number;        // fractional boost to launder efficiency
}

const EMPTY_BONUSES: JewelryBonuses = {
  prestigeSpeed: 0, hitmanDiscount: 0, operationDiscount: 0,
  yieldBoost: 0, heatDecay: 0, launderBoost: 0,
};

const BONUS_TYPE_KEY: Record<string, keyof JewelryBonuses> = {
  prestige_speed: 'prestigeSpeed',
  hitman_discount: 'hitmanDiscount',
  operation_discount: 'operationDiscount',
  yield_boost: 'yieldBoost',
  heat_decay: 'heatDecay',
  launder_boost: 'launderBoost',
};

/** Aggregate all active jewelry bonuses */
export function getJewelryBonuses(jewelry: OwnedJewelry[]): JewelryBonuses {
  if (!jewelry || jewelry.length === 0) return EMPTY_BONUSES;
  const bonuses = { ...EMPTY_BONUSES };
  for (const owned of jewelry) {
    const def = JEWELRY_DEF_MAP[owned.defId];
    if (!def) continue;
    const key = BONUS_TYPE_KEY[def.bonusType];
    if (!key) continue;
    // Tier 0 = base purchase, tier 4 = legendary. Bonus = bonusPerTier × (tier + 1)
    bonuses[key] += def.bonusPerTier * (owned.tier + 1);
  }
  return bonuses;
}
