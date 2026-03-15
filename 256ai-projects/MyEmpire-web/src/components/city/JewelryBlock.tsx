import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import Tooltip from '../ui/Tooltip';

export default function JewelryBlock() {
  const setShowJewelryStore = useUIStore(s => s.setShowJewelryStore);
  const jewelry = useGameStore(s => s.jewelry);

  const totalPieces = jewelry.length;
  const totalTier = jewelry.reduce((s, j) => s + j.tier, 0);

  return (
    <Tooltip text="Browse jewelry. Buy pieces that appreciate over time.">
    <button
      onClick={() => setShowJewelryStore(true)}
      style={{ borderColor: '#06B6D450', backgroundColor: '#06B6D412' }}
      className="w-full rounded-xl border p-5 flex flex-col items-center justify-center gap-2 hover:brightness-125 transition-all cursor-pointer"
    >
      <span className="text-6xl">💎</span>
      <p className="text-lg font-bold text-cyan-400">Ice Box Jewelers</p>
      <p className="text-sm text-gray-400">Rings, chains, earrings & passive bonuses</p>

      <div className="mt-2 flex flex-col items-center gap-1">
        <span className="text-sm text-gray-300">
          {totalPieces} piece{totalPieces !== 1 ? 's' : ''} owned
        </span>
        {totalPieces > 0 && (
          <span className="text-sm text-cyan-400 font-semibold">
            {totalTier} total upgrades
          </span>
        )}
      </div>

      <div className="mt-2 flex gap-3 text-2xl">
        <span>💍</span>
        <span>📿</span>
        <span>💠</span>
        <span>⛓️</span>
      </div>
      <p className="text-xs text-cyan-500/60 mt-1">Tap to browse</p>
    </button>
    </Tooltip>
  );
}
