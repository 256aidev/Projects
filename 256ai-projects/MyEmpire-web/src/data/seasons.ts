// ─────────────────────────────────────────
// SEASON SYSTEM — Calendar & Seasonal Modifiers
// ─────────────────────────────────────────
// Seasons are derived from tickCount (stateless — no migration needed).
// Each season applies economy multipliers and shifts event weights.

export type Season = 'spring' | 'summer' | 'fall' | 'winter';

export const TICKS_PER_DAY = 60;       // 1 minute at 1x speed
export const DAYS_PER_SEASON = 30;     // 30 in-game days per season
export const TICKS_PER_SEASON = TICKS_PER_DAY * DAYS_PER_SEASON; // 1,800 ticks
export const TICKS_PER_YEAR = TICKS_PER_SEASON * 4;              // 7,200 ticks (~2 hours at 1x)

export interface SeasonDef {
  id: Season;
  name: string;
  icon: string;
  color: string;
  // Economy multipliers (1.0 = normal)
  yieldMultiplier: number;          // grow harvest yield
  demandMultiplier: number;         // street sell demand
  heatMultiplier: number;           // police heat gain rate
  rivalActivityMultiplier: number;  // rival attack chance
  // Event category weight multipliers
  eventWeights: Record<string, number>;
}

export const SEASON_ORDER: Season[] = ['spring', 'summer', 'fall', 'winter'];

export const SEASONS: SeasonDef[] = [
  {
    id: 'spring',
    name: 'Spring',
    icon: '🌸',
    color: 'text-green-400',
    yieldMultiplier: 1.10,          // +10% growing season
    demandMultiplier: 1.0,
    heatMultiplier: 1.0,
    rivalActivityMultiplier: 0.8,   // rivals lay low
    eventWeights: { life: 1.0, criminal: 0.8, business: 1.5, vice: 1.0 },
  },
  {
    id: 'summer',
    name: 'Summer',
    icon: '☀️',
    color: 'text-yellow-400',
    yieldMultiplier: 1.20,          // +20% peak growth
    demandMultiplier: 1.25,         // +25% outdoor buyers
    heatMultiplier: 0.90,           // -10% cops on vacation
    rivalActivityMultiplier: 1.0,
    eventWeights: { life: 1.3, criminal: 0.8, business: 1.0, vice: 1.5 },
  },
  {
    id: 'fall',
    name: 'Fall',
    icon: '🍂',
    color: 'text-orange-400',
    yieldMultiplier: 1.0,
    demandMultiplier: 1.0,
    heatMultiplier: 1.0,
    rivalActivityMultiplier: 1.20,  // +20% rivals hungry before winter
    eventWeights: { life: 1.0, criminal: 1.5, business: 1.2, vice: 0.8 },
  },
  {
    id: 'winter',
    name: 'Winter',
    icon: '❄️',
    color: 'text-blue-300',
    yieldMultiplier: 0.85,          // -15% cold affects growth
    demandMultiplier: 0.80,         // -20% fewer street buyers
    heatMultiplier: 1.15,           // +15% cops aggressive
    rivalActivityMultiplier: 1.10,  // +10% desperate rivals
    eventWeights: { life: 1.3, criminal: 1.3, business: 0.8, vice: 1.0 },
  },
];

export const SEASON_MAP = Object.fromEntries(SEASONS.map(s => [s.id, s]));

/** Derive current season, day, and year from tick count (pure/stateless) */
export function getSeasonFromTick(tickCount: number): {
  season: Season;
  seasonDef: SeasonDef;
  day: number;       // 1-30 within current season
  seasonIndex: number; // 0-3
  year: number;      // 1-based
} {
  const tickInYear = tickCount % TICKS_PER_YEAR;
  const seasonIndex = Math.floor(tickInYear / TICKS_PER_SEASON);
  const tickInSeason = tickInYear - seasonIndex * TICKS_PER_SEASON;
  const day = Math.floor(tickInSeason / TICKS_PER_DAY) + 1;
  const year = Math.floor(tickCount / TICKS_PER_YEAR) + 1;
  const season = SEASON_ORDER[seasonIndex];
  return { season, seasonDef: SEASON_MAP[season], day, seasonIndex, year };
}
