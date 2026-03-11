import { useGameStore } from '../../store/gameStore';
import { useAuthStore } from '../../store/authStore';
import { formatMoney, formatUnits } from '../../engine/economy';
import CannabisLeaf from '../ui/CannabisLeaf';

export default function HUD() {
  const dirtyCash = useGameStore((s) => s.dirtyCash);
  const cleanCash = useGameStore((s) => s.cleanCash);
  const lastTickDirtyProfit = useGameStore((s) => s.lastTickDirtyProfit);
  const lastTickCleanProfit = useGameStore((s) => s.lastTickCleanProfit);
  const bizCount = useGameStore((s) => s.businesses.length);
  const productInventory = useGameStore((s) => s.operation.productInventory);

  const { user, syncing, signOut } = useAuthStore();
  const isGuest = !user || (user as { uid: string }).uid === 'guest';

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
        <CannabisLeaf size={18} />
        <span className="text-green-400 font-semibold text-xs">{formatUnits(productInventory)}</span>
      </div>

      <div className="flex items-center gap-1">
        <span>🏢</span>
        <span className="text-white font-semibold">{bizCount}</span>
        <span className="text-gray-500 text-xs">fronts</span>
      </div>

      {/* Cloud save / auth indicator */}
      <div className="ml-auto flex items-center gap-2">
        {isGuest ? (
          <span className="text-gray-600 text-[10px]">local save</span>
        ) : syncing ? (
          <span className="text-blue-500 text-[10px]">☁ saving…</span>
        ) : (
          <span className="text-green-600 text-[10px]">☁ saved</span>
        )}
        <button
          onClick={isGuest ? undefined : signOut}
          title={isGuest ? 'Playing as guest' : `Signed in as ${user?.displayName ?? user?.email}`}
          className="text-gray-600 text-[10px] hover:text-gray-400 transition"
        >
          {isGuest ? '👤' : '🔓'}
        </button>
      </div>
    </div>
  );
}
