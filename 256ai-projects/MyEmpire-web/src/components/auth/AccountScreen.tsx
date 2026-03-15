import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../engine/economy';
import { sound } from '../../engine/sound';
import { PRESTIGE_THRESHOLD } from '../../data/types';
import { INITIAL_TECH_UPGRADES } from '../../data/techDefs';
import { getTechBonuses } from '../../engine/tech';
import Tooltip from '../ui/Tooltip';

export default function AccountScreen() {
  const { user, signOut, signInWithGoogle } = useAuthStore();
  const setShowAccountScreen = useUIStore((s) => s.setShowAccountScreen);
  const addNotification = useUIStore((s) => s.addNotification);
  const {
    dirtyCash, cleanCash, totalDirtyEarned, totalCleanEarned,
    tickCount, businesses, prestigeCount, techPoints, techUpgrades,
    resetGame,
  } = useGameStore();
  const setShowPrestigeConfirm = useUIStore((s) => s.setShowPrestigeConfirm);
  const setShowTechMenu = useUIStore((s) => s.setShowTechMenu);

  const isGuest = !user || (user as { uid: string }).uid === 'guest';
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const wipeGame = useGameStore((s) => s.wipeGame);
  const [sfxVol, setSfxVol] = useState(sound.sfxVolume);
  const [musicVol, setMusicVol] = useState(sound.musicVolume);
  const [sfxOn, setSfxOn] = useState(!sound.sfxMuted);
  const [musicOn, setMusicOn] = useState(!sound.musicMuted);

  const canPrestige = totalDirtyEarned >= PRESTIGE_THRESHOLD;
  const progressPct = Math.min(100, (totalDirtyEarned / PRESTIGE_THRESHOLD) * 100);
  const tech = getTechBonuses(techUpgrades ?? INITIAL_TECH_UPGRADES);

  const handleSignOut = async () => { await signOut(); setShowAccountScreen(false); };
  const handleSignIn = async () => { await signInWithGoogle(); setShowAccountScreen(false); };

  const handlePrestige = () => {
    setShowAccountScreen(false);
    setShowPrestigeConfirm(true);
  };

  const handleReset = () => {
    resetGame();
    setConfirmReset(false);
    addNotification('Game reset. Back to the beginning.', 'warning');
    setShowAccountScreen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 border-t border-gray-700 rounded-t-2xl p-6 pb-10 space-y-5 overflow-y-auto max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Account</h2>
          <button onClick={() => setShowAccountScreen(false)} className="text-gray-500 hover:text-gray-300 text-2xl leading-none transition">×</button>
        </div>

        {/* User info */}
        <div className="bg-gray-800 rounded-xl p-4 flex items-center gap-4">
          {user?.photoURL && !isGuest ? (
            <img src={user.photoURL} alt="avatar" className="w-12 h-12 rounded-full" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-2xl">👤</div>
          )}
          <div>
            <p className="text-white font-semibold">{isGuest ? 'Guest Player' : (user?.displayName ?? 'Player')}</p>
            <p className="text-gray-400 text-xs">{isGuest ? 'Local save only' : (user?.email ?? '')}</p>
          </div>
        </div>

        {/* Prestige & Tech */}
        <div className="bg-gray-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-xs uppercase tracking-widest">Prestige & Tech</p>
            <div className="flex items-center gap-2">
              {prestigeCount > 0 && (
                <span className="text-yellow-400 text-sm font-bold">
                  {'⭐'.repeat(Math.min(prestigeCount, 5))}{prestigeCount > 5 ? ` x${prestigeCount}` : ''}
                </span>
              )}
              <span className="text-cyan-400 text-sm font-bold">{techPoints ?? 0} TP</span>
            </div>
          </div>

          {/* Active tech bonuses summary */}
          {tech.yieldBonus > 0 || tech.speedBonus > 0 || tech.doubleChance > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tech.yieldBonus > 0 && <span className="text-[10px] bg-cyan-900/40 text-cyan-300 px-2 py-0.5 rounded-full">+{Math.round(tech.yieldBonus * 100)}% yield</span>}
              {tech.speedBonus > 0 && <span className="text-[10px] bg-cyan-900/40 text-cyan-300 px-2 py-0.5 rounded-full">-{Math.round(tech.speedBonus * 100)}% grow time</span>}
              {tech.doubleChance > 0 && <span className="text-[10px] bg-cyan-900/40 text-cyan-300 px-2 py-0.5 rounded-full">+{Math.round(tech.doubleChance * 100)}% double</span>}
              {tech.capacityBonus > 0 && <span className="text-[10px] bg-cyan-900/40 text-cyan-300 px-2 py-0.5 rounded-full">+{tech.capacityBonus} plants</span>}
              {tech.dealerMultiplier > 1 && <span className="text-[10px] bg-cyan-900/40 text-cyan-300 px-2 py-0.5 rounded-full">+{Math.round((tech.dealerMultiplier - 1) * 100)}% dealers</span>}
              {tech.launderMultiplier > 1 && <span className="text-[10px] bg-cyan-900/40 text-cyan-300 px-2 py-0.5 rounded-full">+{Math.round((tech.launderMultiplier - 1) * 100)}% launder</span>}
              {tech.heatReduction > 0 && <span className="text-[10px] bg-cyan-900/40 text-cyan-300 px-2 py-0.5 rounded-full">-{Math.round(tech.heatReduction * 100)}% heat</span>}
            </div>
          ) : null}

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
              <span>{formatMoney(totalDirtyEarned)} earned</span>
              <span>Goal: {formatMoney(PRESTIGE_THRESHOLD)}</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${canPrestige ? 'bg-cyan-400' : 'bg-green-600'}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Tooltip text="Spend Tech Points on permanent upgrades that survive prestige.">
            <button
              onClick={() => { setShowAccountScreen(false); setShowTechMenu(true); }}
              className="flex-1 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-cyan-400 font-bold text-sm transition"
            >
              🔬 Tech Lab
            </button>
            </Tooltip>
            {canPrestige ? (
              <Tooltip text="Reset all progress and earn Tech Points for permanent upgrades.">
              <button
                onClick={handlePrestige}
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm transition"
              >
                🔄 Prestige
              </button>
              </Tooltip>
            ) : (
              <div className="flex-1 py-2.5 rounded-xl bg-gray-700 text-gray-500 font-bold text-sm text-center">
                🔄 {formatMoney(PRESTIGE_THRESHOLD)} to prestige
              </div>
            )}
          </div>
        </div>

        {/* Game stats */}
        <div className="bg-gray-800 rounded-xl p-4 space-y-2">
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">Game Stats</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-gray-500 text-[10px]">Dirty Cash</p>
              <p className="text-green-400 font-bold">{formatMoney(dirtyCash)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px]">Clean Cash</p>
              <p className="text-blue-400 font-bold">{formatMoney(cleanCash)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px]">Total Dirty Earned</p>
              <p className="text-white font-semibold text-sm">{formatMoney(totalDirtyEarned)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px]">Total Clean Earned</p>
              <p className="text-white font-semibold text-sm">{formatMoney(totalCleanEarned)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px]">Front Businesses</p>
              <p className="text-white font-semibold text-sm">{businesses.length}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px]">Time Played</p>
              <p className="text-white font-semibold text-sm">{Math.floor(tickCount / 60)}m {tickCount % 60}s</p>
            </div>
          </div>
        </div>

        {/* Sound Controls */}
        <div className="bg-gray-800 rounded-xl p-4 space-y-3">
          <p className="text-gray-400 text-xs uppercase tracking-widest">Sound</p>

          {/* SFX */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { const next = !sfxOn; sound.setSfxMuted(!next); setSfxOn(next); }}
              className={`text-sm font-semibold w-8 text-center transition ${sfxOn ? 'text-white' : 'text-gray-600'}`}
            >
              {sfxOn ? '🔔' : '🔕'}
            </button>
            <div className="flex-1">
              <p className="text-gray-400 text-[10px] mb-1">SFX</p>
              <input
                type="range" min="0" max="1" step="0.05"
                value={sfxVol}
                disabled={!sfxOn}
                onChange={(e) => { const v = parseFloat(e.target.value); sound.setSfxVolume(v); setSfxVol(v); }}
                className="w-full accent-green-500 disabled:opacity-30"
              />
            </div>
            <span className="text-gray-500 text-xs w-8 text-right">{Math.round(sfxVol * 100)}%</span>
          </div>

          {/* Music */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { const next = !musicOn; sound.setMusicMuted(!next); setMusicOn(next); }}
              className={`text-sm font-semibold w-8 text-center transition ${musicOn ? 'text-white' : 'text-gray-600'}`}
            >
              {musicOn ? '🎵' : '🔇'}
            </button>
            <div className="flex-1">
              <p className="text-gray-400 text-[10px] mb-1">Music</p>
              <input
                type="range" min="0" max="1" step="0.05"
                value={musicVol}
                onChange={(e) => { const v = parseFloat(e.target.value); sound.setMusicVolume(v); setMusicVol(v); }}
                className="w-full accent-purple-500"
              />
            </div>
            <span className="text-gray-500 text-xs w-8 text-right">{Math.round(musicVol * 100)}%</span>
          </div>
        </div>

        {/* Reset */}
        <div className="space-y-2">
          {confirmReset ? (
            <div className="bg-red-950 border border-red-800 rounded-xl p-4 space-y-3">
              <p className="text-red-300 text-sm font-semibold text-center">Are you sure? This wipes everything except your prestige bonuses.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmReset(false)} className="flex-1 py-2 rounded-lg bg-gray-700 text-gray-300 text-sm font-semibold">Cancel</button>
                <button onClick={handleReset} className="flex-1 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-semibold">Confirm Reset</button>
              </div>
            </div>
          ) : (
            <Tooltip text="Start over but keep prestige bonuses and tech upgrades.">
            <button
              onClick={() => setConfirmReset(true)}
              className="w-full py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-red-400 font-semibold text-sm transition"
            >
              Reset Game
            </button>
            </Tooltip>
          )}

          {confirmWipe ? (
            <div className="bg-red-950 border-2 border-red-600 rounded-xl p-4 space-y-3">
              <p className="text-red-400 text-sm font-bold text-center">⚠️ DELETE ALL DATA ⚠️</p>
              <p className="text-red-300/80 text-xs text-center leading-relaxed">
                This will permanently erase <span className="font-bold text-white">everything</span> — all cash, businesses, prestige levels, tech upgrades, and progress. You will start completely fresh as if you never played.
              </p>
              <p className="text-red-500 text-[10px] text-center font-semibold">This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmWipe(false)} className="flex-1 py-2 rounded-lg bg-gray-700 text-gray-300 text-sm font-semibold">Cancel</button>
                <button
                  onClick={() => {
                    wipeGame();
                    setConfirmWipe(false);
                    addNotification('All data wiped. Starting fresh.', 'error');
                    setShowAccountScreen(false);
                  }}
                  className="flex-1 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-bold transition"
                >
                  Yes, Wipe Everything
                </button>
              </div>
            </div>
          ) : (
            <Tooltip text="Permanently erase everything including prestige. Cannot be undone.">
            <button
              onClick={() => setConfirmWipe(true)}
              className="w-full py-2 rounded-xl bg-gray-800 hover:bg-red-950 text-gray-500 hover:text-red-400 font-semibold text-sm transition border border-transparent hover:border-red-800"
            >
              Exit Game (Wipe All Data)
            </button>
            </Tooltip>
          )}

          {isGuest ? (
            <button
              onClick={handleSignIn}
              className="w-full py-3 rounded-xl bg-white text-gray-900 font-semibold text-sm flex items-center justify-center gap-3 hover:bg-gray-100 transition"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20c11 0 19.7-7.9 19.7-20 0-1.3-.2-2.7-.2-3z" fill="#FFC107"/>
                <path d="M6.3 14.7l7 5.1C15.1 16.1 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.6 0-14.2 4.2-17.7 10.7z" fill="#FF3D00"/>
                <path d="M24 44c5.6 0 10.5-1.9 14.4-5l-6.6-5.6C29.8 34.9 27 36 24 36c-6.1 0-11.3-4.1-13.1-9.7L4 31.4C7.5 39.2 15.1 44 24 44z" fill="#4CAF50"/>
                <path d="M44.5 20H24v8.5h11.8c-.8 2.4-2.3 4.5-4.3 6l6.6 5.6C42.1 36.3 44.5 30 44.5 23c0-1.3-.2-2.7-.2-3z" fill="#1976D2"/>
              </svg>
              Sign in with Google to save progress
            </button>
          ) : (
            <button onClick={handleSignOut} className="w-full py-3 rounded-xl bg-red-900/50 hover:bg-red-800/60 text-red-300 font-semibold text-sm transition">
              Sign Out
            </button>
          )}
        </div>

      </div>
    </div>
  );

}
