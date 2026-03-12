import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { formatMoney, formatUnits } from '../../engine/economy';
import { sound } from '../../engine/sound';
import CannabisLeaf from '../ui/CannabisLeaf';

export default function HUD() {
  const [sfxOn, setSfxOn] = useState(!sound.sfxMuted);
  const [musicOn, setMusicOn] = useState(!sound.musicMuted);
  const dirtyCash = useGameStore((s) => s.dirtyCash);
  const cleanCash = useGameStore((s) => s.cleanCash);
  const lastTickDirtyProfit = useGameStore((s) => s.lastTickDirtyProfit);
  const lastTickCleanProfit = useGameStore((s) => s.lastTickCleanProfit);
  const bizCount = useGameStore((s) => s.businesses.length);
  const productInventory = useGameStore((s) => s.operation.productInventory);

  const { user, syncing } = useAuthStore();
  const setShowAccountScreen = useUIStore((s) => s.setShowAccountScreen);
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

      {/* Sound controls — SFX and Music independently */}
      <div className="flex items-center gap-0.5 bg-gray-800 rounded-lg px-1.5 py-0.5">
        <button
          onClick={() => { const next = !sfxOn; sound.setSfxMuted(!next); setSfxOn(next); }}
          className={`text-[10px] font-bold px-1 py-0.5 rounded transition ${sfxOn ? 'text-green-400' : 'text-gray-600 line-through'}`}
          title={sfxOn ? 'Mute SFX' : 'Unmute SFX'}
        >
          SFX
        </button>
        <span className="text-gray-700 text-[10px]">|</span>
        <button
          onClick={() => { const next = !musicOn; sound.setMusicMuted(!next); sound.startMusic(); setMusicOn(next); }}
          className={`text-[10px] font-bold px-1 py-0.5 rounded transition ${musicOn ? 'text-purple-400' : 'text-gray-600 line-through'}`}
          title={musicOn ? 'Mute Music' : 'Unmute Music'}
        >
          MUS
        </button>
      </div>

      {/* Account / save indicator */}
      <div className="ml-auto flex items-center gap-2">
        {!isGuest && (
          syncing
            ? <span className="text-blue-500 text-[10px]">☁ saving…</span>
            : <span className="text-green-600 text-[10px]">☁ saved</span>
        )}
        <button
          onClick={() => setShowAccountScreen(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
            isGuest
              ? 'bg-indigo-800 hover:bg-indigo-700 text-indigo-200'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
        >
          <span>{isGuest ? '👤' : '🔓'}</span>
          <span>{isGuest ? 'Sign In' : (user?.displayName?.split(' ')[0] ?? 'Account')}</span>
        </button>
      </div>
    </div>
  );
}
