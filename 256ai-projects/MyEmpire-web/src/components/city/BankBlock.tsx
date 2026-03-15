import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../engine/economy';
import Tooltip from '../ui/Tooltip';

const BLOCK_W = 164;

export default function BankBlock() {
  const setShowBank = useUIStore(s => s.setShowBank);
  const bankBalance = useGameStore(s => s.bankBalance ?? 0);
  const bankLoans = useGameStore(s => s.bankLoans ?? []);

  const totalOwed = bankLoans.reduce((s, l) => s + l.remainingBalance, 0);

  return (
    <Tooltip text="Deposit savings for interest. Take out loans for quick cash.">
      <button
        onClick={() => setShowBank(true)}
        style={{ width: BLOCK_W, borderColor: '#10B98150', backgroundColor: '#10B98112' }}
        className="rounded-lg border p-2 flex flex-col items-center justify-center gap-1 hover:brightness-125 transition-all cursor-pointer"
      >
        <span className="text-3xl">🏦</span>
        <p className="text-[10px] font-bold text-emerald-400">First National Bank</p>
        <p className="text-[8px] text-gray-400">Deposits & Loans</p>

        <div className="mt-1 flex flex-col items-center gap-0.5">
          <span className="text-[7px] text-gray-500">
            Balance: <span className="text-green-400 font-semibold">{formatMoney(bankBalance)}</span>
          </span>
          {totalOwed > 0 && (
            <span className="text-[7px] text-orange-400">
              Owed: {formatMoney(totalOwed)}
            </span>
          )}
          {bankLoans.length > 0 && (
            <span className="text-[7px] text-gray-500">
              {bankLoans.length} active loan{bankLoans.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p className="text-[7px] text-emerald-500/60 mt-0.5">Tap to bank</p>
      </button>
    </Tooltip>
  );
}
