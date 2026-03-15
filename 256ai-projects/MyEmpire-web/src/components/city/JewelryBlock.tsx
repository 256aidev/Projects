import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import Tooltip from '../ui/Tooltip';

const BLOCK_W = 164;

export default function JewelryBlock() {
  const setShowJewelryStore = useUIStore(s => s.setShowJewelryStore);
  const jewelry = useGameStore(s => s.jewelry);

  const totalPieces = jewelry.length;
  const totalTier = jewelry.reduce((s, j) => s + j.tier, 0);

  return (
    <Tooltip text="Browse jewelry. Buy pieces that appreciate over time.">
    <button
      onClick={() => setShowJewelryStore(true)}
      style={{ width: BLOCK_W, borderColor: '#06B6D450', backgroundColor: '#06B6D412' }}
      className="rounded-lg border p-2 flex flex-col items-center justify-center gap-1 hover:brightness-125 transition-all cursor-pointer"
    >
      <span className="text-3xl">💎</span>
      <p className="text-[10px] font-bold text-cyan-400">Ice Box Jewelers</p>
      <p className="text-[8px] text-gray-400">Rings, chains & passive bonuses</p>

      <div className="mt-1 flex flex-col items-center gap-0.5">
        <span className="text-[7px] text-gray-500">
          {totalPieces} piece{totalPieces !== 1 ? 's' : ''} owned
        </span>
        {totalPieces > 0 && (
          <span className="text-[7px] text-cyan-400">
            {totalTier} total upgrades
          </span>
        )}
      </div>

      <div className="mt-1 flex gap-1.5 text-sm">
        <span>💍</span>
        <span>📿</span>
        <span>⌚</span>
      </div>
      <p className="text-[7px] text-cyan-500/60 mt-0.5">Tap to browse</p>
    </button>
    </Tooltip>
  );
}
