import { useEffect, useRef } from 'react';

interface CausticRibbon {
  baseYRatio: number;
  amplitude: number;
  wavelength: number;
  speed: number;
  phase: number;
  thickness: number;
  hueColor: [number, number, number];
  alpha: number;
}

const RIBBONS: CausticRibbon[] = [
  {
    baseYRatio: 0.22,
    amplitude: 92,
    wavelength: 0.0021,
    speed: 0.26,
    phase: 0.4,
    thickness: 220,
    hueColor: [27, 59, 245], // Electric International Klein Blue
    alpha: 0.095,
  },
  {
    baseYRatio: 0.48,
    amplitude: 115,
    wavelength: 0.0017,
    speed: -0.21,
    phase: 2.1,
    thickness: 260,
    hueColor: [56, 152, 255], // Glacial Azure Light
    alpha: 0.085,
  },
  {
    baseYRatio: 0.74,
    amplitude: 84,
    wavelength: 0.0024,
    speed: 0.19,
    phase: 4.3,
    thickness: 210,
    hueColor: [14, 165, 233], // Optical Ice Cyan
    alpha: 0.068,
  },
  {
    baseYRatio: 0.34,
    amplitude: 68,
    wavelength: 0.0028,
    speed: -0.32,
    phase: 1.2,
    thickness: 145,
    hueColor: [79, 124, 255], // Specular Cobalt Mist
    alpha: 0.075,
  },
];

/**
 * Full-viewport Canvas 2D living refractive caustic & architectural light field.
 * Replaces flat solid backgrounds with sunlit glacial-silver optical ribbons,
 * subtle technical crosshair coordinates, pointer-reactive chromatic lens bloom,
 * and scroll-velocity wave coupling—running smoothly alongside the 3D sphere
 * without allocating a second WebGL context.
 */
export function ChromaticPrismBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    let targetPointerX = width * 0.68;
    let targetPointerY = height * 0.28;
    let pointerX = targetPointerX;
    let pointerY = targetPointerY;
    let pointerActive = false;
    let scrollEnergy = 0;
    let scrollDrift = 0;
    let rafId = 0;

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      targetPointerX = e.clientX;
      targetPointerY = e.clientY;
      pointerActive = true;
    };

    const onScrollVelocity = (e: Event) => {
      const detail = (e as CustomEvent<{ velocity: number }>).detail;
      if (!detail || !Number.isFinite(detail.velocity)) return;
      scrollEnergy = Math.min(2.6, Math.abs(detail.velocity) * 0.06);
      scrollDrift += detail.velocity * 0.0022;
    };

    const drawFrame = (timeSec: number) => {
      ctx.clearRect(0, 0, width, height);

      // 1. Sunlit Daylight Architectural Wash
      const baseGrad = ctx.createLinearGradient(0, 0, width, height);
      baseGrad.addColorStop(0, '#f7faff');
      baseGrad.addColorStop(0.5, '#f2f6fc');
      baseGrad.addColorStop(1, '#eaf1fb');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // Smooth pointer tracking
      pointerX += (targetPointerX - pointerX) * 0.065;
      pointerY += (targetPointerY - pointerY) * 0.065;
      scrollEnergy *= 0.92;

      // 2. Flowing Optical Caustic Light Ribbons
      const stepX = Math.max(48, Math.round(width / 26));
      for (let rIdx = 0; rIdx < RIBBONS.length; rIdx++) {
        const r = RIBBONS[rIdx];
        const baseY = height * r.baseYRatio;
        const t = timeSec * r.speed + r.phase + scrollDrift * (rIdx % 2 === 0 ? 1 : -0.7);
        const ampBoost = 1 + scrollEnergy * 0.32;

        ctx.save();
        ctx.beginPath();

        // Top wave edge
        for (let x = -stepX; x <= width + stepX; x += stepX) {
          const dx = x - pointerX;
          const dy = baseY - pointerY;
          const distSq = dx * dx + dy * dy;
          const lensLift = pointerActive
            ? Math.exp(-distSq / (340 * 340)) * 52 * (rIdx % 2 === 0 ? -1 : 1)
            : 0;

          const wave =
            Math.sin(x * r.wavelength + t) * r.amplitude * ampBoost +
            Math.cos(x * r.wavelength * 0.55 - t * 0.85) * (r.amplitude * 0.42);
          const y = baseY + wave + lensLift - r.thickness * 0.5;
          if (x === -stepX) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        // Bottom wave edge (return path)
        for (let x = width + stepX; x >= -stepX; x -= stepX) {
          const dx = x - pointerX;
          const dy = baseY - pointerY;
          const distSq = dx * dx + dy * dy;
          const lensLift = pointerActive
            ? Math.exp(-distSq / (340 * 340)) * 34 * (rIdx % 2 === 0 ? -1 : 1)
            : 0;

          const wave =
            Math.sin(x * r.wavelength + t + 0.35) * r.amplitude * ampBoost +
            Math.cos(x * r.wavelength * 0.55 - t * 0.85) * (r.amplitude * 0.38);
          const y = baseY + wave + lensLift + r.thickness * 0.5;
          ctx.lineTo(x, y);
        }

        ctx.closePath();
        const ribbonGrad = ctx.createLinearGradient(
          0,
          baseY - r.thickness,
          width,
          baseY + r.thickness,
        );
        const [cr, cg, cb] = r.hueColor;
        ribbonGrad.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, 0)`);
        ribbonGrad.addColorStop(0.28, `rgba(${cr}, ${cg}, ${cb}, ${r.alpha})`);
        ribbonGrad.addColorStop(0.68, `rgba(${cr}, ${cg}, ${cb}, ${(r.alpha * 1.18).toFixed(3)})`);
        ribbonGrad.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
        ctx.fillStyle = ribbonGrad;
        ctx.fill();

        // Thin specular caustic highlight spine along the ribbon center
        ctx.beginPath();
        for (let x = 0; x <= width; x += stepX) {
          const wave =
            Math.sin(x * r.wavelength + t + 0.14) * r.amplitude * ampBoost +
            Math.cos(x * r.wavelength * 0.55 - t * 0.85) * (r.amplitude * 0.4);
          const y = baseY + wave;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${(r.alpha * 1.65).toFixed(3)})`;
        ctx.lineWidth = 1.15;
        ctx.stroke();
        ctx.restore();
      }

      // 3. Pointer-Reactive Refractive Prism Bloom
      const haloRadius = Math.min(width, height) * 0.46;
      const haloGrad = ctx.createRadialGradient(
        pointerX,
        pointerY,
        0,
        pointerX,
        pointerY,
        haloRadius,
      );
      haloGrad.addColorStop(0, 'rgba(27, 59, 245, 0.11)');
      haloGrad.addColorStop(0.36, 'rgba(56, 152, 255, 0.055)');
      haloGrad.addColorStop(1, 'rgba(243, 246, 251, 0)');
      ctx.fillStyle = haloGrad;
      ctx.fillRect(0, 0, width, height);

      // 4. Precision Optical Coordinate Grid & Micro-Crosshairs
      const cell = width >= 1024 ? 96 : 72;
      const offsetX = (width % cell) * 0.5;
      const offsetY = ((scrollDrift * 28) % cell + cell) % cell;

      ctx.strokeStyle = 'rgba(8, 10, 15, 0.032)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = offsetX; x < width; x += cell) {
        const px = Math.round(x) + 0.5;
        ctx.moveTo(px, 0);
        ctx.lineTo(px, height);
      }
      for (let y = offsetY; y < height; y += cell) {
        const py = Math.round(y) + 0.5;
        ctx.moveTo(0, py);
        ctx.lineTo(width, py);
      }
      ctx.stroke();

      // Subtle crosshair ticks that illuminate in Klein Blue near the pointer
      for (let x = offsetX; x < width; x += cell) {
        for (let y = offsetY; y < height; y += cell) {
          const dist = Math.hypot(x - pointerX, y - pointerY);
          const near = Math.max(0, 1 - dist / 260);
          const alpha = 0.09 + near * 0.45;
          const arm = 2.5 + near * 2.5;
          ctx.strokeStyle =
            near > 0.12
              ? `rgba(27, 59, 245, ${alpha.toFixed(3)})`
              : `rgba(8, 10, 15, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(x - arm, y);
          ctx.lineTo(x + arm, y);
          ctx.moveTo(x, y - arm);
          ctx.lineTo(x, y + arm);
          ctx.stroke();
        }
      }
    };

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('studio:scroll-velocity', onScrollVelocity);

    const start = performance.now();
    const tick = (now: number) => {
      drawFrame((now - start) * 0.001);
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('studio:scroll-velocity', onScrollVelocity);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="chromatic-prism-backdrop"
      aria-hidden="true"
      className="fixed inset-0 z-0 h-full w-full pointer-events-none"
    />
  );
}
