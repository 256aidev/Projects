import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import Tooltip from '../ui/Tooltip';
import { JewelrySprite } from './VenueSprites';

export default function JewelryBlock() {
  const setShowJewelryStore = useUIStore(s => s.setShowJewelryStore);
  const jewelry = useGameStore(s => s.jewelry);

  const totalPieces = jewelry.length;
  const totalTier = jewelry.reduce((s, j) => s + j.tier, 0);

  return (
    <Tooltip text="Browse jewelry. Buy pieces that appreciate over time.">
    <button
      onClick={() => setShowJewelryStore(true)}
      style={{ borderColor: '#06B6D450' }}
      className="w-full rounded-xl border relative overflow-hidden hover:brightness-125 transition-all cursor-pointer"
    >
      <JewelrySprite w={164} h={180} />
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-3 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
        <p className="text-lg font-bold text-cyan-400 drop-shadow">Ice Box Jewelers</p>
        <p className="text-sm text-gray-300 drop-shadow">Rings, chains, earrings & passive bonuses</p>
        <div className="mt-1 flex flex-col items-center gap-0.5">
          <span className="text-sm text-gray-300 drop-shadow">
            {totalPieces} piece{totalPieces !== 1 ? 's' : ''} owned
          </span>
          {totalPieces > 0 && (
            <span className="text-sm text-cyan-400 font-semibold drop-shadow">
              {totalTier} total upgrades
            </span>
          )}
        </div>
        <p className="text-xs text-cyan-500/60 mt-1 drop-shadow">Tap to browse</p>
      </div>
    </button>
    </Tooltip>
  );
}
