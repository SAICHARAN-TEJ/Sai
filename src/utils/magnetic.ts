import gsap from 'gsap';

/**
 * Adds a restrained, physical magnetic hover pull (<= 6px) to primary CTA
 * buttons strictly on desktop fine-pointer devices while keeping the native
 * OS cursor completely intact.
 */
export function attachMagneticCtas(root: HTMLElement): () => void {
  const fineDesktop = window.matchMedia(
    '(min-width: 1024px) and (pointer: fine)',
  ).matches;

  if (!fineDesktop) {
    return () => {};
  }

  const targets = Array.from(
    root.querySelectorAll<HTMLElement>('[data-magnetic-cta]'),
  );
  if (targets.length === 0) {
    return () => {};
  }

  const cleanups: Array<() => void> = [];

  for (const el of targets) {
    const xTo = gsap.quickTo(el, 'x', {
      duration: 0.35,
      ease: 'power3.out',
    });
    const yTo = gsap.quickTo(el, 'y', {
      duration: 0.35,
      ease: 'power3.out',
    });

    const maxShift = 6;

    const onMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const relX = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const relY = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      const clampedX = Math.max(-1, Math.min(1, relX));
      const clampedY = Math.max(-1, Math.min(1, relY));
      xTo(clampedX * maxShift);
      yTo(clampedY * maxShift);
    };

    const onLeave = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    el.addEventListener('blur', onLeave);

    cleanups.push(() => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('blur', onLeave);
      gsap.set(el, { clearProps: 'x,y' });
    });
  }

  return () => {
    for (const cleanup of cleanups) {
      cleanup();
    }
  };
}
