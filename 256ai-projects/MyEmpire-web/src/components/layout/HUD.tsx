import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { formatMoney, formatUnits } from '../../engine/economy';
import { getHeatTier, getRivalHeatTier, HEAT_MAX } from '../../engine/heat';
import { HEAT_TIER_NAMES, HEAT_TIER_COLORS, RIVAL_TIER_NAMES, RIVAL_TIER_COLORS } from '../../data/types';
import { sound } from '../../engine/sound';
import CannabisLeaf from '../ui/CannabisLeaf';
import type { GameSpeed } from '../../store/uiStore';

export default function HUD() {
  const [sfxOn, setSfxOn] = useState(!sound.sfxMuted);
  const [musicOn, setMusicOn] = useState(!sound.musicMuted);
  const dirtyCash = useGameStore((s) => s.dirtyCash);
  const cleanCash = useGameStore((s) => s.cleanCash);
  const lastTickDirtyProfit = useGameStore((s) => s.lastTickDirtyProfit);
  const lastTickCleanProfit = useGameStore((s) => s.lastTickCleanProfit);
  const bizCount = useGameStore((s) => s.businesses.length);
  const productInventory = useGameStore((s) => s.operation.productInventory);
  const heat = useGameStore((s) => s.heat);
  const heatTier = getHeatTier(heat);
  const tierColor = HEAT_TIER_COLORS[heatTier];
  const tierName = HEAT_TIER_NAMES[heatTier];
  const rivalHeat = useGameStore((s) => s.rivalHeat ?? 0);
  const rivalTier = getRivalHeatTier(rivalHeat);
  const rivalColor = RIVAL_TIER_COLORS[rivalTier];
  const rivalTierName = RIVAL_TIER_NAMES[rivalTier];

  const techPoints = useGameStore((s) => s.techPoints ?? 0);

  const { user, syncing } = useAuthStore();
  const setShowAccountScreen = useUIStore((s) => s.setShowAccountScreen);
  const setShowTechMenu = useUIStore((s) => s.setShowTechMenu);
  const setPanel = useUIStore((s) => s.setPanel);
  const activePanel = useUIStore((s) => s.activePanel);
  const gameSpeed = useUIStore((s) => s.gameSpeed);
  const setGameSpeed = useUIStore((s) => s.setGameSpeed);
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

      <button
        onClick={() => setPanel(activePanel === 'warehouse' ? null : 'warehouse')}
        className="flex items-center gap-1 hover:opacity-80 transition"
        title="View stash"
      >
        <CannabisLeaf size={18} />
        <span className="text-green-400 font-semibold text-xs">{formatUnits(Object.values(productInventory).reduce((s, e) => s + e.oz, 0))}</span>
      </button>

      <div className="flex items-center gap-1">
        <span>🏢</span>
        <span className="text-white font-semibold">{bizCount}</span>
        <span className="text-gray-500 text-xs">fronts</span>
      </div>

      {/* Tech Lab button */}
      <button
        onClick={() => setShowTechMenu(true)}
        className="flex items-center gap-1 hover:opacity-80 transition relative"
        title="Tech Lab"
      >
        <span className="text-base">🔬</span>
        {techPoints > 0 && (
          <span className="absolute -top-1 -right-1.5 bg-cyan-500 text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
            {techPoints > 9 ? '9+' : techPoints}
          </span>
        )}
      </button>

      <div className="h-6 w-px bg-gray-700 mx-1" />

      {/* Police heat */}
      <div className="flex items-center gap-1" title={`Police: ${Math.floor(heat)} — ${tierName}`}>
        <span className="text-xs">🚔</span>
        <div className="w-14 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(heat / HEAT_MAX) * 100}%`, backgroundColor: tierColor }}
          />
        </div>
        <span className="text-[10px] font-mono" style={{ color: tierColor }}>{Math.floor(heat)}</span>
      </div>

      {/* Rival heat */}
      <div className="flex items-center gap-1" title={`Rivals: ${Math.floor(rivalHeat)} — ${rivalTierName}`}>
        <span className="text-xs">🔫</span>
        <div className="w-14 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(rivalHeat / HEAT_MAX) * 100}%`, backgroundColor: rivalColor }}
          />
        </div>
        <span className="text-[10px] font-mono" style={{ color: rivalColor }}>{Math.floor(rivalHeat)}</span>
      </div>

      {/* Speed controls */}
      <div className="flex items-center gap-0.5 bg-gray-800 rounded-lg px-1 py-0.5">
        {([0, 1, 2, 4, 8] as GameSpeed[]).map((speed) => {
          const label = speed === 0 ? '⏸' : speed === 1 ? '▶' : `${speed}x`;
          const isActive = gameSpeed === speed;
          return (
            <button
              key={speed}
              onClick={() => setGameSpeed(speed)}
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition ${
                isActive
                  ? speed === 0 ? 'bg-red-700 text-white' : 'bg-green-700 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              title={speed === 0 ? 'Pause' : `${speed}x speed`}
            >
              {label}
            </button>
          );
        })}
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
