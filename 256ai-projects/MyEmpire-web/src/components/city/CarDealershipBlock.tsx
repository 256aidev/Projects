import { useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../engine/economy';
import { LOAN_DEFS, DEPOSIT_INTEREST_RATE, calcMonthlyPayment } from '../../data/bankDefs';
import { sound } from '../../engine/sound';
import Tooltip from '../ui/Tooltip';

const BLOCK_W = 164;
const BLOCK_H = 258;
const ROAD_W = 22;
const DOUBLE_H = BLOCK_H * 2 + ROAD_W;

export default function CarDealershipBlock() {
  const setShowCarDealership = useUIStore(s => s.setShowCarDealership);
  const addNotification = useUIStore(s => s.addNotification);
  const cars = useGameStore(s => s.cars);
  const cleanCash = useGameStore(s => s.cleanCash);
  const bankBalance = useGameStore(s => s.bankBalance ?? 0);
  const bankLoans = useGameStore(s => s.bankLoans ?? []);
  const bankDeposit = useGameStore(s => s.bankDeposit);
  const bankWithdraw = useGameStore(s => s.bankWithdraw);
  const bankTakeLoan = useGameStore(s => s.bankTakeLoan);
  const bankPayOffLoan = useGameStore(s => s.bankPayOffLoan);

  const totalPrestige = cars.reduce((s, c) => s + c.prestigeBonus, 0);
  const totalOwed = bankLoans.reduce((s, l) => s + l.remainingBalance, 0);
  const totalMonthly = bankLoans.reduce((s, l) => s + l.monthlyPayment, 0);

  const [depositAmt, setDepositAmt] = useState('');
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [showLoanPicker, setShowLoanPicker] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<string | null>(null);
  const [loanAmt, setLoanAmt] = useState('');

  const doDeposit = (amt: number) => {
    if (bankDeposit(amt)) { sound.play('buy'); addNotification(`Deposited ${formatMoney(amt)}`, 'success'); setDepositAmt(''); }
    else addNotification('Not enough clean cash', 'warning');
  };
  const doWithdraw = (amt: number) => {
    if (bankWithdraw(amt)) { sound.play('buy'); addNotification(`Withdrew ${formatMoney(amt)}`, 'success'); setWithdrawAmt(''); }
    else addNotification('Not enough in account', 'warning');
  };
  const doLoan = () => {
    if (!selectedLoan) return;
    const def = LOAN_DEFS.find(d => d.id === selectedLoan);
    if (!def) return;
    const amt = parseInt(loanAmt) || def.maxAmount;
    if (bankTakeLoan(selectedLoan, amt)) {
      sound.play('buy');
      addNotification(`Loan approved: ${formatMoney(Math.min(amt, def.maxAmount))}`, 'success');
      setLoanAmt(''); setSelectedLoan(null); setShowLoanPicker(false);
    } else addNotification('Loan denied — max 3 active', 'warning');
  };

  return (
    <div
      style={{ width: BLOCK_W, height: DOUBLE_H, borderColor: '#EF444430', backgroundColor: '#11111180' }}
      className="rounded-lg border flex flex-col overflow-hidden"
    >
      {/* ── Prestige Motors (top half) ── */}
      <Tooltip text="Browse cars. Status symbols that boost reputation.">
        <button
          onClick={() => setShowCarDealership(true)}
          className="w-full p-2 flex flex-col items-center justify-center gap-1 hover:brightness-125 transition-all cursor-pointer border-b border-gray-800"
          style={{ backgroundColor: '#EF444408' }}
        >
          <span className="text-2xl">🏎️</span>
          <p className="text-[10px] font-bold text-red-400">Prestige Motors</p>
          <p className="text-[8px] text-gray-400">Collect cars, flex prestige</p>
          <span className="text-[7px] text-gray-500">
            {cars.length} car{cars.length !== 1 ? 's' : ''} owned
          </span>
          {totalPrestige > 0 && (
            <span className="text-[7px] text-red-400">+{totalPrestige} prestige</span>
          )}
          <div className="flex gap-1.5 text-sm">
            <span>🚗</span><span>🏁</span><span>🔥</span>
          </div>
          <p className="text-[7px] text-red-500/60">Tap to shop</p>
        </button>
      </Tooltip>

      {/* ── Bank (bottom half — always visible) ── */}
      <div className="flex-1 p-2 flex flex-col gap-1.5" style={{ backgroundColor: '#10B98108' }}>
        <div className="flex items-center gap-1 justify-center">
          <span className="text-sm">🏦</span>
          <p className="text-[10px] font-bold text-emerald-400">First National Bank</p>
        </div>

        {/* Balance */}
        <div className="text-center">
          <p className="text-[8px] text-gray-500">Balance</p>
          <p className="text-sm font-bold text-green-400">{formatMoney(bankBalance)}</p>
          <p className="text-[7px] text-gray-500">{(DEPOSIT_INTEREST_RATE * 100).toFixed(0)}% APR · {formatMoney(Math.floor(bankBalance * DEPOSIT_INTEREST_RATE / 12))}/mo</p>
        </div>

        {/* Deposit row */}
        <div className="flex gap-1">
          <input
            type="number"
            value={depositAmt}
            onChange={e => setDepositAmt(e.target.value)}
            placeholder="Deposit..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-1.5 py-1 text-[10px] text-white min-w-0"
          />
          <button onClick={() => doDeposit(parseInt(depositAmt) || 0)} className="bg-emerald-700 hover:bg-emerald-600 text-white px-1.5 py-1 rounded text-[9px] font-bold">Dep</button>
          <button onClick={() => doDeposit(cleanCash)} className="bg-emerald-900 hover:bg-emerald-800 text-emerald-400 px-1 py-1 rounded text-[9px]">All</button>
        </div>

        {/* Withdraw row */}
        <div className="flex gap-1">
          <input
            type="number"
            value={withdrawAmt}
            onChange={e => setWithdrawAmt(e.target.value)}
            placeholder="Withdraw..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-1.5 py-1 text-[10px] text-white min-w-0"
          />
          <button onClick={() => doWithdraw(parseInt(withdrawAmt) || 0)} className="bg-red-800 hover:bg-red-700 text-white px-1.5 py-1 rounded text-[9px] font-bold">Out</button>
          <button onClick={() => doWithdraw(bankBalance)} className="bg-red-900 hover:bg-red-800 text-red-400 px-1 py-1 rounded text-[9px]">All</button>
        </div>

        {/* Active loans summary */}
        {bankLoans.length > 0 && (
          <div className="text-center">
            <p className="text-[8px] text-orange-400">{bankLoans.length} loan{bankLoans.length !== 1 ? 's' : ''} · {formatMoney(totalMonthly)}/mo</p>
            <p className="text-[7px] text-gray-500">Owed: {formatMoney(totalOwed)}</p>
            {bankLoans.map((loan, i) => (
              <div key={i} className="flex items-center justify-between mt-0.5">
                <span className="text-[7px] text-gray-400">{formatMoney(loan.remainingBalance)} left</span>
                <button
                  onClick={() => {
                    if (bankPayOffLoan(i)) { sound.play('buy'); addNotification('Loan paid off!', 'success'); }
                    else addNotification('Need ' + formatMoney(loan.remainingBalance) + ' clean', 'warning');
                  }}
                  disabled={cleanCash < loan.remainingBalance}
                  className="text-[7px] text-emerald-400 hover:text-emerald-300 disabled:text-gray-600"
                >
                  Pay Off
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Loan button */}
        {!showLoanPicker ? (
          <button
            onClick={() => setShowLoanPicker(true)}
            disabled={bankLoans.length >= 3}
            className="w-full bg-blue-800 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-white text-white py-1 rounded text-[9px] font-bold"
          >
            {bankLoans.length >= 3 ? 'Max Loans (3/3)' : 'Take a Loan'}
          </button>
        ) : (
          <div className="bg-gray-800/80 rounded p-1.5 space-y-1">
            <div className="flex gap-1">
              {LOAN_DEFS.map(def => (
                <button
                  key={def.id}
                  onClick={() => setSelectedLoan(def.id)}
                  className={`flex-1 py-0.5 rounded text-[8px] font-bold ${selectedLoan === def.id ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
                >
                  {def.termMonths / 12}yr
                </button>
              ))}
            </div>
            {selectedLoan && (() => {
              const def = LOAN_DEFS.find(d => d.id === selectedLoan)!;
              const amt = parseInt(loanAmt) || def.maxAmount;
              const monthly = calcMonthlyPayment(Math.min(amt, def.maxAmount), def.interestRate, def.termMonths);
              return (
                <>
                  <p className="text-[7px] text-gray-400 text-center">{def.interestRate * 100}% APR · max {formatMoney(def.maxAmount)} · {formatMoney(monthly)}/mo</p>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={loanAmt}
                      onChange={e => setLoanAmt(e.target.value)}
                      placeholder={formatMoney(def.maxAmount)}
                      className="flex-1 bg-gray-900 border border-gray-700 rounded px-1.5 py-1 text-[10px] text-white min-w-0"
                    />
                    <button onClick={doLoan} className="bg-blue-700 hover:bg-blue-600 text-white px-2 py-1 rounded text-[9px] font-bold">Go</button>
                  </div>
                </>
              );
            })()}
            <button onClick={() => { setShowLoanPicker(false); setSelectedLoan(null); }} className="w-full text-[8px] text-gray-500 hover:text-white">Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}
