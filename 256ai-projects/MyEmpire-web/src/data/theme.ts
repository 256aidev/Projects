// ─────────────────────────────────────────
// GAME THEME CONFIG
// ─────────────────────────────────────────
// All game-specific names, icons, and labels in one place.
// To re-skin the game, edit this file only.
// Components use useTheme() hook to access these values.

export const GAME_THEME = {
  gameName: 'My Empire',
  gameSubtitle: 'Kingpin',

  product: {
    name: 'Product',
    unit: 'oz',
    icon: '🌿',
    seedName: 'Seeds',
    seedIcon: '🌱',
  },

  currencies: {
    primary: { id: 'dirty' as const, name: 'Dirty Cash', icon: '💵' },
    secondary: { id: 'clean' as const, name: 'Clean Cash', icon: '🏦' },
    launderVerb: 'Launder',
  },

  workers: {
    name: 'Dealers',
    singular: 'Dealer',
    icon: '🤝',
  },

  production: {
    name: 'Grow Room',
    plural: 'Grow Rooms',
    icon: '🌱',
  },

  threat: {
    name: 'Heat',
    icon: '🔥',
    policeLabel: 'Police',
    policeIcon: '🚔',
    rivalLabel: 'Rival',
    rivalIcon: '🔫',
  },

  fronts: {
    name: 'Front Business',
    plural: 'Front Businesses',
    icon: '🏢',
  },

  rivals: {
    name: 'Rival Syndicate',
    plural: 'Rival Syndicates',
    icon: '🔫',
  },

  defense: {
    name: 'Hitman',
    plural: 'Hitmen',
    icon: '🔫',
  },
};

export type GameTheme = typeof GAME_THEME;
