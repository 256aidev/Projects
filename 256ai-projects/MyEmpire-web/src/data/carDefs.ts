import type { CarDef, CarTier } from './types';

export const CAR_DEFS: CarDef[] = [
  // ─── ECONOMY ($5K - $15K) ────────────────────────────────────────
  { id: 'civic',      name: 'Honda Civic',        tier: 'economy',  cost: 5000,      prestigeBonus: 1,   icon: '🚗', description: 'Reliable daily driver.' },
  { id: 'corolla',    name: 'Toyota Corolla',     tier: 'economy',  cost: 8000,      prestigeBonus: 1,   icon: '🚗', description: 'Gets the job done.' },
  { id: 'camry',      name: 'Toyota Camry',       tier: 'economy',  cost: 12000,     prestigeBonus: 2,   icon: '🚗', description: 'Comfortable family sedan.' },

  // ─── SPORT ($25K - $75K) ─────────────────────────────────────────
  { id: 'mustang',    name: 'Ford Mustang GT',    tier: 'sport',    cost: 35000,     prestigeBonus: 5,   icon: '🏎️', description: 'American muscle.' },
  { id: 'camaro',     name: 'Chevy Camaro SS',    tier: 'sport',    cost: 45000,     prestigeBonus: 6,   icon: '🏎️', description: 'Raw V8 power.' },
  { id: 'supra',      name: 'Toyota Supra',       tier: 'sport',    cost: 55000,     prestigeBonus: 8,   icon: '🏎️', description: 'JDM legend.' },

  // ─── LUXURY ($80K - $200K) ───────────────────────────────────────
  { id: 'bmw_m5',     name: 'BMW M5',             tier: 'luxury',   cost: 100000,    prestigeBonus: 15,  icon: '🚘', description: 'Executive performance.' },
  { id: 'merc_s',     name: 'Mercedes S-Class',   tier: 'luxury',   cost: 130000,    prestigeBonus: 20,  icon: '🚘', description: 'Ride like a boss.' },
  { id: 'range',      name: 'Range Rover',        tier: 'luxury',   cost: 150000,    prestigeBonus: 22,  icon: '🚘', description: 'Commanding presence.' },

  // ─── EXOTIC ($250K - $500K) ──────────────────────────────────────
  { id: 'porsche_gt', name: 'Porsche 911 GT3',    tier: 'exotic',   cost: 250000,    prestigeBonus: 40,  icon: '🏁', description: 'Track-bred perfection.' },
  { id: 'ferrari',    name: 'Ferrari 488',        tier: 'exotic',   cost: 350000,    prestigeBonus: 50,  icon: '🏁', description: 'Italian stallion.' },
  { id: 'lambo',      name: 'Lamborghini Huracán', tier: 'exotic',  cost: 400000,    prestigeBonus: 55,  icon: '🏁', description: 'Attention guaranteed.' },

  // ─── SUPERCAR ($750K - $2M) ──────────────────────────────────────
  { id: 'mclaren',    name: 'McLaren 720S',       tier: 'supercar', cost: 750000,    prestigeBonus: 75,  icon: '🔥', description: 'Engineering marvel.' },
  { id: 'pagani',     name: 'Pagani Huayra',      tier: 'supercar', cost: 1200000,   prestigeBonus: 90,  icon: '🔥', description: 'Rolling artwork.' },
  { id: 'bugatti',    name: 'Bugatti Chiron',      tier: 'supercar', cost: 2000000,   prestigeBonus: 100, icon: '🔥', description: 'The ultimate flex.' },
];

export const CAR_DEF_MAP = Object.fromEntries(CAR_DEFS.map(c => [c.id, c]));

export const CAR_TIER_COLORS: Record<CarTier, string> = {
  economy: '#6B7280',
  sport: '#3B82F6',
  luxury: '#A855F7',
  exotic: '#F59E0B',
  supercar: '#EF4444',
};

export const CAR_TIER_ORDER: CarTier[] = ['economy', 'sport', 'luxury', 'exotic', 'supercar'];
