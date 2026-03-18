import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../engine/economy';
import Tooltip from '../ui/Tooltip';

const BLOCK_W = 164;

export default function CasinoBlock() {
  const setShowCasino = useUIStore(s => s.setShowCasino);
  const history = useGameStore(s => s.casinoHistory);

  return (
    <Tooltip text="Enter the casino. Bet dirty cash to win clean cash.">
    <button
      onClick={() => setShowCasino(true)}
      style={{ width: BLOCK_W, borderColor: '#EAB30850', backgroundColor: '#EAB30812' }}
      className="rounded-lg border p-2 flex flex-col items-center justify-center gap-1 hover:brightness-125 transition-all cursor-pointer"
    >
      <span className="text-3xl">🎰</span>
      <p className="text-[10px] font-bold text-yellow-400">Lucky 7 Casino</p>
      <p className="text-[8px] text-gray-400">Dirty cash in, clean cash out</p>

      <div className="mt-1 flex flex-col items-center gap-0.5">
        <span className="text-[7px] text-gray-500">
          {history.gamesPlayed} games played
        </span>
        <span className="text-[7px] text-emerald-400">
          {formatMoney(history.totalWon)} laundered
        </span>
        <span className="text-[7px] text-red-400">
          {formatMoney(history.totalGambled)} wagered
        </span>
      </div>

      <div className="mt-1 flex gap-2 text-sm">
        <span>🃏</span>
        <span>🎲</span>
        <span>♠️</span>
      </div>
      <p className="text-[7px] text-yellow-500/60 mt-0.5">Tap to enter</p>
    </button>
    </Tooltip>
  );
}
