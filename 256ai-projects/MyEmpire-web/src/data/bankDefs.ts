// ─────────────────────────────────────────
// BANK DEFINITIONS — Deposits, Interest, Loans
// ─────────────────────────────────────────
import { TICKS_PER_SEASON } from './seasons';

// 1 season = 1 "month" in bank terms (30 in-game days = 1,800 ticks)
export const TICKS_PER_MONTH = TICKS_PER_SEASON;

/** Annual interest rate on deposits (paid monthly) */
export const DEPOSIT_INTEREST_RATE = 0.05; // 5% APR

/** Monthly interest = APR / 12 */
export const MONTHLY_DEPOSIT_RATE = DEPOSIT_INTEREST_RATE / 12;

export interface LoanDef {
  id: string;
  name: string;
  termMonths: number;      // 12, 36, or 60
  interestRate: number;    // APR
  maxAmount: number;       // max loan amount
  description: string;
}

export const LOAN_DEFS: LoanDef[] = [
  {
    id: 'loan_1yr',
    name: '1-Year Loan',
    termMonths: 12,
    interestRate: 0.08,       // 8% APR
    maxAmount: 100_000,
    description: 'Short-term cash. High monthly payments, low total interest.',
  },
  {
    id: 'loan_3yr',
    name: '3-Year Loan',
    termMonths: 36,
    interestRate: 0.12,       // 12% APR
    maxAmount: 500_000,
    description: 'Medium-term financing. Balanced payments.',
  },
  {
    id: 'loan_5yr',
    name: '5-Year Loan',
    termMonths: 60,
    interestRate: 0.18,       // 18% APR
    maxAmount: 2_000_000,
    description: 'Long-term capital. Low monthly payments, high total interest.',
  },
];

export const LOAN_DEF_MAP = Object.fromEntries(LOAN_DEFS.map(d => [d.id, d]));

export interface ActiveLoan {
  defId: string;
  principal: number;         // original loan amount
  remainingBalance: number;  // how much still owed
  monthlyPayment: number;    // fixed monthly payment
  monthsRemaining: number;   // months left
  ticksSinceLastPayment: number; // ticks since last monthly payment
}

/** Calculate fixed monthly payment for a loan (amortization formula) */
export function calcMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  const r = annualRate / 12;
  if (r === 0) return principal / termMonths;
  return Math.ceil(principal * (r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1));
}
