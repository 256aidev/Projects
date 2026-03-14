import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';

export default function StartGameScreen() {
  const gameSettings = useGameStore((s) => s.gameSettings);
  const startNewGame = useGameStore((s) => s.startNewGame);
  const continueGame = useGameStore((s) => s.continueGame);
  const tickCount = useGameStore((s) => s.tickCount);

  const [rivalCount, setRivalCount] = useState(gameSettings.rivalCount);
  const [entryDelay, setEntryDelay] = useState(gameSettings.rivalEntryDelay ?? 2);
  const hasExistingGame = tickCount > 0 && gameSettings.gameStarted;

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
          <p className="text-white font-bold text-sm mb-1">Rival Entry Delay</p>
          <p className="text-gray-500 text-[10px] mb-3">
            Minutes between each rival entering the game (Royal Rumble style). 5-min warmup, then one rival every {entryDelay} min{entryDelay !== 1 ? 's' : ''}.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={entryDelay}
              onChange={(e) => setEntryDelay(Number(e.target.value))}
              className="flex-1 accent-amber-500"
            />
            <span className="text-amber-400 font-black text-2xl w-8 text-center">{entryDelay}</span>
          </div>
          <div className="flex justify-between text-[9px] text-gray-600 mt-1 px-0.5">
            <span>Fast</span>
            <span>Slow</span>
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={() => startNewGame(rivalCount, entryDelay)}
          className="w-full py-3.5 rounded-xl text-lg font-black bg-red-600 hover:bg-red-500 text-white transition shadow-lg shadow-red-900/30 mb-3"
        >
          {hasExistingGame ? 'New Game' : 'Start Game'}
        </button>

        {/* Continue button (if existing save) */}
        {hasExistingGame && (
          <button
            onClick={continueGame}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
          >
            Continue
          </button>
        )}

        {hasExistingGame && (
          <p className="text-gray-700 text-[9px] text-center mt-3">
            Starting a new game will reset all progress.
          </p>
        )}
      </div>
    </div>
  );
}
