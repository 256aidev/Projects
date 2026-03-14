import { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { TUTORIAL_STEPS } from '../../data/tutorial';
import type { TutorialStep } from '../../data/tutorial';

export default function TutorialOverlay() {
  const gameSettings = useGameStore((s) => s.gameSettings);
  const advanceTutorial = useGameStore((s) => s.advanceTutorial);
  const skipTutorial = useGameStore((s) => s.skipTutorial);
  const setActiveView = useUIStore((s) => s.setActiveView);

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const { tutorialActive, tutorialStep } = gameSettings;
  const step: TutorialStep | undefined = tutorialActive ? TUTORIAL_STEPS[tutorialStep] : undefined;

  // Find and measure the target element
  const measureTarget = useCallback(() => {
    if (!step?.target) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(step.target);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [step?.target]);

  useEffect(() => {
    measureTarget();
    // Re-measure on scroll/resize
    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget, true);
    const interval = setInterval(measureTarget, 500); // poll for dynamic elements
    return () => {
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget, true);
      clearInterval(interval);
    };
  }, [measureTarget]);

  // Auto-switch to the required view
  useEffect(() => {
    if (step?.requiredView) {
      setActiveView(step.requiredView);
    }
  }, [step?.requiredView, setActiveView]);

  if (!tutorialActive || !step) return null;

  const isCenter = !step.target || !targetRect;
  const hasAction = !!step.advanceOn; // step requires a game action to advance

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Darkened backdrop with spotlight cutout */}
      {isCenter ? (
        <div className="absolute inset-0 bg-black/70 pointer-events-auto" />
      ) : (
        <>
          {/* SVG mask for spotlight effect */}
          <svg className="absolute inset-0 w-full h-full pointer-events-auto" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <mask id="tutorial-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={targetRect!.left - 6}
                  y={targetRect!.top - 6}
                  width={targetRect!.width + 12}
                  height={targetRect!.height + 12}
                  rx="8"
                  fill="black"
                />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.7)" mask="url(#tutorial-mask)" />
          </svg>
          {/* Highlight ring around target */}
          <div
            className="absolute border-2 border-emerald-400 rounded-lg animate-pulse pointer-events-none"
            style={{
              left: targetRect!.left - 6,
              top: targetRect!.top - 6,
              width: targetRect!.width + 12,
              height: targetRect!.height + 12,
            }}
          />
        </>
      )}

      {/* Tooltip / Modal */}
      <div
        className="pointer-events-auto"
        style={isCenter ? {
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: '320px',
          width: '90%',
        } : getTooltipPosition(targetRect!, step.position)}
      >
        <div className="bg-gray-900 border border-emerald-700/60 rounded-2xl p-4 shadow-2xl shadow-emerald-900/30">
          <h3 className="text-emerald-400 font-bold text-sm mb-1.5">{step.title}</h3>
          <p className="text-gray-300 text-xs leading-relaxed mb-3">{step.message}</p>

          <div className="flex items-center justify-between">
            <button
              onClick={skipTutorial}
              className="text-gray-600 hover:text-gray-400 text-[10px] transition"
            >
              Skip Tutorial
            </button>

            {/* Progress dots */}
            <div className="flex gap-0.5">
              {TUTORIAL_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${
                    i === tutorialStep ? 'bg-emerald-400' : i < tutorialStep ? 'bg-emerald-800' : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>

            {!hasAction && (
              <button
                onClick={advanceTutorial}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
              >
                {tutorialStep === TUTORIAL_STEPS.length - 1 ? "Let's Go!" : 'Got it'}
              </button>
            )}
          </div>

          {hasAction && (
            <p className="text-emerald-500/70 text-[9px] text-center mt-2 animate-pulse">
              👆 Complete the action above to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function getTooltipPosition(
  rect: DOMRect,
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center',
): React.CSSProperties {
  const pos = position ?? 'bottom';
  const style: React.CSSProperties = {
    position: 'absolute',
    maxWidth: '300px',
    width: '85%',
  };

  switch (pos) {
    case 'top':
      style.left = `${Math.max(16, Math.min(window.innerWidth - 280, rect.left + rect.width / 2 - 140))}px`;
      style.bottom = `${window.innerHeight - rect.top + 12}px`;
      break;
    case 'bottom':
      style.left = `${Math.max(16, Math.min(window.innerWidth - 280, rect.left + rect.width / 2 - 140))}px`;
      style.top = `${rect.bottom + 12}px`;
      break;
    case 'left':
      style.right = `${window.innerWidth - rect.left + 12}px`;
      style.top = `${rect.top + rect.height / 2 - 40}px`;
      break;
    case 'right':
      style.left = `${rect.right + 12}px`;
      style.top = `${rect.top + rect.height / 2 - 40}px`;
      break;
  }

  return style;
}
