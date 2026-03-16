export interface SyndicateLevel {
  level: number;
  xpRequired: number;
  perkName: string;
  perkDescription: string;
}

export const SYNDICATE_LEVELS: SyndicateLevel[] = [
  { level: 1, xpRequired: 0, perkName: 'Founded', perkDescription: 'Base syndicate' },
  { level: 2, xpRequired: 200, perkName: '+1 Underboss', perkDescription: 'Promote up to 4 underbosses' },
  { level: 3, xpRequired: 500, perkName: '+5 Members', perkDescription: 'Max 25 members' },
  { level: 4, xpRequired: 1000, perkName: 'War Bonus +25%', perkDescription: 'War winnings increased by 25%' },
  { level: 5, xpRequired: 2000, perkName: 'Treasury Interest', perkDescription: '1% treasury interest per war' },
  { level: 6, xpRequired: 4000, perkName: '+1 Daily Fight', perkDescription: '4 fight attempts per war day' },
  { level: 7, xpRequired: 8000, perkName: 'War Bonus +50%', perkDescription: 'War winnings increased by 50% total' },
  { level: 8, xpRequired: 15000, perkName: '+5 Members', perkDescription: 'Max 30 members' },
  { level: 9, xpRequired: 25000, perkName: 'Treasury Interest 2%', perkDescription: '2% treasury interest per war' },
  { level: 10, xpRequired: 50000, perkName: 'Crime Empire', perkDescription: 'Legendary title unlocked' },
];

export function getSyndicateLevel(xp: number): number {
  let level = 1;
  for (const sl of SYNDICATE_LEVELS) {
    if (xp >= sl.xpRequired) level = sl.level;
  }
  return level;
}

export function getNextLevelXp(xp: number): number | null {
  const currentLevel = getSyndicateLevel(xp);
  const next = SYNDICATE_LEVELS.find(sl => sl.level === currentLevel + 1);
  return next?.xpRequired ?? null;
}

export interface TreasuryPurchase {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
}

export const TREASURY_PURCHASES: TreasuryPurchase[] = [
  { id: 'war_shield', name: 'War Shield', description: 'Skip next war matchmaking', cost: 100000, icon: '🛡️' },
  { id: 'member_slot', name: 'Extra Slot', description: '+1 member capacity', cost: 50000, icon: '👤' },
  { id: 'xp_boost', name: 'XP Boost', description: 'Double XP from next war', cost: 200000, icon: '⚡' },
];
