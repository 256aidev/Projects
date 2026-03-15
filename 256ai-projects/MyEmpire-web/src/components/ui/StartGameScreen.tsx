import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { getDifficultyMultiplier } from '../../engine/difficulty';
import Tooltip from './Tooltip';

export default function StartGameScreen() {
  const gameSettings = useGameStore((s) => s.gameSettings);
  const startNewGame = useGameStore((s) => s.startNewGame);
  const startTutorial = useGameStore((s) => s.startTutorial);
  const continueGame = useGameStore((s) => s.continueGame);
  const tickCount = useGameStore((s) => s.tickCount);

  const [rivalCount, setRivalCount] = useState(gameSettings.rivalCount);
  const [entryDelay, setEntryDelay] = useState(gameSettings.rivalEntryDelay ?? 10);
  const hasExistingGame = tickCount > 0 && gameSettings.gameStarted;

  // Difficulty multiplier calculation (same formula as leaderboard scoring)
  const diffMultiplier = getDifficultyMultiplier(rivalCount, entryDelay);

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gray-950 p-6">
      <div className="w-full max-w-sm">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white tracking-tight mb-1">MY EMPIRE</h1>
          <p className="text-gray-500 text-sm">Kingpin</p>
        </div>

        {/* Rival slider */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
          <p className="text-white font-bold text-sm mb-1">Rival Syndicates</p>
          <p className="text-gray-500 text-[10px] mb-3">
            How many rival gangs will fight for control of the city?
          </p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={rivalCount}
              onChange={(e) => setRivalCount(Number(e.target.value))}
              className="flex-1 accent-red-500"
            />
            <span className="text-red-400 font-black text-2xl w-8 text-center">{rivalCount}</span>
          </div>
          <div className="flex justify-between text-[9px] text-gray-600 mt-1 px-0.5">
            <span>Easy</span>
            <span>Warzone</span>
          </div>
        </div>

        {/* Entry delay slider */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
          <p className="text-white font-bold text-sm mb-1">Rival Start Time</p>
          <p className="text-gray-500 text-[10px] mb-3">
            {entryDelay === 0
              ? 'Rivals start immediately — no warmup!'
              : `First rival enters after ${entryDelay} min, then one every ${Math.max(1, Math.floor(entryDelay / rivalCount))} min.`}
          </p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={60}
              step={10}
              value={entryDelay}
              onChange={(e) => setEntryDelay(Number(e.target.value))}
              className="flex-1 accent-amber-500"
            />
            <span className="text-amber-400 font-black text-2xl w-12 text-center">{entryDelay}m</span>
          </div>
          <div className="flex justify-between text-[9px] text-gray-600 mt-1 px-0.5">
            <span>Instant</span>
            <span>60 min</span>
          </div>
        </div>

        {/* Difficulty multiplier display */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 mb-6 text-center">
          <p className="text-gray-500 text-[9px] uppercase tracking-widest mb-1">Score Multiplier</p>
          <p className={`font-black text-2xl ${diffMultiplier >= 2 ? 'text-red-400' : diffMultiplier >= 1.5 ? 'text-orange-400' : diffMultiplier > 1 ? 'text-yellow-400' : 'text-gray-400'}`}>
            ×{diffMultiplier.toFixed(1)}
          </p>
          <p className="text-gray-600 text-[9px] mt-1">
            {diffMultiplier >= 2 ? 'Insane — max score boost!' : diffMultiplier >= 1.5 ? 'Hard — big score boost' : diffMultiplier > 1 ? 'Moderate difficulty' : 'Easy — base score'}
          </p>
        </div>

        {/* Start button */}
        <Tooltip text={hasExistingGame ? "Start a fresh game. Resets all progress." : "Begin your criminal empire with the settings above."}>
        <button
          onClick={() => startNewGame(rivalCount, entryDelay)}
          className="w-full py-3.5 rounded-xl text-lg font-black bg-red-600 hover:bg-red-500 text-white transition shadow-lg shadow-red-900/30 mb-3"
        >
          {hasExistingGame ? 'New Game' : 'Start Game'}
        </button>
        </Tooltip>

        {/* Continue button (if existing save) */}
        {hasExistingGame && (
          <Tooltip text="Resume your existing game where you left off.">
          <button
            onClick={continueGame}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
          >
            Continue
          </button>
          </Tooltip>
        )}

        {hasExistingGame && (
          <p className="text-gray-700 text-[9px] text-center mt-3">
            Starting a new game will reset all progress.
          </p>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-gray-600 text-[10px]">or</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        {/* Tutorial */}
        <Tooltip text="Step-by-step walkthrough of all game mechanics. No rivals.">
        <button
          onClick={startTutorial}
          className="w-full py-3.5 rounded-xl text-lg font-black bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-900/30"
        >
          Tutorial
        </button>
        </Tooltip>
        <p className="text-gray-600 text-[9px] text-center mt-2">
          Learn the basics — guided walkthrough, no rivals.
        </p>
      </div>
    </div>
  );
}
