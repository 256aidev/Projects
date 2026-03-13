import { useGameStore } from '../../store/gameStore';
import { DEALER_TIERS } from '../../data/types';
import { formatMoney } from '../../engine/economy';

const BLOCK_W = 164;

const TIER_VISUALS: Record<string, { emoji: string; bg: string; border: string }> = {
  corner:    { emoji: '🧍', bg: '#6366F120', border: '#6366F1' },
  crew:      { emoji: '👥', bg: '#8B5CF620', border: '#8B5CF6' },
  network:   { emoji: '🕸️', bg: '#A855F720', border: '#A855F7' },
  syndicate: { emoji: '🏛️', bg: '#7C3AED20', border: '#7C3AED' },
  cartel:    { emoji: '👑', bg: '#DC262620', border: '#DC2626' },
};

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

      {/* Current tier badge */}
      <div className="flex items-center justify-center gap-1 mb-1.5">
        <span className="text-[7px] text-indigo-300 font-semibold">{currentTier?.name ?? 'None'}</span>
      </div>

      {/* Dealer tiers grid */}
      <div className="grid grid-cols-2 gap-1">
        {DEALER_TIERS.map((tier, i) => {
          const vis = TIER_VISUALS[tier.id] ?? { emoji: '🤝', bg: '#33333330', border: '#555' };
          const isActive = i === dealerTierIndex && dealerCount > 0;
          const isLocked = i > dealerTierIndex;
          const isPast = i < dealerTierIndex;

          if (isLocked) {
            return (
              <div
                key={tier.id}
                className="w-[72px] h-[72px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-0.5 opacity-30"
                style={{ borderColor: vis.border + '40' }}
              >
                <span className="text-lg">🔒</span>
                <span className="text-[8px] text-gray-400 text-center leading-tight">{tier.name}</span>
              </div>
            );
          }

          return (
            <div
              key={tier.id}
              className={`w-[72px] h-[72px] rounded-lg border-2 flex flex-col items-center justify-center gap-0.5 relative overflow-hidden ${
                isActive ? '' : 'opacity-50'
              }`}
              style={{ backgroundColor: vis.bg, borderColor: vis.border + (isActive ? '80' : '40') }}
            >
              {/* Fill bar based on dealer count */}
              {isActive && (
                <div
                  className="absolute inset-x-1 bottom-0 rounded-t-sm"
                  style={{
                    backgroundColor: vis.border + '40',
                    height: `${Math.min(90, 20 + dealerCount * 8)}%`,
                  }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center">
                <span className="text-lg leading-none">{vis.emoji}</span>
                <span className="text-[8px] font-bold text-white/90 text-center leading-tight">{tier.name}</span>
                {isActive && (
                  <span className="text-[7px] text-indigo-300">{dealerCount} dealers</span>
                )}
                {isPast && (
                  <span className="text-[7px] text-gray-500">outgrown</span>
                )}
              </div>
            </div>
          );
        })}

        {/* Income tile */}
        {dealerCount > 0 && (
          <div
            className="w-[72px] h-[72px] rounded-lg border-2 flex flex-col items-center justify-center gap-0.5"
            style={{ backgroundColor: '#22C55E15', borderColor: '#22C55E50' }}
          >
            <span className="text-lg leading-none">💰</span>
            <span className="text-[8px] font-bold text-white/90 text-center leading-tight">Income</span>
            <span className="text-[7px] text-green-400 font-semibold">
              {lastTickDirtyProfit > 0 ? '+' : ''}{formatMoney(lastTickDirtyProfit)}/s
            </span>
            <span className="text-[7px] text-gray-500">
              {(currentTier?.salesRatePerTick ?? 0) * dealerCount} oz/tick
            </span>
          </div>
        )}
      </div>

      {/* Next tier hint */}
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
