import { useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../engine/economy';
import { LOAN_DEFS, DEPOSIT_INTEREST_RATE, calcMonthlyPayment } from '../../data/bankDefs';
import type { ActiveLoan } from '../../data/bankDefs';
import { sound } from '../../engine/sound';

export default function BankView() {
  const close = useUIStore(s => s.setShowBank);
  const cleanCash = useGameStore(s => s.cleanCash);
  const bankBalance = useGameStore(s => s.bankBalance ?? 0);
  const bankLoans = useGameStore(s => s.bankLoans ?? []);
  const bankDeposit = useGameStore(s => s.bankDeposit);
  const bankWithdraw = useGameStore(s => s.bankWithdraw);
  const bankTakeLoan = useGameStore(s => s.bankTakeLoan);
  const bankPayOffLoan = useGameStore(s => s.bankPayOffLoan);
  const addNotification = useUIStore(s => s.addNotification);

  const [depositAmt, setDepositAmt] = useState('');
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [loanAmts, setLoanAmts] = useState<Record<string, string>>({});

  const handleDeposit = (amount: number) => {
    if (bankDeposit(amount)) { sound.play('buy'); addNotification(`Deposited ${formatMoney(amount)}`, 'success'); setDepositAmt(''); }
    else addNotification('Not enough clean cash', 'warning');
  };

  const handleWithdraw = (amount: number) => {
    if (bankWithdraw(amount)) { sound.play('buy'); addNotification(`Withdrew ${formatMoney(amount)}`, 'success'); setWithdrawAmt(''); }
    else addNotification('Not enough in account', 'warning');
  };

  const handleLoan = (defId: string) => {
    const amt = parseInt(loanAmts[defId] || '0');
    if (amt <= 0) return;
    if (bankTakeLoan(defId, amt)) { sound.play('buy'); addNotification(`Loan approved: ${formatMoney(amt)}`, 'success'); setLoanAmts(p => ({ ...p, [defId]: '' })); }
    else addNotification('Loan denied — max 3 active loans', 'warning');
  };

  const totalOwed = bankLoans.reduce((s, l) => s + l.remainingBalance, 0);
  const totalMonthly = bankLoans.reduce((s, l) => s + l.monthlyPayment, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-emerald-900/40 border-b border-emerald-700/30">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏦</span>
          <h2 className="text-lg font-bold text-emerald-400">First National Bank</h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400">Clean Cash: <span className="text-green-400 font-bold">{formatMoney(cleanCash)}</span></span>
          <button onClick={() => close(false)} className="text-gray-400 hover:text-white text-xl px-2">✕</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ── Account Summary ── */}
        <div className="bg-gray-900/80 rounded-xl border border-emerald-800/40 p-4">
          <h3 className="text-sm font-bold text-emerald-400 mb-3">💰 Savings Account</h3>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div className="text-center">
              <p className="text-[10px] text-gray-500">Balance</p>
              <p className="text-lg font-bold text-green-400">{formatMoney(bankBalance)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-500">Interest Rate</p>
              <p className="text-lg font-bold text-yellow-400">{(DEPOSIT_INTEREST_RATE * 100).toFixed(1)}% APR</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-500">Monthly Earn</p>
              <p className="text-lg font-bold text-emerald-400">{formatMoney(Math.floor(bankBalance * DEPOSIT_INTEREST_RATE / 12))}/mo</p>
            </div>
          </div>

          {/* Deposit */}
          <div className="flex gap-2 mb-2">
            <input
              type="number"
              value={depositAmt}
              onChange={e => setDepositAmt(e.target.value)}
              placeholder="Deposit amount..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white"
            />
            <button onClick={() => handleDeposit(parseInt(depositAmt) || 0)} className="bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded text-sm font-bold">Deposit</button>
            <button onClick={() => handleDeposit(cleanCash)} className="bg-emerald-900 hover:bg-emerald-800 text-emerald-400 px-3 py-2 rounded text-sm">All</button>
          </div>

          {/* Withdraw */}
          <div className="flex gap-2">
            <input
              type="number"
              value={withdrawAmt}
              onChange={e => setWithdrawAmt(e.target.value)}
              placeholder="Withdraw amount..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white"
            />
            <button onClick={() => handleWithdraw(parseInt(withdrawAmt) || 0)} className="bg-red-800 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-bold">Withdraw</button>
            <button onClick={() => handleWithdraw(bankBalance)} className="bg-red-900 hover:bg-red-800 text-red-400 px-3 py-2 rounded text-sm">All</button>
          </div>
        </div>

        {/* ── Active Loans ── */}
        <div className="bg-gray-900/80 rounded-xl border border-orange-800/40 p-4">
          <h3 className="text-sm font-bold text-orange-400 mb-2">📋 Active Loans ({bankLoans.length}/3)</h3>
          {totalOwed > 0 && (
            <div className="flex gap-4 mb-3 text-xs">
              <span className="text-gray-400">Total owed: <span className="text-red-400 font-bold">{formatMoney(totalOwed)}</span></span>
              <span className="text-gray-400">Monthly payments: <span className="text-orange-400 font-bold">{formatMoney(totalMonthly)}/mo</span></span>
            </div>
          )}

          {bankLoans.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No active loans. Your credit is good.</p>
          ) : (
            <div className="space-y-2">
              {bankLoans.map((loan, i) => (
                <LoanCard key={i} loan={loan} index={i} onPayOff={() => {
                  if (bankPayOffLoan(i)) { sound.play('buy'); addNotification('Loan paid off!', 'success'); }
                  else addNotification('Not enough clean cash to pay off', 'warning');
                }} cleanCash={cleanCash} />
              ))}
            </div>
          )}
        </div>

        {/* ── Available Loans ── */}
        <div className="bg-gray-900/80 rounded-xl border border-blue-800/40 p-4">
          <h3 className="text-sm font-bold text-blue-400 mb-3">🏦 Available Loans</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {LOAN_DEFS.map(def => {
              const amt = parseInt(loanAmts[def.id] || '0') || def.maxAmount;
              const monthly = calcMonthlyPayment(amt, def.interestRate, def.termMonths);
              const totalCost = monthly * def.termMonths;

              return (
                <div key={def.id} className="bg-gray-800/60 rounded-lg border border-blue-900/40 p-3">
                  <h4 className="text-xs font-bold text-blue-300 mb-1">{def.name}</h4>
                  <p className="text-[10px] text-gray-500 mb-2">{def.description}</p>

                  <div className="grid grid-cols-2 gap-1 mb-2 text-[10px]">
                    <span className="text-gray-500">Rate:</span>
                    <span className="text-yellow-400 font-bold">{(def.interestRate * 100)}% APR</span>
                    <span className="text-gray-500">Max:</span>
                    <span className="text-white">{formatMoney(def.maxAmount)}</span>
                    <span className="text-gray-500">Term:</span>
                    <span className="text-white">{def.termMonths} months</span>
                    <span className="text-gray-500">Monthly:</span>
                    <span className="text-orange-400">{formatMoney(monthly)}/mo</span>
                    <span className="text-gray-500">Total cost:</span>
                    <span className="text-red-400">{formatMoney(totalCost)}</span>
                  </div>

                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={loanAmts[def.id] || ''}
                      onChange={e => setLoanAmts(p => ({ ...p, [def.id]: e.target.value }))}
                      placeholder={formatMoney(def.maxAmount)}
                      className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs text-white min-w-0"
                    />
                    <button
                      onClick={() => handleLoan(def.id)}
                      disabled={bankLoans.length >= 3}
                      className="bg-blue-700 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 text-white px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap"
                    >
                      Borrow
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoanCard({ loan, index, onPayOff, cleanCash }: { loan: ActiveLoan; index: number; onPayOff: () => void; cleanCash: number }) {
  const def = LOAN_DEFS.find(d => d.id === loan.defId);
  const progress = 1 - (loan.remainingBalance / (loan.monthlyPayment * (loan.monthsRemaining + (loan.monthlyPayment * loan.monthsRemaining > loan.remainingBalance ? 0 : 1))));

  return (
    <div className="bg-gray-800/60 rounded-lg border border-orange-900/40 p-3 flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-orange-300">{def?.name ?? 'Loan'}</span>
          <span className="text-[10px] text-gray-500">{loan.monthsRemaining} months left</span>
        </div>
        <div className="flex gap-3 text-[10px]">
          <span className="text-gray-400">Remaining: <span className="text-red-400 font-bold">{formatMoney(loan.remainingBalance)}</span></span>
          <span className="text-gray-400">Monthly: <span className="text-orange-400">{formatMoney(loan.monthlyPayment)}</span></span>
        </div>
        {/* Progress bar */}
        <div className="mt-1.5 h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(100, (1 - loan.remainingBalance / (loan.monthlyPayment * (loan.monthsRemaining + 1))) * 100))}%` }} />
        </div>
      </div>
      <button
        onClick={onPayOff}
        disabled={cleanCash < loan.remainingBalance}
        className="bg-emerald-700 hover:bg-emerald-600 disabled:bg-gray-700 disabled:text-white text-white px-3 py-2 rounded text-xs font-bold whitespace-nowrap"
      >
        Pay Off
      </button>
    </div>
  );
}
