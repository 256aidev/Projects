import type { CarDef, CarTier, CarBonusType } from './types';

export const CAR_DEFS: CarDef[] = [
  // ─── ECONOMY — Heat Reduction (blend in, look normal) ──────────
  { id: 'corolla',    name: 'Toyota Corolla',     tier: 'economy',  cost: 150000,    currency: 'dirty', bonusType: 'heatReduction', bonusValue: 0.03, icon: '🚗', description: 'Blend in. -3% police heat gain.' },
  { id: 'camry',      name: 'Toyota Camry',       tier: 'economy',  cost: 150000,    currency: 'dirty', bonusType: 'heatReduction', bonusValue: 0.05, icon: '🚗', description: 'Nothing to see here. -5% police heat gain.' },
  { id: 'civic',      name: 'Honda Civic',        tier: 'economy',  cost: 200000,    currency: 'dirty', bonusType: 'heatReduction', bonusValue: 0.08, icon: '🚗', description: 'Perfect cover car. -8% police heat gain.' },

  // ─── SPORT — Grow Speed (performance = faster cycles) ───────────
  { id: 'mustang',    name: 'Ford Mustang GT',    tier: 'sport',    cost: 35000,     bonusType: 'growSpeed', bonusValue: 0.05, icon: '🏎️', description: 'Fast runs, fast grows. -5% grow time.' },
  { id: 'camaro',     name: 'Chevy Camaro SS',    tier: 'sport',    cost: 45000,     bonusType: 'growSpeed', bonusValue: 0.08, icon: '🏎️', description: 'Raw power. -8% grow time.' },
  { id: 'supra',      name: 'Toyota Supra',       tier: 'sport',    cost: 55000,     bonusType: 'growSpeed', bonusValue: 0.10, icon: '🏎️', description: 'JDM speed. -10% grow time.' },

  // ─── LUXURY — Dealer Boost (flex = more customers) ──────────────
  { id: 'bmw_m5',     name: 'BMW M5',             tier: 'luxury',   cost: 100000,    bonusType: 'dealerBoost', bonusValue: 0.05, icon: '🚘', description: 'Executive ride. +5% dealer sales.' },
  { id: 'merc_s',     name: 'Mercedes S-Class',   tier: 'luxury',   cost: 130000,    bonusType: 'dealerBoost', bonusValue: 0.08, icon: '🚘', description: 'Boss moves. +8% dealer sales.' },
  { id: 'range',      name: 'Range Rover',        tier: 'luxury',   cost: 150000,    bonusType: 'dealerBoost', bonusValue: 0.10, icon: '🚘', description: 'Commanding presence. +10% dealer sales.' },

  // ─── EXOTIC — Income Multiplier (status = more money) ───────────
  { id: 'porsche_gt', name: 'Porsche 911 GT3',    tier: 'exotic',   cost: 250000,    bonusType: 'incomeMultiplier', bonusValue: 0.05, icon: '🏁', description: 'Respect earns cash. +5% dirty income.' },
  { id: 'ferrari',    name: 'Ferrari 488',        tier: 'exotic',   cost: 350000,    bonusType: 'incomeMultiplier', bonusValue: 0.08, icon: '🏁', description: 'Italian stallion. +8% dirty income.' },
  { id: 'lambo',      name: 'Lamborghini Huracán', tier: 'exotic',  cost: 400000,    bonusType: 'incomeMultiplier', bonusValue: 0.10, icon: '🏁', description: 'All eyes on you. +10% dirty income.' },

  // ─── SUPERCAR — Launder Boost (ultimate wealth = legit cover) ───
  { id: 'mclaren',    name: 'McLaren 720S',       tier: 'supercar', cost: 750000,    bonusType: 'launderBoost', bonusValue: 0.08, icon: '🔥', description: 'Money moves. +8% launder efficiency.' },
  { id: 'pagani',     name: 'Pagani Huayra',      tier: 'supercar', cost: 1200000,   bonusType: 'launderBoost', bonusValue: 0.12, icon: '🔥', description: 'Rolling artwork. +12% launder efficiency.' },
  { id: 'bugatti',    name: 'Bugatti Chiron',      tier: 'supercar', cost: 2000000,   bonusType: 'launderBoost', bonusValue: 0.15, icon: '🔥', description: 'The ultimate flex. +15% launder efficiency.' },
];

export const CAR_DEF_MAP = Object.fromEntries(CAR_DEFS.map(c => [c.id, c]));

/** Calculate total bonuses from all owned cars */
export function getCarBonuses(ownedCars: { defId: string }[]): Record<CarBonusType, number> {
  const bonuses: Record<CarBonusType, number> = {
    heatReduction: 0,
    growSpeed: 0,
    dealerBoost: 0,
    incomeMultiplier: 0,
    launderBoost: 0,
  };
  for (const car of ownedCars) {
    const def = CAR_DEF_MAP[car.defId];
    if (def) bonuses[def.bonusType] += def.bonusValue;
  }
  return bonuses;
}

export const CAR_TIER_COLORS: Record<CarTier, string> = {
  economy: '#6B7280',
  sport: '#3B82F6',
  luxury: '#A855F7',
  exotic: '#F59E0B',
  supercar: '#EF4444',
};

export const CAR_TIER_ORDER: CarTier[] = ['economy', 'sport', 'luxury', 'exotic', 'supercar'];
