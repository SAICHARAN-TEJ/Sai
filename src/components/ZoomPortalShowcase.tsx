import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDown, ArrowUpRight, Play, X } from 'lucide-react';
import { openWhatsAppChat } from '../utils/contact';
import { EASE_IN, EASE_OUT, SPRING } from '../utils/motion';

gsap.registerPlugin(ScrollTrigger);

interface PortalReel {
  id: string;
  index: string;
  label: string;
  category: string;
  caption: string;
  videoUrl: string;
}

const PORTAL_REELS: PortalReel[] = [
  {
    id: 'facet-glass',
    index: '01',
    label: 'Facet Glass',
    category: 'Refractive 3D Motion',
    caption: 'Faceted studio glass catching light and camera depth on scroll.',
    videoUrl:
      'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/facet-glass-hero.mp4',
  },
  {
    id: 'obsidian',
    index: '02',
    label: 'Obsidian',
    category: 'Editorial Cinema',
    caption: 'Oversized typographic plane broken by a sculptural centerpiece.',
    videoUrl:
      'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/a/obsisidianArea.mp4',
  },
  {
    id: 'glaze',
    index: '03',
    label: 'Glaze',
    category: 'Scroll Choreography',
    caption: 'Three-stage product story scrubbed smoothly at 60fps.',
    videoUrl:
      'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/glaze-motion.mp4',
  },
  {
    id: 'try-the-look',
    index: '04',
    label: 'Try The Look',
    category: 'Interactive Storefront',
    caption: 'Live editorial garment swaps engineered for zero-lag retail.',
    videoUrl:
      'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/try-the-look-hero.mp4',
  },
];

const SATELLITE_FRAMES = [
  {
    id: 'sat-tl',
    label: 'Obsidian · Editorial',
    videoUrl:
      'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/a/obsisidianArea.mp4',
    positionClass: 'top-[22.5vh] left-[3vw] w-[17.5vw] max-w-[248px] aspect-[16/10]',
    exitX: -175,
    exitY: -135,
    exitScale: 1.55,
  },
  {
    id: 'sat-tr',
    label: 'Glaze · Scroll Motion',
    videoUrl:
      'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/glaze-motion.mp4',
    positionClass: 'top-[22.5vh] right-[3vw] w-[17vw] max-w-[242px] aspect-[16/10]',
    exitX: 175,
    exitY: -130,
    exitScale: 1.5,
  },
  {
    id: 'sat-bl',
    label: 'Try The Look · Retail',
    videoUrl:
      'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/try-the-look-hero.mp4',
    positionClass: 'bottom-[11vh] left-[3.5vw] w-[18vw] max-w-[254px] aspect-[16/10]',
    exitX: -165,
    exitY: 140,
    exitScale: 1.6,
  },
  {
    id: 'sat-br',
    label: 'Saffron · 3D Field',
    videoUrl:
      'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/designs/saffron-3d-webgl-landing.mp4',
    positionClass: 'bottom-[11vh] right-[3.5vw] w-[17.5vw] max-w-[248px] aspect-[16/10]',
    exitX: 165,
    exitY: 135,
    exitScale: 1.55,
  },
];

/**
 * Dedicated Awwwards-grade Pinned Scroll Zoom-In Portal (`desktop >=1024px`).
 * As you scroll, four surrounding live satellite frames fly radially outward
 * while the central cinema frame scales smoothly from a floating 43% viewport
 * portal all the way to a 100% edge-to-edge full-screen cinema canvas.
 */
export function ZoomPortalShowcase() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const pinStageRef = useRef<HTMLDivElement | null>(null);
  const corePortalRef = useRef<HTMLDivElement | null>(null);
  const hudRef = useRef<HTMLDivElement | null>(null);
  const revealOverlayRef = useRef<HTMLDivElement | null>(null);
  const scaleReadoutRef = useRef<HTMLSpanElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const [activeReelId, setActiveReelId] = useState<string>(PORTAL_REELS[0].id);
  const [modalOpen, setModalOpen] = useState(false);

  const activeReel =
    PORTAL_REELS.find((r) => r.id === activeReelId) ?? PORTAL_REELS[0];

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalOpen]);

  useEffect(() => {
    const sectionEl = sectionRef.current;
    const stageEl = pinStageRef.current;
    const coreEl = corePortalRef.current;
    if (!sectionEl || !stageEl || !coreEl) return;

    const mm = gsap.matchMedia();

    mm.add('(min-width: 1024px)', () => {
      const satNodes = SATELLITE_FRAMES.map((sat) => ({
        spec: sat,
        el: stageEl.querySelector<HTMLElement>(`[data-zoom-sat="${sat.id}"]`),
      }));
      const hudEl = hudRef.current;
      const revealEl = revealOverlayRef.current;
      const scaleLabel = scaleReadoutRef.current;
      const barEl = progressBarRef.current;

      gsap.set(coreEl, {
        scale: 0.43,
        borderRadius: '44px',
        transformOrigin: '50% 50%',
      });

      if (revealEl) {
        gsap.set(revealEl, { opacity: 0, y: 30, pointerEvents: 'none' });
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stageEl,
          start: 'top top',
          end: '+=1850',
          pin: true,
          scrub: 0.72,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            sectionEl.dataset.zoomProgress = self.progress.toFixed(2);
            const zoomPct = Math.round(100 + Math.min(1, self.progress / 0.78) * 133);
            if (scaleLabel) {
              scaleLabel.textContent = `${zoomPct}%`;
            }
            if (barEl) {
              barEl.style.transform = `scaleX(${Math.max(0.04, self.progress)})`;
            }
          },
        },
      });

      // Phase 1 (0 -> 0.78): Central portal zooms cleanly from 43% to 100% edge-to-edge full screen
      tl.to(
        coreEl,
        {
          scale: 1,
          borderRadius: '0px',
          duration: 0.78,
          ease: 'power2.inOut',
        },
        0,
      );

      // Phase 1b (0 -> 0.62): Surrounding satellite live frames explode radially outward
      satNodes.forEach(({ spec, el }) => {
        if (!el) return;
        tl.to(
          el,
          {
            xPercent: spec.exitX,
            yPercent: spec.exitY,
            scale: spec.exitScale,
            opacity: 0,
            duration: 0.62,
            ease: 'power2.in',
          },
          0,
        );
      });

      // Phase 1c (0 -> 0.34): Outer framing typography smoothly clears the viewport
      if (hudEl) {
        tl.to(
          hudEl,
          {
            opacity: 0,
            y: -26,
            duration: 0.34,
            ease: 'power2.out',
          },
          0,
        );
      }

      // Phase 2 (0.64 -> 0.92): Full-screen immersive editorial caption & controls rise into view
      if (revealEl) {
        tl.to(
          revealEl,
          {
            opacity: 1,
            y: 0,
            pointerEvents: 'auto',
            duration: 0.28,
            ease: 'power3.out',
          },
          0.64,
        );
      }

      // Gentle hold at 100% full-screen from 0.92 -> 1.0 so the climax breathes before unpinning
      tl.to(coreEl, { scale: 1, duration: 0.08, ease: 'none' }, 0.92);

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
        gsap.set(coreEl, { clearProps: 'all' });
        satNodes.forEach(({ el }) => {
          if (el) gsap.set(el, { clearProps: 'all' });
        });
        if (hudEl) gsap.set(hudEl, { clearProps: 'all' });
        if (revealEl) gsap.set(revealEl, { clearProps: 'all' });
      };
    });

    return () => {
      mm.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="zoom-portal"
      data-testid="zoom-portal-section"
      data-zoom-progress="0.00"
      aria-label="Scroll-driven zoom-in motion cinema portal"
      className="relative z-10 border-t border-[#080a0f]/[0.08]"
    >
      {/* Desktop Pinned Full-Viewport Zoom Stage / Mobile Responsive Cinema Frame */}
      <div
        ref={pinStageRef}
        className="relative lg:h-screen w-full overflow-hidden py-16 lg:py-0 flex items-center justify-center bg-transparent"
      >
        {/* Desktop Outer Framing HUD (clears smoothly as zoom begins) */}
        <div
          ref={hudRef}
          className="hidden lg:flex pointer-events-none absolute inset-x-0 top-[82px] bottom-6 z-20 mx-auto max-w-[1360px] px-8 flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="font-mono-tabular text-[11.5px] font-medium text-[#1b3bf5]">
                01 / SCROLL ZOOM PORTAL
              </p>
              <h2 className="mt-1 font-display text-[26px] xl:text-[28px] font-bold tracking-[-0.03em] text-[#080a0f] leading-[1.06]">
                Keep scrolling to enter the frame.
              </h2>
            </div>

            {/* Interactive Reel Selector (pointer-events-auto so user can swap before zooming) */}
            <div
              role="tablist"
              aria-label="Choose zoom portal reel"
              className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-white/85 backdrop-blur-md p-1 border border-[#080a0f]/[0.1] shadow-sm"
            >
              {PORTAL_REELS.map((reel) => {
                const isSelected = reel.id === activeReel.id;
                return (
                  <button
                    key={reel.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    data-testid={`hero-reel-tab-${reel.id}`}
                    onClick={() => setActiveReelId(reel.id)}
                    className={`relative px-3.5 py-1.5 text-[12px] font-medium rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isSelected
                        ? 'text-white'
                        : 'text-[#3e4656] hover:text-[#080a0f]'
                    }`}
                  >
                    {isSelected && (
                      <motion.span
                        layoutId="zoom-portal-reel-active"
                        transition={SPRING.notch}
                        className="absolute inset-0 rounded-full bg-[#1b3bf5]"
                      />
                    )}
                    <span className="relative z-10">
                      <span className="font-mono-tabular mr-1 opacity-75">
                        {reel.index}
                      </span>
                      <span>{reel.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-end justify-between gap-6">
            <div className="flex items-center gap-3 font-mono-tabular text-[12px] text-[#3e4656]">
              <span>Scroll down to zoom</span>
              <ArrowDown className="w-3.5 h-3.5 text-[#1b3bf5]" aria-hidden="true" />
            </div>

            <div className="flex items-center gap-4">
              <div className="w-32 h-[2px] bg-[#080a0f]/12 overflow-hidden">
                <div
                  ref={progressBarRef}
                  className="h-full w-full bg-[#1b3bf5] origin-left"
                  style={{ transform: 'scaleX(0.04)' }}
                />
              </div>
              <span
                ref={scaleReadoutRef}
                data-testid="zoom-scale-readout"
                className="font-mono-tabular text-[12px] font-semibold text-[#1b3bf5] w-11 text-right"
              >
                100%
              </span>
            </div>
          </div>
        </div>

        {/* Desktop 4 Surrounding Live Satellite Motion Frames (fly radially outward on scroll) */}
        <div
          aria-hidden="true"
          className="hidden lg:block pointer-events-none absolute inset-0 z-10"
        >
          {SATELLITE_FRAMES.map((sat) => (
            <div
              key={sat.id}
              data-zoom-sat={sat.id}
              className={`absolute ${sat.positionClass} rounded-xl overflow-hidden bg-[#080a0f] shadow-[0_24px_60px_-18px_rgba(8,10,15,0.28)] ring-1 ring-[#080a0f]/12 will-change-transform`}
            >
              <video
                data-viewport-video={sat.id}
                src={sat.videoUrl}
                crossOrigin="anonymous"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/75 to-transparent" />
              <span className="absolute bottom-2.5 left-3 font-mono-tabular text-[10.5px] font-medium text-white/90 tracking-[0.02em]">
                {sat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Central Zooming Cinema Portal (43% floating frame -> 100% edge-to-edge full screen on desktop) */}
        <div className="w-full max-w-[1360px] lg:max-w-none px-5 sm:px-8 lg:px-0 lg:absolute lg:inset-0 z-20 flex flex-col">
          {/* Mobile Header & Reel Tabs */}
          <div className="lg:hidden mb-5 flex flex-col gap-3">
            <p className="font-mono-tabular text-[12px] font-medium text-[#1b3bf5]">
              01 / LIVE MOTION PORTAL
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {PORTAL_REELS.map((reel) => {
                const isSelected = reel.id === activeReel.id;
                return (
                  <button
                    key={reel.id}
                    type="button"
                    onClick={() => setActiveReelId(reel.id)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#1b3bf5] text-white'
                        : 'bg-white/85 text-[#3e4656] border border-[#080a0f]/10'
                    }`}
                  >
                    {reel.index} {reel.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            ref={corePortalRef}
            data-testid="zoom-portal-core"
            className="relative w-full aspect-[16/10] lg:aspect-auto lg:w-full lg:h-full rounded-2xl lg:rounded-none overflow-hidden bg-[#080a0f] shadow-[0_32px_90px_-24px_rgba(8,10,15,0.34)] ring-1 ring-[#080a0f]/14 will-change-transform"
          >
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              data-cursor="play"
              data-cursor-label="Watch"
              aria-label={`Open full-screen preview of ${activeReel.label}`}
              className="group relative block w-full h-full text-left cursor-pointer"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeReel.videoUrl}
                  initial={{ opacity: 0.35, scale: 1.03 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    transition: { duration: 0.45, ease: EASE_OUT },
                  }}
                  exit={{
                    opacity: 0.25,
                    transition: { duration: 0.18, ease: EASE_IN },
                  }}
                  className="w-full h-full"
                >
                  <video
                    data-viewport-video="zoom-portal-main"
                    src={activeReel.videoUrl}
                    crossOrigin="anonymous"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              </AnimatePresence>

              {/* High-contrast Bottom Scrim */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#080a0f]/88 via-[#080a0f]/35 to-transparent" />
            </button>

            {/* Full-screen Climax Overlay (fades in smoothly once portal fills viewport on desktop; always visible on mobile) */}
            <div
              ref={revealOverlayRef}
              className="absolute inset-x-0 bottom-0 z-30 p-5 sm:p-8 lg:px-12 lg:pb-11 flex flex-col sm:flex-row sm:items-end justify-between gap-5"
            >
              <div className="max-w-[60ch]">
                <p className="font-mono-tabular text-[11.5px] font-semibold tracking-[0.04em] text-[#7fa2ff] uppercase">
                  {activeReel.index} · {activeReel.label} · {activeReel.category}
                </p>
                <h3 className="mt-1.5 font-display text-[24px] sm:text-[36px] lg:text-[46px] font-bold leading-[1.02] tracking-[-0.03em] text-white">
                  Motion engineered to hold attention.
                </h3>
                <p className="mt-2 text-[14px] sm:text-[15.5px] text-white/80 max-w-[48ch]">
                  {activeReel.caption}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  data-cursor="play"
                  data-cursor-label="Watch"
                  className="btn-tactile inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[13.5px] font-semibold text-[#080a0f] hover:bg-[#1b3bf5] hover:text-white cursor-pointer whitespace-nowrap shadow-lg"
                >
                  <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                  <span>Watch full reel</span>
                </button>
                <a
                  href="#pricing"
                  className="btn-tactile inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-[#080a0f]/55 backdrop-blur-md px-5 py-2.5 text-[13.5px] font-medium text-white hover:border-white/60 whitespace-nowrap"
                >
                  <span>See studio plans</span>
                  <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Reel Lightbox */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.22 } }}
            exit={{ opacity: 0, transition: { duration: 0.16, ease: EASE_IN } }}
            className="fixed inset-0 z-50 bg-[#080a0f]/86 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label={`${activeReel.label} full-screen reel`}
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0, transition: SPRING.smooth }}
              exit={{
                opacity: 0,
                scale: 0.96,
                y: 8,
                transition: { duration: 0.16, ease: EASE_IN },
              }}
              className="w-full max-w-[1040px] rounded-2xl bg-white overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-video w-full max-h-[68vh] bg-[#080a0f]">
                <video
                  src={activeReel.videoUrl}
                  crossOrigin="anonymous"
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  aria-label="Close reel preview"
                  className="btn-tactile absolute top-3.5 right-3.5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-[13px] font-medium text-[#080a0f] hover:bg-white shadow-md cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                  <span>Close</span>
                </button>
              </div>
              <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-mono-tabular text-[12px] font-medium text-[#647087]">
                    Featured Showreel · {activeReel.index} / 04 · {activeReel.category}
                  </p>
                  <h3 className="font-display text-[22px] font-bold text-[#080a0f] mt-0.5">
                    {activeReel.label}
                  </h3>
                </div>
                <button
                  type="button"
                  data-cursor="action"
                  onClick={() =>
                    openWhatsAppChat(
                      `Hi Sai Charan, I watched your "${activeReel.label}" showreel and would love to discuss building a website with this level of polish.`,
                    )
                  }
                  className="btn-tactile inline-flex items-center justify-center gap-1.5 rounded-full bg-[#080a0f] px-5 py-2.5 text-[13.5px] font-medium text-white hover:bg-[#1b3bf5] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Discuss your website</span>
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
