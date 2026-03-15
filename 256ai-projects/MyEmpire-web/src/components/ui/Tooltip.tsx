import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  delay?: number;
}

export default function Tooltip({ text, children, delay = 300 }: TooltipProps) {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0, above: false });
  const timeoutRef = useRef<number>(0);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  const handleEnter = useCallback(() => {
    timeoutRef.current = window.setTimeout(() => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const above = rect.bottom > window.innerHeight - 80;
      setCoords({
        x: rect.left + rect.width / 2,
        y: above ? rect.top - 8 : rect.bottom + 8,
        above,
      });
      setShow(true);
    }, delay);
  }, [delay]);

  const handleLeave = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setShow(false);
  }, []);

  return (
    <span
      ref={wrapperRef}
      style={{ display: 'contents' }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
      {show && createPortal(
        <div
          className="fixed z-[200] pointer-events-none"
          style={{
            left: coords.x,
            top: coords.above ? undefined : coords.y,
            bottom: coords.above ? window.innerHeight - coords.y : undefined,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="bg-gray-900 border border-gray-600 text-white text-[11px] leading-relaxed px-2.5 py-1.5 rounded-lg shadow-lg max-w-[220px] whitespace-normal text-center">
            {text}
          </div>
        </div>,
        document.body,
      )}
    </span>
  );
}
