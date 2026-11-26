import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Play, X } from 'lucide-react';
import { openWhatsAppChat } from '../utils/contact';
import { EASE_IN, SPRING } from '../utils/motion';
import { SHOWCASE_PROJECTS, type ShowcaseProject } from '../utils/projects';

const CURATED_SLUGS = [
  'aaaf/glaze-motion',
  'aaaf/vell-lookbook',
  'aaaf/reelmark-hero-interaction',
  'designs/saffron-3d-webgl-landing',
  'aaaf/clothing-rail-hero',
  'aaaf/kinestra-card-story-v2',
];

const CURATED_STUDIES: ShowcaseProject[] = CURATED_SLUGS.map((slug) =>
  SHOWCASE_PROJECTS.find((item) => item.slug === slug),
).filter((item): item is ShowcaseProject => Boolean(item));

/**
 * Interactive Swiss index of live motion & web studies right inside the homepage:
 * gliding across rows reveals a spring-damped, velocity-tilting floating live
 * video preview on desktop, and clicking opens a spring-physics fullscreen modal.
 */
export function LivingArchiveStrip() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previewCardRef = useRef<HTMLDivElement | null>(null);

  const [hovered, setHovered] = useState<ShowcaseProject | null>(null);
  const [selected, setSelected] = useState<ShowcaseProject | null>(null);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selected]);

  useEffect(() => {
    const fineDesktop = window.matchMedia(
      '(min-width: 1024px) and (pointer: fine)',
    ).matches;
    const container = containerRef.current;
    const card = previewCardRef.current;
    if (!fineDesktop || !container || !card) return;

    const xTo = gsap.quickTo(card, 'x', { duration: 0.34, ease: 'power3.out' });
    const yTo = gsap.quickTo(card, 'y', { duration: 0.34, ease: 'power3.out' });
    const rotTo = gsap.quickTo(card, 'rotation', {
      duration: 0.42,
      ease: 'power3.out',
    });

    let lastX = 0;

    const onPointerMove = (event: PointerEvent) => {
      const dx = event.clientX - lastX;
      lastX = event.clientX;
      const tilt = Math.max(-7, Math.min(7, dx * 0.25));

      const cardW = 308;
      const cardH = 194;
      const desiredX = Math.min(
        window.innerWidth - cardW - 24,
        event.clientX + 56,
      );
      const desiredY = Math.max(
        84,
        Math.min(window.innerHeight - cardH - 24, event.clientY - cardH / 2),
      );

      xTo(desiredX);
      yTo(desiredY);
      rotTo(tilt);
    };

    container.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => {
      container.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      data-testid="living-archive"
      className="relative"
      onPointerLeave={() => setHovered(null)}
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-[#080a0f]/[0.11]">
        <div>
          <p className="font-mono-tabular text-[12px] font-medium tracking-[0.04em] text-[#1b3bf5]">
            INTERACTIVE STUDIES
          </p>
          <h3 className="mt-2 font-display text-[28px] sm:text-[38px] font-bold leading-[1.06] tracking-[-0.032em] text-[#080a0f]">
            Six live interaction studies.
          </h3>
        </div>
        <p className="text-[14px] text-[#3e4656] max-w-[38ch]">
          Hover on desktop or tap any study to watch in full screen. Any of
          these can be tailored into your build.
        </p>
      </div>

      <ul className="divide-y divide-[#080a0f]/[0.09]">
        {CURATED_STUDIES.map((study, idx) => {
          const isRowHovered = hovered?.slug === study.slug;
          return (
            <li key={study.slug}>
              <button
                type="button"
                data-cursor="preview"
                data-cursor-label="View"
                data-testid={`archive-row-${idx + 1}`}
                onMouseEnter={() => setHovered(study)}
                onFocus={() => setHovered(study)}
                onClick={() => setSelected(study)}
                className="group w-full py-5 sm:py-6 text-left grid grid-cols-12 items-center gap-3 sm:gap-6 transition-colors duration-200 hover:bg-[#f3f6fb] px-2 sm:px-4 -mx-2 sm:-mx-4 cursor-pointer"
              >
                <span className="col-span-2 sm:col-span-1 font-mono-tabular text-[12px] text-[#556075] group-hover:text-[#1b3bf5] transition-colors">
                  {String(idx + 1).padStart(2, '0')}
                </span>

                <span className="col-span-7 sm:col-span-5 font-display text-[22px] sm:text-[28px] font-bold leading-none tracking-[-0.028em] text-[#080a0f] transition-transform duration-300 ease-out group-hover:translate-x-2 group-hover:text-[#1b3bf5]">
                  {study.title}
                </span>

                <span className="hidden md:block md:col-span-4 text-[14px] text-[#3e4656] truncate">
                  {study.description}
                </span>

                <span className="col-span-3 sm:col-span-6 md:col-span-2 flex items-center justify-end gap-3 text-[13px] text-[#556075]">
                  <span className="hidden sm:inline">{study.category}</span>
                  <span
                    aria-hidden="true"
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-200 ${
                      isRowHovered
                        ? 'bg-[#1b3bf5] border-[#1b3bf5] text-white translate-x-0.5 -translate-y-0.5'
                        : 'border-[#080a0f]/[0.15] text-[#080a0f]'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Floating Desktop Spring-Damped Live Video Preview Lens */}
      <div
        ref={previewCardRef}
        data-testid="floating-preview"
        aria-hidden="true"
        className={`hidden lg:block pointer-events-none fixed top-0 left-0 z-50 w-[308px] rounded-xl overflow-hidden bg-[#0a0a0a] shadow-[0_28px_64px_-18px_rgba(10,10,10,0.45)] ring-1 ring-black/15 transition-opacity duration-200 ${
          hovered ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ willChange: 'transform, opacity' }}
      >
        <div className="relative aspect-[16/10] w-full bg-[#0a0a0a] overflow-hidden">
          {hovered && (
            <video
              key={hovered.videoUrl}
              src={hovered.videoUrl}
              crossOrigin="anonymous"
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          )}
        </div>
        {hovered && (
          <div className="px-4 py-2.5 bg-[#ffffff] flex items-center justify-between gap-2 text-[12px]">
            <span className="font-semibold text-[#080a0f] truncate">
              {hovered.title}
            </span>
            <span className="text-[#1b3bf5] font-medium shrink-0 flex items-center gap-1">
              <Play className="w-3 h-3 fill-current" />
              Preview
            </span>
          </div>
        )}
      </div>

      {/* Fullscreen Study Lightbox (motion/react Spring Physics) */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.16, ease: EASE_IN } }}
            className="fixed inset-0 z-50 bg-[#0a0a0a]/82 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label={`${selected.title} live preview`}
            onClick={() => setSelected(null)}
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
              className="w-full max-w-[1040px] rounded-2xl bg-[#ffffff] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-video w-full max-h-[66vh] bg-[#0a0a0a]">
                <video
                  src={selected.videoUrl}
                  crossOrigin="anonymous"
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Close study preview"
                  className="btn-tactile absolute top-3.5 right-3.5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-[13px] font-medium text-[#0a0a0a] hover:bg-white shadow-md cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                  <span>Close</span>
                </button>
              </div>
              <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-mono-tabular text-[12px] font-medium text-[#6b6b68]">
                    {selected.category} · {selected.year}
                  </p>
                  <h3 className="font-display text-[22px] font-semibold text-[#0a0a0a] mt-0.5">
                    {selected.title}
                  </h3>
                  <p className="mt-1 text-[14px] text-[#444442] max-w-[56ch]">
                    {selected.description}
                  </p>
                </div>
                <button
                  type="button"
                  data-cursor="action"
                  onClick={() =>
                    openWhatsAppChat(
                      `Hi Sai Charan, I loved the "${selected.title}" (${selected.category}) interaction study and want to build something similar.`,
                    )
                  }
                  className="btn-tactile inline-flex items-center justify-center gap-1.5 rounded-full bg-[#080a0f] px-5 py-2.5 text-[13.5px] font-medium text-white hover:bg-[#1b3bf5] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Commission this style</span>
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
