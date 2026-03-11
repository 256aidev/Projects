import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../engine/economy';

export default function HUD() {
  const dirtyCash = useGameStore((s) => s.dirtyCash);
  const cleanCash = useGameStore((s) => s.cleanCash);
  const lastTickDirtyProfit = useGameStore((s) => s.lastTickDirtyProfit);
  const lastTickCleanProfit = useGameStore((s) => s.lastTickCleanProfit);
  const bizCount = useGameStore((s) => s.businesses.length);
  const productInventory = useGameStore((s) => s.operation.productInventory);

  return (
    <div className="flex items-center gap-3 bg-gray-900/98 border-b border-gray-700/80 px-4 py-2.5 text-sm select-none flex-wrap">
      {/* Dirty Cash */}
      <div className="flex items-center gap-1.5">
        <span className="text-xl">💵</span>
        <div>
          <p className="text-white font-bold text-base leading-none">{formatMoney(dirtyCash)}</p>
          <p className={`text-[10px] leading-none ${lastTickDirtyProfit > 0 ? 'text-green-500' : 'text-gray-500'}`}>
            {lastTickDirtyProfit > 0 ? `+${formatMoney(lastTickDirtyProfit)}/s` : 'dirty'}
          </p>
        </div>
      </div>

      <div className="text-gray-600 text-xs px-1">→ LAUNDER →</div>

      {/* Clean Cash */}
      <div className="flex items-center gap-1.5">
        <span className="text-xl">🏦</span>
        <div>
          <p className="text-white font-bold text-base leading-none">{formatMoney(cleanCash)}</p>
          <p className={`text-[10px] leading-none ${lastTickCleanProfit > 0 ? 'text-blue-400' : 'text-gray-500'}`}>
            {lastTickCleanProfit > 0 ? `+${formatMoney(lastTickCleanProfit)}/s` : 'clean'}
          </p>
        </div>
      </div>

      <div className="h-6 w-px bg-gray-700 mx-1" />

      <div className="flex items-center gap-1">
        <span>🌿</span>
        <span className="text-green-400 font-semibold">{Math.floor(productInventory)}</span>
        <span className="text-gray-500 text-xs">units</span>
      </div>

      <div className="flex items-center gap-1">
        <span>🏢</span>
        <span className="text-white font-semibold">{bizCount}</span>
        <span className="text-gray-500 text-xs">fronts</span>
      </div>
    </div>
  );
}
