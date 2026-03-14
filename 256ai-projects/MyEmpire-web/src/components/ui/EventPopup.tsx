import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { getEventDef } from '../../engine/events';
import { formatMoney } from '../../engine/economy';
import { useState, useEffect } from 'react';
import { sound } from '../../engine/sound';

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  life:     { bg: 'from-blue-900/80 to-blue-950/90',   border: 'border-blue-500/40',   text: 'text-blue-300',   badge: 'bg-blue-800/60 text-blue-300' },
  criminal: { bg: 'from-red-900/80 to-red-950/90',     border: 'border-red-500/40',     text: 'text-red-300',    badge: 'bg-red-800/60 text-red-300' },
  business: { bg: 'from-emerald-900/80 to-emerald-950/90', border: 'border-emerald-500/40', text: 'text-emerald-300', badge: 'bg-emerald-800/60 text-emerald-300' },
  vice:     { bg: 'from-purple-900/80 to-purple-950/90', border: 'border-purple-500/40', text: 'text-purple-300', badge: 'bg-purple-800/60 text-purple-300' },
};

function formatOutcome(outcome: Record<string, number | undefined>): string[] {
  const lines: string[] = [];
  if (outcome.dirtyCashDelta) lines.push(`${outcome.dirtyCashDelta > 0 ? '+' : ''}${formatMoney(outcome.dirtyCashDelta)} dirty`);
  if (outcome.cleanCashDelta) lines.push(`${outcome.cleanCashDelta > 0 ? '+' : ''}${formatMoney(outcome.cleanCashDelta)} clean`);
  if (outcome.heatDelta) lines.push(`${outcome.heatDelta > 0 ? '+' : ''}${outcome.heatDelta} heat`);
  if (outcome.rivalHeatDelta) lines.push(`${outcome.rivalHeatDelta > 0 ? '+' : ''}${outcome.rivalHeatDelta} rival heat`);
  if (outcome.seedDelta) lines.push(`${outcome.seedDelta > 0 ? '+' : ''}${outcome.seedDelta} seeds`);
  if (outcome.dealerCountDelta) lines.push(`${outcome.dealerCountDelta > 0 ? '+' : ''}${outcome.dealerCountDelta} dealers`);
  if (outcome.speedBoostTicks) lines.push(`Speed boost ${Math.round((outcome.speedBoostMultiplier ?? 1) * 100 - 100)}% for ${outcome.speedBoostTicks}s`);
  if (outcome.revenueBoostTicks) lines.push(`Revenue boost ${Math.round((outcome.revenueBoostMultiplier ?? 1) * 100 - 100)}% for ${outcome.revenueBoostTicks}s`);
  if (outcome.launderBoostTicks) lines.push(`Launder boost ${Math.round((outcome.launderBoostMultiplier ?? 1) * 100 - 100)}% for ${outcome.launderBoostTicks}s`);
  if (outcome.heatFreezeTickCount) lines.push(`Heat frozen for ${outcome.heatFreezeTickCount}s`);
  return lines;
}

export default function EventPopup() {
  const eventSystem = useGameStore((s) => s.eventSystem);
  const resolveEvent = useGameStore((s) => s.resolveEvent);
  const dismissEvent = useGameStore((s) => s.dismissEvent);
  const dirtyCash = useGameStore((s) => s.dirtyCash);
  const cleanCash = useGameStore((s) => s.cleanCash);
  const addNotification = useUIStore((s) => s.addNotification);

  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Play sound when event popup appears
  useEffect(() => {
    if (eventSystem?.activeEvent) sound.play('event_popup');
  }, [eventSystem?.activeEvent?.eventId]);

  if (!eventSystem?.activeEvent && !result) return null;

  // Show result screen
  if (result) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
        <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl p-5 space-y-4">
          <div className="text-center">
            <span className="text-4xl">{result.success ? '✅' : '❌'}</span>
            <p className="text-white font-bold text-lg mt-2">{result.success ? 'Success!' : 'Failed!'}</p>
            <p className="text-gray-400 text-sm mt-1">{result.message}</p>
          </div>
          <button
            onClick={() => setResult(null)}
            className="w-full py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold text-sm transition"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  const eventDef = eventSystem?.activeEvent ? getEventDef(eventSystem.activeEvent.eventId) : null;
  if (!eventDef) return null;

  const colors = CATEGORY_COLORS[eventDef.category] ?? CATEGORY_COLORS.life;

  const handleChoice = (index: number) => {
    const choice = eventDef.choices[index];
    // Check requirements
    if (choice.requiresDirtyCash && dirtyCash < choice.requiresDirtyCash) {
      addNotification(`Need ${formatMoney(choice.requiresDirtyCash)} dirty cash`, 'warning');
      return;
    }
    if (choice.requiresCleanCash && cleanCash < choice.requiresCleanCash) {
      addNotification(`Need ${formatMoney(choice.requiresCleanCash)} clean cash`, 'warning');
      return;
    }
    const res = resolveEvent(index);
    if (res) {
      sound.play('click');
      setResult(res);
      addNotification(
        `${eventDef.icon} ${eventDef.name}: ${res.success ? 'Success' : 'Failed'}`,
        res.success ? 'success' : 'warning',
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className={`w-full max-w-sm bg-gradient-to-b ${colors.bg} border ${colors.border} rounded-2xl overflow-hidden`}>

        {/* Header */}
        <div className="p-5 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${colors.badge}`}>
              {eventDef.category}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-3xl">{eventDef.icon}</span>
            <h3 className="text-white font-bold text-lg leading-tight">{eventDef.name}</h3>
          </div>
          <p className="text-gray-300 text-sm mt-3 leading-relaxed">{eventDef.description}</p>
        </div>

        {/* Choices */}
        <div className="px-5 pb-5 space-y-2">
          {eventDef.choices.map((choice, i) => {
            const canAfford = (!choice.requiresDirtyCash || dirtyCash >= choice.requiresDirtyCash)
              && (!choice.requiresCleanCash || cleanCash >= choice.requiresCleanCash);
            const outcomeLines = formatOutcome(choice.successOutcome as Record<string, number | undefined>);

            return (
              <button
                key={i}
                onClick={() => handleChoice(i)}
                disabled={!canAfford}
                className={`w-full text-left p-3 rounded-xl border transition ${
                  canAfford
                    ? 'bg-gray-800/60 border-gray-600/50 hover:bg-gray-700/60 hover:border-gray-500/50'
                    : 'bg-gray-800/30 border-gray-700/30 opacity-50 cursor-not-allowed'
                }`}
              >
                <p className="text-white font-semibold text-sm">{choice.label}</p>
                <p className="text-gray-400 text-xs mt-0.5">{choice.description}</p>
                {outcomeLines.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {outcomeLines.map((line, j) => (
                      <span key={j} className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        line.startsWith('+') ? 'bg-green-900/40 text-green-400'
                          : line.startsWith('-') ? 'bg-red-900/40 text-red-400'
                          : 'bg-gray-700/50 text-gray-300'
                      }`}>
                        {line}
                      </span>
                    ))}
                  </div>
                )}
                {choice.successChance < 1 && (
                  <p className="text-gray-500 text-[10px] mt-1">{Math.round(choice.successChance * 100)}% success chance</p>
                )}
              </button>
            );
          })}

          {/* Dismiss button */}
          <button
            onClick={dismissEvent}
            className="w-full py-2 text-gray-500 hover:text-gray-400 text-xs transition"
          >
            Ignore
          </button>
        </div>
      </div>
    </div>
  );
}
