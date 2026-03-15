import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { formatMoney, formatUnits } from '../../engine/economy';
import { getHeatTier, getRivalHeatTier, HEAT_MAX } from '../../engine/heat';
import { HEAT_TIER_NAMES, HEAT_TIER_COLORS, RIVAL_TIER_NAMES, RIVAL_TIER_COLORS, PRESTIGE_THRESHOLD } from '../../data/types';
import { sound } from '../../engine/sound';
import CannabisLeaf from '../ui/CannabisLeaf';
import Tooltip from '../ui/Tooltip';
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
  const prestigeCount = useGameStore((s) => s.prestigeCount ?? 0);
  const totalDirtyEarned = useGameStore((s) => s.totalDirtyEarned);

  const { user, syncing } = useAuthStore();
  const setShowAccountScreen = useUIStore((s) => s.setShowAccountScreen);
  const setShowTechMenu = useUIStore((s) => s.setShowTechMenu);
  const setShowPrestigeConfirm = useUIStore((s) => s.setShowPrestigeConfirm);
  const setPanel = useUIStore((s) => s.setPanel);
  const activePanel = useUIStore((s) => s.activePanel);
  const gameSpeed = useUIStore((s) => s.gameSpeed);
  const setGameSpeed = useUIStore((s) => s.setGameSpeed);
  const isGuest = !user || (user as { uid: string }).uid === 'guest';

  return (
    <div className="flex items-center gap-4 bg-gray-900/98 border-b border-gray-700/80 px-6 py-4 text-base select-none flex-wrap">
      {/* Dirty Cash */}
      <Tooltip text="Cash from illegal sales. Buy seeds, dealers, and fund operations.">
        <div className="flex items-center gap-2">
          <span className="text-3xl">💵</span>
          <div>
            <p className="text-white font-bold text-xl leading-none">{formatMoney(dirtyCash)}</p>
            <p className={`text-sm leading-none ${lastTickDirtyProfit > 0 ? 'text-green-500' : 'text-gray-500'}`}>
              {lastTickDirtyProfit > 0 ? `+${formatMoney(lastTickDirtyProfit)}/s` : 'dirty'}
            </p>
          </div>
        </div>
      </Tooltip>

      <div className="text-gray-600 text-sm px-1">→ LAUNDER →</div>

      {/* Clean Cash */}
      <Tooltip text="Laundered money. Buy businesses, lots, cars, and legal help.">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🏦</span>
          <div>
            <p className="text-white font-bold text-xl leading-none">{formatMoney(cleanCash)}</p>
            <p className={`text-sm leading-none ${lastTickCleanProfit > 0 ? 'text-blue-400' : 'text-gray-500'}`}>
              {lastTickCleanProfit > 0 ? `+${formatMoney(lastTickCleanProfit)}/s` : 'clean'}
            </p>
          </div>
        </div>
      </Tooltip>

      <div className="h-8 w-px bg-gray-700 mx-1" />

      <Tooltip text="View your product stash breakdown by strain.">
        <button
          onClick={() => setPanel(activePanel === 'warehouse' ? null : 'warehouse')}
          className="flex items-center gap-1.5 hover:opacity-80 transition"
        >
          <CannabisLeaf size={26} />
          <span className="text-green-400 font-semibold text-sm">{formatUnits(Object.values(productInventory).reduce((s, e) => s + e.oz, 0))}</span>
        </button>
      </Tooltip>

      <Tooltip text="Number of front businesses laundering your dirty cash.">
        <div className="flex items-center gap-1.5">
          <span className="text-xl">🏢</span>
          <span className="text-white font-semibold text-base">{bizCount}</span>
          <span className="text-gray-500 text-sm">fronts</span>
        </div>
      </Tooltip>

      {/* Tech Lab button */}
      <Tooltip text="Spend Tech Points on permanent upgrades that survive prestige.">
        <button
          onClick={() => setShowTechMenu(true)}
          className="flex items-center gap-1 hover:opacity-80 transition relative"
        >
          <span className="text-xl">🔬</span>
          {techPoints > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-cyan-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {techPoints > 9 ? '9+' : techPoints}
            </span>
          )}
        </button>
      </Tooltip>

      {/* Prestige button */}
      <Tooltip text="Reset your empire to earn Tech Points for permanent upgrades.">
        <button
          onClick={() => setShowPrestigeConfirm(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition ${
            totalDirtyEarned >= PRESTIGE_THRESHOLD
              ? 'bg-cyan-700 hover:bg-cyan-600 text-white animate-pulse'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
          }`}
        >
          <span className="text-lg">🔄</span>
          {prestigeCount > 0 && <span className="text-yellow-400">{'⭐'.repeat(Math.min(prestigeCount, 5))}{prestigeCount > 5 ? `×${prestigeCount}` : ''}</span>}
          {totalDirtyEarned >= PRESTIGE_THRESHOLD && <span>Ready!</span>}
        </button>
      </Tooltip>

      <div className="h-8 w-px bg-gray-700 mx-1" />

      {/* Police heat */}
      <Tooltip text="Police attention level. High heat means raids and fines.">
        <div className="flex items-center gap-1.5">
          <span className="text-base">🚔</span>
          <div className="w-20 h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(heat / HEAT_MAX) * 100}%`, backgroundColor: tierColor }}
            />
          </div>
          <span className="text-sm font-mono" style={{ color: tierColor }}>{Math.floor(heat)}</span>
        </div>
      </Tooltip>

      {/* Rival heat */}
      <Tooltip text="How aggressive rival gangs are. High heat means attacks on your businesses.">
        <div className="flex items-center gap-1.5">
          <span className="text-base">🔫</span>
          <div className="w-20 h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(rivalHeat / HEAT_MAX) * 100}%`, backgroundColor: rivalColor }}
            />
          </div>
          <span className="text-sm font-mono" style={{ color: rivalColor }}>{Math.floor(rivalHeat)}</span>
        </div>
      </Tooltip>

      {/* Speed controls */}
      <div className="flex items-center gap-1 bg-gray-800 rounded-lg px-2 py-1">
        {([0, 1, 2, 4, 8] as GameSpeed[]).map((speed) => {
          const label = speed === 0 ? '⏸' : speed === 1 ? '▶' : `${speed}x`;
          const isActive = gameSpeed === speed;
          const tip = speed === 0 ? 'Pause the game.' : speed === 1 ? 'Normal speed.' : 'Speed up game. Events scale with speed.';
          return (
            <Tooltip key={speed} text={tip}>
              <button
                onClick={() => setGameSpeed(speed)}
                className={`text-sm font-bold px-2 py-1 rounded transition ${
                  isActive
                    ? speed === 0 ? 'bg-red-700 text-white' : 'bg-green-700 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {label}
              </button>
            </Tooltip>
          );
        })}
      </div>

      {/* Sound controls */}
      <div className="flex items-center gap-1 bg-gray-800 rounded-lg px-2 py-1">
        <Tooltip text="Toggle sound effects.">
          <button
            onClick={() => { const next = !sfxOn; sound.setSfxMuted(!next); setSfxOn(next); }}
            className={`text-sm font-bold px-1.5 py-0.5 rounded transition ${sfxOn ? 'text-green-400' : 'text-gray-600 line-through'}`}
          >
            SFX
          </button>
        </Tooltip>
        <span className="text-gray-700 text-sm">|</span>
        <Tooltip text="Toggle background music.">
          <button
            onClick={() => { const next = !musicOn; sound.setMusicMuted(!next); sound.startMusic(); setMusicOn(next); }}
            className={`text-sm font-bold px-1.5 py-0.5 rounded transition ${musicOn ? 'text-purple-400' : 'text-gray-600 line-through'}`}
          >
            MUS
          </button>
        </Tooltip>
      </div>

      {/* Account / save indicator */}
      <div className="ml-auto flex items-center gap-3">
        {!isGuest && (
          syncing
            ? <Tooltip text="Your game is being saved to the cloud."><span className="text-blue-500 text-sm">☁ saving…</span></Tooltip>
            : <Tooltip text="Your game is saved to the cloud."><span className="text-green-600 text-sm">☁ saved</span></Tooltip>
        )}
        <Tooltip text="Account settings, stats, and game options.">
          <button
            onClick={() => setShowAccountScreen(true)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
              isGuest
                ? 'bg-indigo-800 hover:bg-indigo-700 text-indigo-200'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            <span>{isGuest ? '👤' : '🔓'}</span>
            <span>{isGuest ? 'Sign In' : (user?.displayName?.split(' ')[0] ?? 'Account')}</span>
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
