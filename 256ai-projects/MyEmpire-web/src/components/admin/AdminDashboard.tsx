import { useEffect, useState, useMemo } from 'react';
import { useTuningStore } from '../../store/tuningStore';
import { TUNING_SLIDERS, DEFAULT_TUNING, type GameTuning } from '../../data/tuning';
import { formatMoney } from '../../engine/economy';

function formatValue(value: number, format?: string): string {
  if (format === 'money') return formatMoney(value);
  if (format === 'percent') return `${(value * 100).toFixed(1)}%`;
  if (format === 'int') return Math.round(value).toString();
  return value.toFixed(4).replace(/\.?0+$/, '');
}

export default function AdminDashboard() {
  const tuning = useTuningStore(s => s.tuning);
  const loaded = useTuningStore(s => s.loaded);
  const saving = useTuningStore(s => s.saving);
  const setTuning = useTuningStore(s => s.set);
  const resetAll = useTuningStore(s => s.resetAll);
  const subscribe = useTuningStore(s => s.subscribe);

  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsub = subscribe();
    return unsub;
  }, [subscribe]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof TUNING_SLIDERS>();
    for (const s of TUNING_SLIDERS) {
      if (search && !s.label.toLowerCase().includes(search.toLowerCase()) && !s.group.toLowerCase().includes(search.toLowerCase())) continue;
      if (!map.has(s.group)) map.set(s.group, []);
      map.get(s.group)!.push(s);
    }
    return map;
  }, [search]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-gray-400">
        Loading tuning config...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-amber-400">Game Tuning Dashboard</h1>
            <p className="text-gray-500 text-sm">Adjust game parameters live. Changes apply to all players in real-time.</p>
          </div>
          <div className="flex items-center gap-3">
            {saving && <span className="text-yellow-400 text-sm animate-pulse">Saving...</span>}
            <button
              onClick={() => { if (confirm('Reset ALL tuning to defaults?')) resetAll(); }}
              className="px-4 py-2 bg-red-900/50 hover:bg-red-900/80 text-red-300 text-sm font-bold rounded-lg transition"
            >
              Reset All
            </button>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search parameters..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full mb-6 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-amber-500 outline-none"
        />

        {/* Slider groups */}
        {[...groups.entries()].map(([group, sliders]) => (
          <div key={group} className="mb-6">
            <h2 className="text-lg font-bold text-amber-400/80 mb-3 border-b border-gray-800 pb-1">{group}</h2>
            <div className="space-y-3">
              {sliders.map(slider => {
                const value = tuning[slider.key];
                const isDefault = value === DEFAULT_TUNING[slider.key];
                return (
                  <div key={slider.key} className="bg-gray-900/80 rounded-lg p-3 border border-gray-800">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-300">{slider.label}</span>
                        {!isDefault && (
                          <button
                            onClick={() => setTuning(slider.key, DEFAULT_TUNING[slider.key])}
                            className="text-[9px] bg-gray-700 hover:bg-gray-600 text-gray-400 px-1.5 py-0.5 rounded transition"
                            title="Reset to default"
                          >
                            reset
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-mono font-bold ${isDefault ? 'text-gray-400' : 'text-amber-400'}`}>
                          {formatValue(value, slider.format)}
                        </span>
                        {!isDefault && (
                          <span className="text-[9px] text-gray-600">
                            (def: {formatValue(DEFAULT_TUNING[slider.key], slider.format)})
                          </span>
                        )}
                      </div>
                    </div>
                    <input
                      type="range"
                      min={slider.min}
                      max={slider.max}
                      step={slider.step}
                      value={value}
                      onChange={e => setTuning(slider.key, Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                    <div className="flex justify-between text-[9px] text-gray-600 mt-0.5">
                      <span>{formatValue(slider.min, slider.format)}</span>
                      <span className="text-gray-700">{slider.key}</span>
                      <span>{formatValue(slider.max, slider.format)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
