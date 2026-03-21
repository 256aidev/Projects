import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../engine/economy';
import { CAR_DEF_MAP } from '../../data/carDefs';
import Tooltip from '../ui/Tooltip';
import { PrestigeMotorsSprite, BankSprite } from './VenueSprites';

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
          className="w-full relative overflow-hidden hover:brightness-125 transition-all cursor-pointer border-b border-gray-800"
        >
          <PrestigeMotorsSprite w={BLOCK_W} h={100} />
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-1.5 bg-gradient-to-t from-black/80 via-black/25 to-transparent">
            <p className="text-[10px] font-bold text-red-400 drop-shadow">Prestige Motors</p>
            <p className="text-[8px] text-gray-300 drop-shadow">Collect cars, flex prestige</p>
            <span className="text-[7px] text-gray-400 drop-shadow">
              {cars.length} car{cars.length !== 1 ? 's' : ''} owned
            </span>
            {totalPrestige > 0 && (
              <span className="text-[7px] text-red-400 drop-shadow">+{totalPrestige} prestige</span>
            )}
            <p className="text-[7px] text-red-500/60 drop-shadow">Tap to shop</p>
          </div>
        </button>
      </Tooltip>

      {/* ── Bank ── */}
      <Tooltip text="Deposit savings for interest. Take out loans for quick cash.">
        <button
          onClick={() => setShowBank(true)}
          className="w-full relative overflow-hidden hover:brightness-125 transition-all cursor-pointer"
        >
          <BankSprite w={BLOCK_W} h={80} />
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-1.5 bg-gradient-to-t from-black/80 via-black/25 to-transparent">
            <p className="text-[10px] font-bold text-emerald-400 drop-shadow">First National Bank</p>
            <span className="text-[7px] text-gray-400 drop-shadow">
              Balance: <span className="text-green-400 font-semibold">{formatMoney(bankBalance)}</span>
            </span>
            {totalOwed > 0 && (
              <span className="text-[7px] text-orange-400 drop-shadow">
                Owed: {formatMoney(totalOwed)} · {bankLoans.length} loan{bankLoans.length !== 1 ? 's' : ''}
              </span>
            )}
            <p className="text-[7px] text-emerald-500/60 drop-shadow">Tap to bank</p>
          </div>
        </button>
      </Tooltip>
    </div>
  );
}
