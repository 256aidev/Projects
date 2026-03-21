import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../engine/economy';
import Tooltip from '../ui/Tooltip';
import { CasinoSprite } from './VenueSprites';

const BLOCK_W = 164;

export default function CasinoBlock() {
  const setShowCasino = useUIStore(s => s.setShowCasino);
  const history = useGameStore(s => s.casinoHistory);

  return (
    <Tooltip text="Enter the casino. Bet dirty cash to win clean cash.">
    <button
      onClick={() => setShowCasino(true)}
      style={{ width: BLOCK_W, borderColor: '#EAB30850' }}
      className="rounded-lg border relative overflow-hidden hover:brightness-125 transition-all cursor-pointer"
    >
      <CasinoSprite w={BLOCK_W} h={130} />
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-2 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
        <p className="text-[10px] font-bold text-yellow-400 drop-shadow">Lucky 7 Casino</p>
        <p className="text-[8px] text-gray-300 drop-shadow">Dirty cash in, clean cash out</p>
        <div className="mt-0.5 flex flex-col items-center gap-0">
          <span className="text-[7px] text-gray-400 drop-shadow">{history.gamesPlayed} games played</span>
          <span className="text-[7px] text-emerald-400 drop-shadow">{formatMoney(history.totalWon)} laundered</span>
          <span className="text-[7px] text-red-400 drop-shadow">{formatMoney(history.totalGambled)} wagered</span>
        </div>
        <p className="text-[7px] text-yellow-500/60 mt-0.5 drop-shadow">Tap to enter</p>
      </div>
    </button>
    </Tooltip>
  );
}
