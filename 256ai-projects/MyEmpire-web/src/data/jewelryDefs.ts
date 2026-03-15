import type { JewelryPieceDef, JewelryTierDef, JewelrySlotType } from './types';

export const JEWELRY_TIERS: JewelryTierDef[] = [
  { name: 'Silver',    upgradeCost: 0,       icon: '⬜' },
  { name: 'Gold',      upgradeCost: 15000,   icon: '🟡' },
  { name: 'Platinum',  upgradeCost: 75000,   icon: '⚪' },
  { name: 'Diamond',   upgradeCost: 300000,  icon: '💎' },
  { name: 'Legendary', upgradeCost: 1000000, icon: '👑' },
];

export const JEWELRY_SLOT_LIMITS: Record<JewelrySlotType, number> = {
  ring: 8,       // 4 per hand, no thumbs
  bracelet: 2,
  necklace: 1,
  pendant: 1,
  earring: 2,    // one per ear
};

export const JEWELRY_DEFS: JewelryPieceDef[] = [
  // ─── RINGS (8 slots) ──────────────────────────────────────────────
  // Mix of bonuses — each ring is small but 8 slots stack up
  {
    id: 'ring_yield_1', name: 'Harvest Band', slotType: 'ring', icon: '💍',
    baseCost: 5000, tiers: JEWELRY_TIERS, bonusType: 'yield_boost', bonusPerTier: 0.01,
  },
  {
    id: 'ring_yield_2', name: 'Grower\'s Signet', slotType: 'ring', icon: '💍',
    baseCost: 8000, tiers: JEWELRY_TIERS, bonusType: 'yield_boost', bonusPerTier: 0.01,
  },
  {
    id: 'ring_heat_1', name: 'Shadow Ring', slotType: 'ring', icon: '🖤',
    baseCost: 10000, tiers: JEWELRY_TIERS, bonusType: 'heat_decay', bonusPerTier: 0.015,
  },
  {
    id: 'ring_heat_2', name: 'Ghost Band', slotType: 'ring', icon: '🖤',
    baseCost: 12000, tiers: JEWELRY_TIERS, bonusType: 'heat_decay', bonusPerTier: 0.015,
  },
  {
    id: 'ring_ops_1', name: 'Efficiency Ring', slotType: 'ring', icon: '⚙️',
    baseCost: 7000, tiers: JEWELRY_TIERS, bonusType: 'operation_discount', bonusPerTier: 0.01,
  },
  {
    id: 'ring_ops_2', name: 'Thrift Band', slotType: 'ring', icon: '⚙️',
    baseCost: 9000, tiers: JEWELRY_TIERS, bonusType: 'operation_discount', bonusPerTier: 0.01,
  },
  {
    id: 'ring_hitman_1', name: 'Iron Knuckle', slotType: 'ring', icon: '🔨',
    baseCost: 15000, tiers: JEWELRY_TIERS, bonusType: 'hitman_discount', bonusPerTier: 0.02,
  },
  {
    id: 'ring_launder_1', name: 'Clean Cut', slotType: 'ring', icon: '✨',
    baseCost: 12000, tiers: JEWELRY_TIERS, bonusType: 'launder_boost', bonusPerTier: 0.01,
  },

  // ─── BRACELETS (2 slots) ──────────────────────────────────────────
  {
    id: 'bracelet_hitman', name: 'War Bangle', slotType: 'bracelet', icon: '⛓️',
    baseCost: 25000, tiers: JEWELRY_TIERS, bonusType: 'hitman_discount', bonusPerTier: 0.03,
  },
  {
    id: 'bracelet_launder', name: 'Money Cuff', slotType: 'bracelet', icon: '💰',
    baseCost: 30000, tiers: JEWELRY_TIERS, bonusType: 'launder_boost', bonusPerTier: 0.02,
  },

  // ─── NECKLACE (1 slot) ────────────────────────────────────────────
  {
    id: 'necklace_prestige', name: 'King\'s Chain', slotType: 'necklace', icon: '📿',
    baseCost: 50000, tiers: JEWELRY_TIERS, bonusType: 'prestige_speed', bonusPerTier: 0.04,
  },

  // ─── PENDANT (1 slot, goes on the necklace) ──────────────────────
  {
    id: 'pendant_yield', name: 'Crown Medallion', slotType: 'pendant', icon: '🏅',
    baseCost: 40000, tiers: JEWELRY_TIERS, bonusType: 'yield_boost', bonusPerTier: 0.03,
  },

  // ─── EARRINGS (2 slots, one per ear) ────────────────────────────
  {
    id: 'earring_heat', name: 'Diamond Stud', slotType: 'earring', icon: '💠',
    baseCost: 20000, tiers: JEWELRY_TIERS, bonusType: 'heat_decay', bonusPerTier: 0.02,
  },
  {
    id: 'earring_dealer', name: 'Gold Hoop', slotType: 'earring', icon: '⭕',
    baseCost: 18000, tiers: JEWELRY_TIERS, bonusType: 'launder_boost', bonusPerTier: 0.015,
  },
];

export const JEWELRY_DEF_MAP = Object.fromEntries(JEWELRY_DEFS.map(j => [j.id, j]));
