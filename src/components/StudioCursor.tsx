import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

type CursorMode = 'default' | 'action' | 'play' | 'drag' | 'preview' | 'text';

const MODE_LABELS: Partial<Record<CursorMode, string>> = {
  play: 'Watch',
  drag: 'Drag',
  preview: 'View',
};

interface TrailPoint {
  x: number;
  y: number;
  age: number;
}

interface ClickRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

/**
 * Bespoke desktop studio cursor: tapered calligraphic silk ribbon trail,
 * click ripples, #1b3bf5 diamond nib, and rotating orbital lens rings
 * (`Watch`, `View`, `Drag`, `Zoom`). Disabled automatically on touch & reduced motion.
 */
export function StudioCursor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const haloRef = useRef<HTMLDivElement | null>(null);

  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [mode, setMode] = useState<CursorMode>('default');
  const [customLabel, setCustomLabel] = useState<string | null>(null);

  useEffect(() => {
    const fineDesktop = window.matchMedia(
      '(min-width: 1024px) and (pointer: fine)',
    );

    const syncEnabled = () => {
      const next = fineDesktop.matches;
      setEnabled(next);
      document.documentElement.classList.toggle('has-studio-cursor', next);
    };

    syncEnabled();
    fineDesktop.addEventListener('change', syncEnabled);

    return () => {
      fineDesktop.removeEventListener('change', syncEnabled);
      document.documentElement.classList.remove('has-studio-cursor');
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const dot = dotRef.current;
    const halo = haloRef.current;
    const canvas = canvasRef.current;
    if (!dot || !halo || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const xDot = gsap.quickTo(dot, 'x', { duration: 0.045, ease: 'power2.out' });
    const yDot = gsap.quickTo(dot, 'y', { duration: 0.045, ease: 'power2.out' });
    const xHalo = gsap.quickTo(halo, 'x', {
      duration: 0.24,
      ease: 'power3.out',
    });
    const yHalo = gsap.quickTo(halo, 'y', {
      duration: 0.24,
      ease: 'power3.out',
    });

    const trail: TrailPoint[] = [];
    const ripples: ClickRipple[] = [];
    const MAX_TRAIL = 16;

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let lastX = pointerX;
    let lastY = pointerY;
    let currentMode: CursorMode = 'default';
    let hasEntered = false;
    let settleTimer: number | null = null;
    let rafId = 0;

    const drawRibbonAndRipples = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Tapered calligraphic silk ribbon in Electric Klein Blue
      if (trail.length > 2) {
        for (let i = 1; i < trail.length; i++) {
          const p0 = trail[i - 1];
          const p1 = trail[i];
          const progress = i / trail.length;
          const alpha = progress * (1 - p1.age) * 0.32;
          if (alpha <= 0.005) continue;

          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.strokeStyle = `rgba(27, 59, 245, ${alpha.toFixed(3)})`;
          ctx.lineWidth = Math.max(0.75, progress * 3.2);
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }

      for (let i = trail.length - 1; i >= 0; i--) {
        trail[i].age += 0.065;
        if (trail[i].age >= 1) {
          trail.splice(i, 1);
        }
      }

      // Click ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += (r.maxRadius - r.radius) * 0.16 + 1.2;
        r.alpha *= 0.86;

        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(27, 59, 245, ${r.alpha.toFixed(3)})`;
        ctx.lineWidth = 1.25;
        ctx.stroke();

        if (r.alpha < 0.02 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1);
        }
      }

      if (trail.length > 0 || ripples.length > 0) {
        rafId = window.requestAnimationFrame(drawRibbonAndRipples);
      } else {
        rafId = 0;
      }
    };

    const ensureLoop = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(drawRibbonAndRipples);
      }
    };

    const resolveMode = (target: EventTarget | null) => {
      const el = target instanceof HTMLElement ? target : null;
      if (!el) return { mode: 'default' as CursorMode, label: null };

      if (el.closest('input, select, textarea')) {
        return { mode: 'default' as CursorMode, label: null };
      }

      const explicit = el.closest<HTMLElement>('[data-cursor]');
      if (explicit) {
        const raw = explicit.dataset.cursor as CursorMode | undefined;
        const label = explicit.dataset.cursorLabel ?? null;
        if (
          raw === 'action' ||
          raw === 'play' ||
          raw === 'drag' ||
          raw === 'preview' ||
          raw === 'text'
        ) {
          return { mode: raw, label };
        }
      }

      if (el.closest('button, a, [role="button"]')) {
        return { mode: 'action' as CursorMode, label: null };
      }

      return { mode: 'default' as CursorMode, label: null };
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== 'mouse') return;

      const x = event.clientX;
      const y = event.clientY;
      const dx = x - lastX;
      const dy = y - lastY;
      lastX = x;
      lastY = y;
      pointerX = x;
      pointerY = y;

      if (!hasEntered) {
        hasEntered = true;
        gsap.set([dot, halo], { x, y });
        setVisible(true);
      } else {
        xDot(x);
        yDot(y);
        xHalo(x);
        yHalo(y);
      }

      if (Math.hypot(dx, dy) > 1.5) {
        trail.push({ x, y, age: 0 });
        if (trail.length > MAX_TRAIL) trail.shift();
        ensureLoop();
      }

      const next = resolveMode(event.target);
      if (next.mode !== currentMode) {
        currentMode = next.mode;
        setMode(next.mode);
      }
      setCustomLabel(next.label);

      if (currentMode === 'default' || currentMode === 'action') {
        const speed = Math.min(Math.hypot(dx, dy), 52);
        const stretch = 1 + (speed / 52) * 0.24;
        const squash = 1 - (speed / 52) * 0.14;
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

        gsap.to(halo, {
          rotation: speed > 3 ? angle : 0,
          scaleX: speed > 3 ? stretch : 1,
          scaleY: speed > 3 ? squash : 1,
          duration: 0.16,
          ease: 'power2.out',
          overwrite: 'auto',
        });

        if (settleTimer !== null) window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(() => {
          gsap.to(halo, {
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            duration: 0.3,
            ease: 'power3.out',
          });
        }, 85);
      } else {
        gsap.to(halo, {
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          duration: 0.18,
          ease: 'power3.out',
          overwrite: 'auto',
        });
      }
    };

    const onScrollSync = () => {
      if (!hasEntered) return;
      const targetUnderPointer = document.elementFromPoint(pointerX, pointerY);
      const next = resolveMode(targetUnderPointer);
      if (next.mode !== currentMode) {
        currentMode = next.mode;
        setMode(next.mode);
      }
      setCustomLabel(next.label);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      setPressed(true);
      ripples.push({
        x: event.clientX,
        y: event.clientY,
        radius: 6,
        maxRadius: 42,
        alpha: 0.55,
      });
      ensureLoop();
    };
    const onPointerUp = () => setPressed(false);
    const onMouseLeave = () => setVisible(false);
    const onMouseEnter = () => {
      if (hasEntered) setVisible(true);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('scroll', onScrollSync, { passive: true });
    window.addEventListener('studio:scroll-velocity', onScrollSync);
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    document.documentElement.addEventListener('mouseleave', onMouseLeave);
    document.documentElement.addEventListener('mouseenter', onMouseEnter);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      if (settleTimer !== null) window.clearTimeout(settleTimer);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', onScrollSync);
      window.removeEventListener('studio:scroll-velocity', onScrollSync);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      document.documentElement.removeEventListener('mouseleave', onMouseLeave);
      document.documentElement.removeEventListener('mouseenter', onMouseEnter);
    };
  }, [enabled]);

  if (!enabled) return null;

  const isLens = mode === 'play' || mode === 'drag' || mode === 'preview';
  const isText = mode === 'text';
  const isAction = mode === 'action';
  const badgeText = customLabel ?? (isLens ? MODE_LABELS[mode] : null);
  const haloSize = isLens ? 76 : isText ? 56 : isAction ? 46 : 34;

  return (
    <div
      data-testid="studio-cursor"
      data-cursor-mode={mode}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-[90] overflow-hidden transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Silk Ribbon Trail & Click Ripples */}
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" />

      {/* Outer Orbital Ring / Contextual Lens */}
      <div
        ref={haloRef}
        className={`fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transition-[width,height,background-color,border-color] duration-150 ease-out ${
          isLens
            ? 'bg-[#080a0f]/92 text-white border border-[#4f7cff]/55 shadow-[0_12px_32px_-8px_rgba(27,59,245,0.45)] backdrop-blur-xs'
            : isText
              ? 'bg-transparent mix-blend-difference border border-white/90'
              : isAction
                ? 'bg-[#1b3bf5]/10 border border-[#1b3bf5]/75'
                : 'bg-transparent border border-[#080a0f]/30'
        }`}
        style={{
          width: `${haloSize}px`,
          height: `${haloSize}px`,
          willChange: 'transform',
        }}
      >
        {/* Subtle dashed inner orbital ring in lens mode */}
        {isLens && (
          <svg
            viewBox="0 0 80 80"
            className="absolute inset-0 w-full h-full animate-[spin_9s_linear_infinite]"
            aria-hidden="true"
          >
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="rgba(158,197,255,0.42)"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
          </svg>
        )}

        <div
          className={`flex items-center justify-center transition-transform duration-150 ${
            pressed ? 'scale-90' : 'scale-100'
          }`}
        >
          {badgeText && (
            <span className="font-mono-tabular text-[11px] font-medium uppercase tracking-[0.08em] text-white select-none">
              {badgeText}
            </span>
          )}
        </div>
      </div>

      {/* Precision Electric Klein Blue Diamond Nib */}
      <div
        ref={dotRef}
        className={`fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 rotate-45 transition-[width,height,opacity,background-color] duration-150 ${
          isLens
            ? 'w-1 h-1 opacity-0'
            : isAction
              ? 'w-2.5 h-2.5 bg-[#1b3bf5] opacity-100 shadow-[0_0_10px_rgba(27,59,245,0.55)]'
              : 'w-2 h-2 bg-[#1b3bf5] opacity-100'
        }`}
        style={{
          willChange: 'transform',
        }}
      />
    </div>
  );
}
