import { useState, useEffect, useCallback } from 'react';
import { MUSIC_TRACKS } from '../../data/musicDefs';
import { sound } from '../../engine/sound';

interface Props {
  onClose: () => void;
}

export default function MusicMenu({ onClose }: Props) {
  const [, forceUpdate] = useState(0);
  const refresh = useCallback(() => forceUpdate(n => n + 1), []);

  // Subscribe to track changes
  useEffect(() => {
    sound.onTrackChange(refresh);
    return () => sound.onTrackChange(null);
  }, [refresh]);

  const playlist = sound.playlist;
  const enabledSet = new Set(playlist.enabledTracks);
  const currentId = sound.currentTrackId;

  // Get ordered tracks
  const orderedTracks = playlist.order
    .map(id => MUSIC_TRACKS.find(t => t.id === id))
    .filter(Boolean) as typeof MUSIC_TRACKS;
  // Add any not in order
  for (const t of MUSIC_TRACKS) {
    if (!orderedTracks.find(o => o.id === t.id)) orderedTracks.push(t);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl p-5 w-[480px] max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg">Music Player</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>

        {/* Now playing */}
        {currentId && (
          <div className="bg-gray-800/80 rounded-lg p-3 mb-4 border border-gray-700">
            <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Now Playing</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 font-bold text-sm">
                  {MUSIC_TRACKS.find(t => t.id === currentId)?.name ?? currentId}
                </p>
                <p className="text-gray-500 text-xs">
                  {MUSIC_TRACKS.find(t => t.id === currentId)?.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { sound.nextTrack(); refresh(); }}
                  className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold transition"
                >
                  Skip ⏭
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => { sound.toggleShuffle(); refresh(); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              playlist.shuffle
                ? 'bg-purple-700 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {playlist.shuffle ? '🔀 Shuffle ON' : '🔀 Shuffle'}
          </button>
          <span className="text-gray-600 text-xs">Auto-switches every 10 min</span>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-gray-400 text-xs">Volume</span>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(sound.musicVolume * 100)}
            onChange={e => { sound.setMusicVolume(parseInt(e.target.value) / 100); refresh(); }}
            className="flex-1 accent-green-500"
          />
          <span className="text-white text-xs w-8 text-right">{Math.round(sound.musicVolume * 100)}%</span>
        </div>

        {/* Track list */}
        <div className="space-y-1.5">
          {orderedTracks.map((track, idx) => {
            const isEnabled = enabledSet.has(track.id);
            const isCurrent = currentId === track.id;

            return (
              <div
                key={track.id}
                className={`rounded-lg border p-2.5 flex items-center gap-3 transition ${
                  isCurrent
                    ? 'border-green-500/60 bg-green-900/20'
                    : isEnabled
                    ? 'border-gray-700 bg-gray-800/40 hover:bg-gray-800/60'
                    : 'border-gray-800 bg-gray-900/40 opacity-50'
                }`}
              >
                {/* Play button */}
                <button
                  onClick={() => { sound.playTrack(track.id); refresh(); }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition ${
                    isCurrent
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {isCurrent ? '♫' : '▶'}
                </button>

                {/* Track info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isCurrent ? 'text-green-400' : 'text-white'}`}>
                      {track.name}
                    </span>
                    <span className="text-[10px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">
                      {track.mood}
                    </span>
                    <span className="text-[10px] text-gray-600">{track.bpm} BPM</span>
                  </div>
                  <p className="text-gray-500 text-xs truncate">{track.description}</p>
                </div>

                {/* Enable/disable checkbox */}
                <button
                  onClick={() => { sound.toggleTrack(track.id); refresh(); }}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center text-xs transition ${
                    isEnabled
                      ? 'border-green-500 bg-green-900/40 text-green-400'
                      : 'border-gray-600 text-transparent hover:border-gray-500'
                  }`}
                  title={isEnabled ? 'Remove from playlist' : 'Add to playlist'}
                >
                  ✓
                </button>

                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => { sound.moveTrackUp(track.id); refresh(); }}
                    disabled={idx === 0}
                    className="text-gray-500 hover:text-white text-xs disabled:opacity-20"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => { sound.moveTrackDown(track.id); refresh(); }}
                    disabled={idx === orderedTracks.length - 1}
                    className="text-gray-500 hover:text-white text-xs disabled:opacity-20"
                  >
                    ▼
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
