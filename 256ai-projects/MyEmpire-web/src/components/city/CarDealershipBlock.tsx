import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../engine/economy';
import { CAR_DEF_MAP } from '../../data/carDefs';
import Tooltip from '../ui/Tooltip';

const BLOCK_W = 164;

export default function CarDealershipBlock() {
  const setShowCarDealership = useUIStore(s => s.setShowCarDealership);
  const setShowBank = useUIStore(s => s.setShowBank);
  const cars = useGameStore(s => s.cars);
  const bankBalance = useGameStore(s => s.bankBalance ?? 0);
  const bankLoans = useGameStore(s => s.bankLoans ?? []);

  const totalPrestige = cars.reduce((s, c) => s + (CAR_DEF_MAP[c.defId]?.bonusValue ?? 0), 0);
  const totalOwed = bankLoans.reduce((s, l) => s + l.remainingBalance, 0);

  return (
    <div
      style={{ width: BLOCK_W }}
      className="rounded-lg border border-gray-700/50 bg-gray-900/60 flex flex-col overflow-hidden"
    >
      {/* ── Prestige Motors ── */}
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

      {/* ── Bank ── */}
      <Tooltip text="Deposit savings for interest. Take out loans for quick cash.">
        <button
          onClick={() => setShowBank(true)}
          className="w-full p-2 flex flex-col items-center justify-center gap-1 hover:brightness-125 transition-all cursor-pointer"
          style={{ backgroundColor: '#10B98108' }}
        >
          <span className="text-xl">🏦</span>
          <p className="text-[10px] font-bold text-emerald-400">First National Bank</p>
          <span className="text-[7px] text-gray-500">
            Balance: <span className="text-green-400 font-semibold">{formatMoney(bankBalance)}</span>
          </span>
          {totalOwed > 0 && (
            <span className="text-[7px] text-orange-400">
              Owed: {formatMoney(totalOwed)} · {bankLoans.length} loan{bankLoans.length !== 1 ? 's' : ''}
            </span>
          )}
          <p className="text-[7px] text-emerald-500/60">Tap to bank</p>
        </button>
      </Tooltip>
    </div>
  );
}
