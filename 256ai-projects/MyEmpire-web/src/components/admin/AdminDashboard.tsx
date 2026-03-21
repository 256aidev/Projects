import { useEffect, useState, useMemo } from 'react';
import { useTuningStore } from '../../store/tuningStore';
import { TUNING_SLIDERS, TUNING_TABS, DEFAULT_TUNING, type GameTuning, type TuningTab } from '../../data/tuning';

function fmt(value: number, format?: string): string {
  if (format === 'money') return `$${value.toLocaleString()}`;
  if (format === 'percent') return `${(value * 100).toFixed(1)}%`;
  if (format === 'int') return Math.round(value).toString();
  if (format === 'ticks') return `${Math.round(value)}t`;
  return value.toFixed(4).replace(/\.?0+$/, '');
}

export default function AdminDashboard() {
  const tuning = useTuningStore(s => s.tuning);
  const saving = useTuningStore(s => s.saving);
  const error = useTuningStore(s => s.error);
  const setTuning = useTuningStore(s => s.set);
  const resetAll = useTuningStore(s => s.resetAll);
  const subscribe = useTuningStore(s => s.subscribe);

  const [activeTab, setActiveTab] = useState<TuningTab>('Rivals');
  const [search, setSearch] = useState('');

  useEffect(() => { const unsub = subscribe(); return unsub; }, [subscribe]);

  const sliders = useMemo(() => {
    return TUNING_SLIDERS.filter(s => {
      if (search) return s.label.toLowerCase().includes(search.toLowerCase()) || s.key.toLowerCase().includes(search.toLowerCase());
      return s.tab === activeTab;
    });
  }, [activeTab, search]);

  const changedCount = useMemo(() => {
    return TUNING_SLIDERS.filter(s => tuning[s.key] !== DEFAULT_TUNING[s.key]).length;
  }, [tuning]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-black text-amber-400">Game Tuning</h1>
          <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
            {TUNING_SLIDERS.length} params
          </span>
          {changedCount > 0 && (
            <span className="text-[10px] bg-amber-900/50 text-amber-400 px-2 py-0.5 rounded-full">
              {changedCount} modified
            </span>
          )}
          {saving && <span className="text-yellow-400 text-xs animate-pulse">Saving...</span>}
          {error && <span className="text-red-400 text-[10px]">{error}</span>}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm w-48 focus:border-amber-500 outline-none"
          />
          <button
            onClick={() => { if (confirm('Reset ALL to defaults?')) resetAll(); }}
            className="px-3 py-1 bg-red-900/50 hover:bg-red-900/80 text-red-300 text-xs font-bold rounded-lg transition"
          >
            Reset All
          </button>
          <a
            href="#"
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs rounded-lg transition"
          >
            ← Back to Game
          </a>
        </div>
      </div>

      <div className="flex">
        {/* Tab sidebar */}
        <div className="w-48 bg-gray-900/50 border-r border-gray-800 min-h-[calc(100vh-56px)] p-2 space-y-1 sticky top-14 self-start">
          {TUNING_TABS.map(tab => {
            const tabSliders = TUNING_SLIDERS.filter(s => s.tab === tab);
            const modified = tabSliders.filter(s => tuning[s.key] !== DEFAULT_TUNING[s.key]).length;
            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSearch(''); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center justify-between ${
                  activeTab === tab && !search
                    ? 'bg-amber-600/20 text-amber-400 font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span>{tab}</span>
                <span className="text-[10px] text-gray-600">
                  {modified > 0 ? <span className="text-amber-500">{modified}</span> : tabSliders.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Slider area */}
        <div className="flex-1 p-4 max-w-3xl">
          {search && (
            <p className="text-xs text-gray-500 mb-3">
              Showing {sliders.length} results for "{search}"
            </p>
          )}
          <div className="space-y-2">
            {sliders.map(slider => {
              const value = tuning[slider.key];
              const def = DEFAULT_TUNING[slider.key];
              const isDefault = value === def;
              return (
                <div key={slider.key} className={`rounded-lg p-3 border ${isDefault ? 'bg-gray-900/60 border-gray-800/50' : 'bg-amber-950/20 border-amber-800/30'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-200">{slider.label}</span>
                      {!isDefault && (
                        <button
                          onClick={() => setTuning(slider.key, def)}
                          className="text-[9px] bg-gray-700 hover:bg-gray-600 text-gray-400 px-1.5 py-0.5 rounded transition"
                        >
                          reset
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={value}
                        step={slider.step}
                        min={slider.min}
                        max={slider.max}
                        onChange={e => setTuning(slider.key, Number(e.target.value))}
                        className="w-24 text-right bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-sm font-mono text-amber-400 focus:border-amber-500 outline-none"
                      />
                      {!isDefault && (
                        <span className="text-[9px] text-gray-600 w-16 text-right">
                          def: {fmt(def, slider.format)}
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
                    className="w-full accent-amber-500 h-2"
                  />
                  <div className="flex justify-between text-[9px] text-gray-600 mt-0.5">
                    <span>{fmt(slider.min, slider.format)}</span>
                    <span className="text-gray-700 font-mono">{slider.key}</span>
                    <span>{fmt(slider.max, slider.format)}</span>
                  </div>
                </div>
              );
            })}
            {sliders.length === 0 && (
              <p className="text-gray-500 text-center py-8">No parameters found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
