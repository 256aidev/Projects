import type { Card } from '../data/casinoDefs';
import {
  CASINO_TAX_RATE,
  ROULETTE_REDS,
  ROULETTE_PAYOUTS,
  BLACKJACK_PAYOUT,
  BLACKJACK_NATURAL_PAYOUT,
  POKER_HAND_PAYOUTS,
} from '../data/casinoDefs';
import type { RouletteBetType } from '../data/casinoDefs';

// ─── SHARED ─────────────────────────────────────────────────────────

export interface CasinoResult {
  won: boolean;
  betAmount: number;
  grossPayout: number;       // 0 if lost
  taxAmount: number;
  cleanCashWon: number;      // grossPayout - taxAmount
}

export function settleBet(betAmount: number, grossPayout: number): CasinoResult {
  const won = grossPayout > 0;
  const taxAmount = won ? Math.floor(grossPayout * CASINO_TAX_RATE) : 0;
  return {
    won,
    betAmount,
    grossPayout,
    taxAmount,
    cleanCashWon: grossPayout - taxAmount,
  };
}

// ─── DECK ───────────────────────────────────────────────────────────

function createDeck(): Card[] {
  const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const deck: Card[] = [];
  for (const suit of suits) {
    for (let rank = 2; rank <= 14; rank++) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

export function shuffleDeck(): Card[] {
  const deck = createDeck();
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// ─── ROULETTE ───────────────────────────────────────────────────────

export function spinRoulette(): number {
  return Math.floor(Math.random() * 37); // 0-36
}

export function checkRouletteWin(
  result: number,
  betType: RouletteBetType,
  betValue: number | string,
): boolean {
  switch (betType) {
    case 'number': return result === betValue;
    case 'color': {
      if (result === 0) return false;
      const isRed = ROULETTE_REDS.includes(result);
      return betValue === 'red' ? isRed : !isRed;
    }
    case 'section': {
      if (result === 0) return false;
      if (betValue === '1st') return result >= 1 && result <= 12;
      if (betValue === '2nd') return result >= 13 && result <= 24;
      return result >= 25 && result <= 36;
    }
    case 'half': {
      if (result === 0) return false;
      return betValue === 'low' ? result <= 18 : result >= 19;
    }
    case 'parity': {
      if (result === 0) return false;
      return betValue === 'even' ? result % 2 === 0 : result % 2 === 1;
    }
    default: return false;
  }
}

export function resolveRoulette(
  bet: number,
  betType: RouletteBetType,
  betValue: number | string,
): { result: number; casinoResult: CasinoResult } {
  const result = spinRoulette();
  const won = checkRouletteWin(result, betType, betValue);
  const payout = won ? bet * ROULETTE_PAYOUTS[betType] : 0;
  return { result, casinoResult: settleBet(bet, payout) };
}

// ─── BLACKJACK ──────────────────────────────────────────────────────

function cardValue(card: Card): number {
  if (card.rank >= 10 && card.rank <= 13) return 10;
  if (card.rank === 14) return 11; // ace starts as 11
  return card.rank;
}

export function handValue(cards: Card[]): number {
  let total = cards.reduce((s, c) => s + cardValue(c), 0);
  let aces = cards.filter(c => c.rank === 14).length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handValue(cards) === 21;
}

export function resolveBlackjack(
  bet: number,
  playerCards: Card[],
  dealerCards: Card[],
): CasinoResult {
  const playerVal = handValue(playerCards);
  const dealerVal = handValue(dealerCards);
  const playerBJ = isBlackjack(playerCards);
  const dealerBJ = isBlackjack(dealerCards);

  // Both blackjack = push
  if (playerBJ && dealerBJ) return settleBet(bet, bet); // return bet (push)
  // Player blackjack
  if (playerBJ) return settleBet(bet, Math.floor(bet * (1 + BLACKJACK_NATURAL_PAYOUT)));
  // Dealer blackjack
  if (dealerBJ) return settleBet(bet, 0);
  // Player bust
  if (playerVal > 21) return settleBet(bet, 0);
  // Dealer bust
  if (dealerVal > 21) return settleBet(bet, bet * (1 + BLACKJACK_PAYOUT));
  // Compare
  if (playerVal > dealerVal) return settleBet(bet, bet * (1 + BLACKJACK_PAYOUT));
  if (playerVal === dealerVal) return settleBet(bet, bet); // push
  return settleBet(bet, 0); // dealer wins
}

/** Dealer draws cards according to standard rules (hit on <17) */
export function dealerPlay(dealerCards: Card[], deck: Card[]): { dealerCards: Card[]; deck: Card[] } {
  const cards = [...dealerCards];
  let remaining = [...deck];
  while (handValue(cards) < 17 && remaining.length > 0) {
    cards.push(remaining[0]);
    remaining = remaining.slice(1);
  }
  return { dealerCards: cards, deck: remaining };
}

// ─── POKER (5-card draw) ────────────────────────────────────────────

export function evaluatePokerHand(cards: Card[]): string {
  if (cards.length !== 5) return 'high_card';

  const ranks = cards.map(c => c.rank).sort((a, b) => a - b);
  const suits = cards.map(c => c.suit);
  const isFlush = suits.every(s => s === suits[0]);

  // Check straight (handle ace-low: A-2-3-4-5)
  let isStraight = false;
  if (ranks[4] - ranks[0] === 4 && new Set(ranks).size === 5) {
    isStraight = true;
  }
  // Ace-low straight: A(14), 2, 3, 4, 5
  if (ranks[0] === 2 && ranks[1] === 3 && ranks[2] === 4 && ranks[3] === 5 && ranks[4] === 14) {
    isStraight = true;
  }

  // Count rank frequencies
  const freq: Record<number, number> = {};
  for (const r of ranks) freq[r] = (freq[r] ?? 0) + 1;
  const counts = Object.values(freq).sort((a, b) => b - a);

  // Royal flush
  if (isFlush && isStraight && ranks[0] === 10) return 'royal_flush';
  if (isFlush && isStraight) return 'straight_flush';
  if (counts[0] === 4) return 'four_of_a_kind';
  if (counts[0] === 3 && counts[1] === 2) return 'full_house';
  if (isFlush) return 'flush';
  if (isStraight) return 'straight';
  if (counts[0] === 3) return 'three_of_a_kind';
  if (counts[0] === 2 && counts[1] === 2) return 'two_pair';
  // Pair — only pays if Jacks or better
  if (counts[0] === 2) {
    const pairRank = Number(Object.entries(freq).find(([, v]) => v === 2)?.[0] ?? 0);
    if (pairRank >= 11) return 'pair';
  }
  return 'high_card';
}

export function resolvePoker(bet: number, hand: Card[]): CasinoResult {
  const handType = evaluatePokerHand(hand);
  const multiplier = POKER_HAND_PAYOUTS[handType] ?? 0;
  const payout = multiplier > 0 ? bet * (1 + multiplier) : 0;
  return settleBet(bet, payout);
}
