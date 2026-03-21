import { useGameStore } from '../../store/gameStore';
import { DEALER_TIERS } from '../../data/types';
import { formatMoney } from '../../engine/economy';
import { DEALER_SPRITE_MAP, IncomeTileSprite } from './DealerJobSprites';

const BLOCK_W = 164;

export default function DealerNetworkBlock() {
  const dealerCount = useGameStore(s => s.operation?.dealerCount ?? 0);
  const dealerTierIndex = useGameStore(s => s.operation?.dealerTierIndex ?? 0);
  const lastTickDirtyProfit = useGameStore(s => s.lastTickDirtyProfit ?? 0);

  const currentTier = DEALER_TIERS[dealerTierIndex];
  const nextTier = DEALER_TIERS[dealerTierIndex + 1];

  return (
    <div
      style={{ width: BLOCK_W, borderColor: '#6366F150', backgroundColor: '#6366F108' }}
      className="rounded-lg border p-2"
    >
      <p className="text-[9px] font-bold text-center mb-1 text-indigo-400">🤝 Dealer Network</p>
      <div className="flex items-center justify-center gap-1 mb-1.5">
        <span className="text-[7px] text-indigo-300 font-semibold">{currentTier?.name ?? 'None'}</span>
      </div>

      <div className="grid grid-cols-2 gap-1">
        {DEALER_TIERS.map((tier, i) => {
          const isActive = i === dealerTierIndex && dealerCount > 0;
          const isLocked = i > dealerTierIndex;
          const isPast = i < dealerTierIndex;
          const Sprite = DEALER_SPRITE_MAP[tier.id];

          if (isLocked) {
            return (
              <div key={tier.id}
                className="w-[72px] h-[72px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-0.5 opacity-30"
                style={{ borderColor: '#6366F140' }}>
                <span className="text-lg">🔒</span>
                <span className="text-[8px] text-gray-400 text-center leading-tight">{tier.name}</span>
              </div>
            );
          }

          return (
            <div key={tier.id}
              className={`w-[72px] h-[72px] rounded-lg border-2 relative overflow-hidden ${isActive ? '' : 'opacity-50'}`}
              style={{ borderColor: isActive ? '#6366F180' : '#6366F140' }}>
              {Sprite && <Sprite w={72} h={72} />}
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-1 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                <span className="text-[8px] font-bold text-white/90 text-center leading-tight drop-shadow">{tier.name}</span>
                {isActive && (
                  <span className="text-[7px] text-indigo-300 drop-shadow">{dealerCount} dealers</span>
                )}
                {isPast && (
                  <span className="text-[7px] text-gray-500 drop-shadow">outgrown</span>
                )}
              </div>
            </div>
          );
        })}

        {/* Income tile */}
        {dealerCount > 0 && (
          <div className="w-[72px] h-[72px] rounded-lg border-2 relative overflow-hidden"
            style={{ borderColor: '#22C55E50' }}>
            <IncomeTileSprite w={72} h={72} />
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-1 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
              <span className="text-[8px] font-bold text-white/90 drop-shadow">Income</span>
              <span className="text-[7px] text-green-400 font-semibold drop-shadow">
                {lastTickDirtyProfit > 0 ? '+' : ''}{formatMoney(lastTickDirtyProfit)}/s
              </span>
              <span className="text-[7px] text-gray-400 drop-shadow">
                {(currentTier?.salesRatePerTick ?? 0) * dealerCount} oz/tick
              </span>
            </div>
          </div>
        )}
      </div>

      {nextTier && dealerCount > 0 && (
        <div className="mt-1.5 text-center">
          <span className="text-[7px] text-gray-500">Next: {nextTier.name}</span>
        </div>
      )}
      {dealerCount === 0 && (
        <div className="mt-1 text-center">
          <span className="text-[7px] text-gray-500">Hire dealers from Operations</span>
        </div>
      )}
    </div>
  );
}
