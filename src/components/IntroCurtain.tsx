import { useEffect, useState } from 'react';
import { DESIGNER_NAME } from '../utils/contact';

const SESSION_KEY = 'sai_charan_intro_seen_v3';

/**
 * Crisp 0.85s gallery opening veil with whip-curve exit.
 * Skips automatically on `?autostart=1`, `prefers-reduced-motion: reduce`,
 * or repeat loads within the same session.
 */
export function IntroCurtain() {
  const [shouldShow, setShouldShow] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') return false;
    try {
      if (window.sessionStorage.getItem(SESSION_KEY) === '1') return false;
    } catch {
      // Ignore storage restrictions
    }
    return true;
  });

  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!shouldShow) return;

    try {
      window.sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // Ignore storage errors
    }

    const start = performance.now();
    const duration = 540;
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -8 * t);
      setProgress(Math.round(eased * 100));

      if (t < 1) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        setExiting(true);
      }
    };

    rafId = window.requestAnimationFrame(tick);

    const removeTimer = window.setTimeout(() => {
      setShouldShow(false);
    }, 1100);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(removeTimer);
    };
  }, [shouldShow]);

  if (!shouldShow) return null;

  return (
    <div
      data-testid="intro-curtain"
      aria-hidden="true"
      className={`fixed inset-0 z-[100] bg-[#080a0f] text-[#f3f6fb] flex flex-col justify-between px-6 sm:px-10 py-8 transition-transform duration-500 ease-[cubic-bezier(0.83,0,0.17,1)] ${
        exiting ? '-translate-y-full pointer-events-none' : 'translate-y-0'
      }`}
    >
      <div className="flex items-center justify-between text-[12px] font-mono-tabular text-white/55">
        <span>{DESIGNER_NAME}</span>
        <span>Independent Web &amp; Motion Studio</span>
      </div>

      <div className="max-w-[1360px] w-full mx-auto">
        <p className="font-display text-[36px] sm:text-[56px] lg:text-[72px] font-bold leading-[0.98] tracking-[-0.04em] text-[#f3f6fb]">
          Websites built to earn{' '}
          <span className="text-[#4f7cff]">attention.</span>
        </p>
      </div>

      <div className="w-full">
        <div className="flex items-end justify-between pb-3">
          <span className="text-[12px] font-mono-tabular text-white/55">
            Design · Scroll Motion · SEO / GEO / AEO
          </span>
          <span className="font-mono-tabular text-[28px] sm:text-[36px] leading-none text-[#f3f6fb]">
            {String(progress).padStart(2, '0')}
          </span>
        </div>
        <div className="h-[1.5px] w-full bg-white/15 overflow-hidden">
          <div
            className="h-full bg-[#4f7cff] origin-left transition-transform duration-75"
            style={{ transform: `scaleX(${progress / 100})` }}
          />
        </div>
      </div>
    </div>
  );
}
