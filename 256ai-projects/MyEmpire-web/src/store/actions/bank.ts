import type { GameState } from '../../data/types';
import { LOAN_DEFS, LOAN_DEF_MAP, calcMonthlyPayment } from '../../data/bankDefs';
import type { ActiveLoan } from '../../data/bankDefs';

type SetState = (partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)) => void;
type GetState = () => GameState;

export function createBankActions(set: SetState, get: GetState) {
  return {
    bankDeposit: (amount: number) => {
      const state = get();
      const deposit = Math.min(amount, state.cleanCash);
      if (deposit <= 0) return false;
      set({
        cleanCash: state.cleanCash - deposit,
        bankBalance: (state.bankBalance ?? 0) + deposit,
      });
      return true;
    },

    bankWithdraw: (amount: number) => {
      const state = get();
      const balance = state.bankBalance ?? 0;
      const withdraw = Math.min(amount, balance);
      if (withdraw <= 0) return false;
      set({
        cleanCash: state.cleanCash + withdraw,
        bankBalance: balance - withdraw,
      });
      return true;
    },

    bankTakeLoan: (defId: string, amount: number) => {
      const state = get();
      const def = LOAN_DEF_MAP[defId];
      if (!def) return false;

      const loanAmount = Math.min(amount, def.maxAmount);
      if (loanAmount <= 0) return false;

      // Max 3 active loans
      const loans = state.bankLoans ?? [];
      if (loans.length >= 3) return false;

      const monthlyPayment = calcMonthlyPayment(loanAmount, def.interestRate, def.termMonths);

      const newLoan: ActiveLoan = {
        defId,
        principal: loanAmount,
        remainingBalance: Math.ceil(monthlyPayment * def.termMonths), // total with interest
        monthlyPayment,
        monthsRemaining: def.termMonths,
        ticksSinceLastPayment: 0,
      };

      set({
        cleanCash: state.cleanCash + loanAmount,
        bankLoans: [...loans, newLoan],
      });
      return true;
    },

    bankPayOffLoan: (index: number) => {
      const state = get();
      const loans = [...(state.bankLoans ?? [])];
      const loan = loans[index];
      if (!loan) return false;

      // Pay off remaining balance from clean cash
      if (state.cleanCash < loan.remainingBalance) return false;

      const payoff = loan.remainingBalance;
      loans.splice(index, 1);

      set({
        cleanCash: state.cleanCash - payoff,
        bankLoans: loans,
      });
      return true;
    },
  };
}
