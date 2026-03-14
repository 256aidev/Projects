// Casino constants — dirty cash in, clean cash out (minus tax)
export const CASINO_TAX_RATE = 0.15;   // 15% tax on gross winnings
export const MIN_BET = 100;
export const MAX_BET = 100000;

// ─── ROULETTE ───────────────────────────────────────────────────────
export type RouletteBetType = 'number' | 'color' | 'section' | 'half' | 'parity';

export interface RouletteBet {
  type: RouletteBetType;
  value: number | string;    // number: 0-36, color: 'red'|'black', section: '1st'|'2nd'|'3rd', half: 'low'|'high', parity: 'even'|'odd'
}

export const ROULETTE_PAYOUTS: Record<RouletteBetType, number> = {
  number: 35,     // 35:1
  color: 2,       // 2:1
  section: 3,     // 3:1 (1-12, 13-24, 25-36)
  half: 2,        // 2:1 (1-18, 19-36)
  parity: 2,      // 2:1 (even, odd)
};

export const ROULETTE_REDS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

// ─── BLACKJACK ──────────────────────────────────────────────────────
// Standard rules: dealer hits on <17, blackjack pays 3:2, push returns bet
export const BLACKJACK_PAYOUT = 1;         // 1:1 normal win
export const BLACKJACK_NATURAL_PAYOUT = 1.5; // 3:2 for natural blackjack

// ─── POKER (5-card draw, simplified) ────────────────────────────────
export const POKER_HAND_PAYOUTS: Record<string, number> = {
  'royal_flush':    250,
  'straight_flush': 50,
  'four_of_a_kind': 25,
  'full_house':     10,
  'flush':          7,
  'straight':       5,
  'three_of_a_kind': 3,
  'two_pair':       2,
  'pair':           1,
  'high_card':      0,    // lose
};

export const POKER_HAND_NAMES: Record<string, string> = {
  'royal_flush':    'Royal Flush',
  'straight_flush': 'Straight Flush',
  'four_of_a_kind': 'Four of a Kind',
  'full_house':     'Full House',
  'flush':          'Flush',
  'straight':       'Straight',
  'three_of_a_kind': 'Three of a Kind',
  'two_pair':       'Two Pair',
  'pair':           'Pair (Jacks+)',
  'high_card':      'High Card',
};

// Card representation
export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: number;  // 2-14 (11=J, 12=Q, 13=K, 14=A)
}

export const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠',
};

export const RANK_NAMES: Record<number, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9',
  10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};
