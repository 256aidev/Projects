import type { RivalSyndicate } from './types';

// ── Name parts for procedural rival generation ──────────────────────────────

const PREFIXES = [
  'Los', 'The', 'El', 'Da', 'Big', 'Old', 'Black', 'Red', 'Iron', 'Dead',
];

const NAMES = [
  'Cobras', 'Vipers', 'Jackals', 'Wolves', 'Scorpions', 'Ravens',
  'Skulls', 'Ghosts', 'Blades', 'Kings', 'Serpents', 'Coyotes',
  'Sharks', 'Hawks', 'Pythons', 'Reapers', 'Phantoms', 'Tigers',
];

const ICONS = ['🐍', '🦅', '💀', '🐺', '🦂', '🔥', '⚡', '🗡️', '👑', '🦈'];

const COLORS = ['#ef4444', '#f97316', '#a855f7', '#ec4899', '#06b6d4', '#84cc16', '#eab308', '#f43f5e'];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateRivals(count: number, seed?: number): RivalSyndicate[] {
  const rng = seededRandom(seed ?? Date.now());
  const pick = <T>(arr: T[]) => arr[Math.floor(rng() * arr.length)];
  const usedNames = new Set<string>();
  const usedColors = new Set<string>();

  const rivals: RivalSyndicate[] = [];
  for (let i = 0; i < count; i++) {
    let name: string;
    do {
      name = `${pick(PREFIXES)} ${pick(NAMES)}`;
    } while (usedNames.has(name));
    usedNames.add(name);

    let color: string;
    do {
      color = pick(COLORS);
    } while (usedColors.has(color) && usedColors.size < COLORS.length);
    usedColors.add(color);

    rivals.push({
      id: `rival_${i}`,
      name,
      color,
      icon: pick(ICONS),
      dirtyCash: 5000 + Math.floor(rng() * 10000),
      cleanCash: 1000 + Math.floor(rng() * 5000),
      productOz: 10 + Math.floor(rng() * 40),
      businesses: [],
      hitmen: 1 + Math.floor(rng() * 3),
      aggression: 0.1 + rng() * 0.4,
      power: 1,
      isDefeated: false,
    });
  }
  return rivals;
}
