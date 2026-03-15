// ─────────────────────────────────────────
// CURRENCY DEFINITIONS
// ─────────────────────────────────────────
// To rename/re-skin currencies, edit this file only.
// Components use CurrencyDisplay which reads from CURRENCY_MAP.

export interface CurrencyDef {
  id: string;
  name: string;
  icon: string;
  color: string;        // Tailwind text color class
  bgColor: string;      // Tailwind bg color for pills/badges
  description: string;
}

export const CURRENCIES: CurrencyDef[] = [
  {
    id: 'dirty',
    name: 'Dirty Cash',
    icon: '💵',
    color: 'text-green-400',
    bgColor: 'bg-green-900/40',
    description: 'Cash from illegal sales. Buy seeds, dealers, and fund operations.',
  },
  {
    id: 'clean',
    name: 'Clean Cash',
    icon: '🏦',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/40',
    description: 'Laundered money. Buy businesses, lots, cars, and legal help.',
  },
];

export const CURRENCY_MAP = Object.fromEntries(CURRENCIES.map(c => [c.id, c]));

/** Get a currency's display properties by id */
export function getCurrency(id: 'dirty' | 'clean'): CurrencyDef {
  return CURRENCY_MAP[id] ?? CURRENCIES[0];
}
