import { useEffect, useRef } from 'react';

const RIBBON_ITEMS = [
  'Websites built to convert',
  'Scroll-driven zoom cinema',
  'Google SEO · GEO · AEO',
  'Complete online stores',
  'Interactive 3D showreels',
  'Live demo before you pay half',
];

/**
 * Architectural horizontal marquee responding to live Lenis scroll velocity
 * via custom `studio:scroll-velocity` events. Pauses under reduced motion.
 */
export function VelocityMarquee() {
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let offset = 0;
    let boost = 0;
    let direction = 1;
    let rafId = 0;
    let lastTime = performance.now();

    const onVelocity = (e: Event) => {
      const detail = (e as CustomEvent<{ velocity: number }>).detail;
      if (!detail || !Number.isFinite(detail.velocity)) return;
      const v = detail.velocity;
      if (Math.abs(v) > 0.25) {
        direction = v >= 0 ? 1 : -1;
      }
      boost = Math.min(Math.abs(v) * 0.42, 16);
    };

    window.addEventListener('studio:scroll-velocity', onVelocity);

    const step = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      boost *= 0.92;
      const baseSpeed = 36;
      const speed = (baseSpeed + boost * 16) * direction;

      const halfWidth = track.scrollWidth / 2;
      if (halfWidth > 0) {
        offset -= speed * dt;
        if (offset <= -halfWidth) offset += halfWidth;
        if (offset > 0) offset -= halfWidth;
        track.style.transform = `translate3d(${offset.toFixed(2)}px, 0, 0)`;
      }

      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('studio:scroll-velocity', onVelocity);
      track.style.transform = '';
    };
  }, []);

  const repeated = [...RIBBON_ITEMS, ...RIBBON_ITEMS];

  return (
    <div
      aria-hidden="true"
      className="relative z-10 border-t border-[#080a0f]/[0.09] bg-[#f3f6fb]/75 backdrop-blur-xs py-5 overflow-hidden select-none"
    >
      <div
        ref={trackRef}
        className="flex items-center whitespace-nowrap will-change-transform"
      >
        {repeated.map((label, idx) => (
          <div
            key={`${label}-${idx}`}
            className="inline-flex items-center shrink-0"
          >
            <span
              className={`font-display text-[20px] sm:text-[23px] font-semibold tracking-[-0.028em] px-6 sm:px-8 ${
                idx % 2 === 1 ? 'text-[#1b3bf5]' : 'text-[#080a0f]/88'
              }`}
            >
              {label}
            </span>
            <span className="font-mono-tabular text-[#080a0f]/25 text-[14px]">
              /
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
