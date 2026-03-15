import type { GameSystem } from './types';
import { TICKS_PER_MONTH, MONTHLY_DEPOSIT_RATE } from '../../data/bankDefs';

/**
 * Banking system — runs each tick.
 * - Pays deposit interest once per month (1 season = 1,800 ticks)
 * - Deducts loan payments once per month from clean cash
 * - If clean cash can't cover loan payment, deducts from dirty cash + adds heat
 */
export const tickBankingSystem: GameSystem = (ts, _ctx) => {
  const ticksSinceLast = ts.tickCount - ts.bankLastInterestTick;

  if (ticksSinceLast >= TICKS_PER_MONTH) {
    // ── Monthly deposit interest ──
    if (ts.bankBalance > 0) {
      const interest = Math.floor(ts.bankBalance * MONTHLY_DEPOSIT_RATE);
      ts.bankBalance += interest;
    }

    // ── Monthly loan payments ──
    for (let i = ts.bankLoans.length - 1; i >= 0; i--) {
      const loan = ts.bankLoans[i];
      const payment = Math.min(loan.monthlyPayment, loan.remainingBalance);

      if (ts.cleanCash >= payment) {
        ts.cleanCash -= payment;
      } else {
        // Not enough clean cash — take from dirty + heat penalty
        const shortfall = payment - ts.cleanCash;
        ts.cleanCash = 0;
        ts.dirtyCash -= shortfall;
        ts.heat += 2; // suspicious financial activity
      }

      loan.remainingBalance -= payment;
      loan.monthsRemaining -= 1;
      loan.ticksSinceLastPayment = 0;

      // Loan fully paid off
      if (loan.remainingBalance <= 0 || loan.monthsRemaining <= 0) {
        ts.bankLoans.splice(i, 1);
      }
    }

    ts.bankLastInterestTick = ts.tickCount;
  }
};
