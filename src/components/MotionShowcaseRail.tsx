import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Play, X } from 'lucide-react';
import { openWhatsAppChat } from '../utils/contact';
import { EASE_IN, SPRING } from '../utils/motion';
import { LivingArchiveStrip } from './LivingArchiveStrip';

gsap.registerPlugin(ScrollTrigger);

interface MotionPillar {
  index: string;
  tag: string;
  tierLabel: string;
  price: string;
  title: string;
  summary: string;
  metric: string;
  videoUrl: string;
  studyName: string;
}

const MOTION_PILLARS: MotionPillar[] = [
  {
    index: '01',
    tag: 'Website + SEO',
    tierLabel: 'Beacon',
    price: '₹25,000',
    title: 'Clean business sites built to rank and convert.',
    summary:
      'Custom typography, local keyword research, structured schema, and fast load times, ready in 5 days.',
    metric: '5-day launch',
    videoUrl:
      'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/a/obsisidianArea.mp4',
    studyName: 'Obsidian Editorial Hero',
  },
  {
    index: '02',
    tag: 'Scroll Motion',
    tierLabel: 'Pulse',
    price: '₹60,000',
    title: 'Scroll-driven storytelling and AI search setup.',
    summary:
      'Smooth scroll transitions, custom animations, and structured GEO and AEO content for Google, ChatGPT, and Gemini.',
    metric: '7-day launch',
    videoUrl:
      'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/glaze-motion.mp4',
    studyName: 'Glaze Scroll Study',
  },
  {
    index: '03',
    tag: 'Interactive 3D',
    tierLabel: 'Pulse',
    price: '₹60,000',
    title: 'Interactive visuals people actually remember.',
    summary:
      'Responsive cursor motion, lightweight 3D scenes, and product reels tailored around what makes your brand distinct.',
    metric: 'Smooth on desktop & mobile',
    videoUrl:
      'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/stellarmind-hero.mp4',
    studyName: 'Stellarmind Scene',
  },
  {
    index: '04',
    tag: 'Online Store',
    tierLabel: 'Atlas',
    price: '₹90,000',
    title: 'Storefronts designed to take orders cleanly.',
    summary:
      'Product catalogues, interactive garment and variant previews, Razorpay checkout, shipping and tax rules, and an admin panel.',
    metric: 'No monthly platform lock-in',
    videoUrl:
      'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/try-the-look-hero.mp4',
    studyName: 'Try The Look Storefront',
  },
];

/**
 * Scroll-pinned horizontal motion showcase rail (desktop >=1024px) with
 * velocity-reactive editorial card skew, live progress counter, and spring-physics
 * fullscreen lightbox. Stacks cleanly on mobile & reduced motion.
 */
export function MotionShowcaseRail() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const [activeSlide, setActiveSlide] = useState(1);
  const [modalItem, setModalItem] = useState<MotionPillar | null>(null);

  useEffect(() => {
    if (!modalItem) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalItem(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalItem]);

  useEffect(() => {
    if (!pinRef.current || !trackRef.current) return;

    const mm = gsap.matchMedia();

    mm.add('(min-width: 1024px)', () => {
      const pinEl = pinRef.current!;
      const trackEl = trackRef.current!;
      const barEl = progressBarRef.current;

      const getTravelDistance = () =>
        Math.max(0, trackEl.scrollWidth - window.innerWidth + 96);

      const cards = gsap.utils.toArray<HTMLElement>(
        '[data-rail-card]',
        trackEl,
      );

      const tween = gsap.to(trackEl, {
        x: () => -getTravelDistance(),
        ease: 'none',
        scrollTrigger: {
          trigger: pinEl,
          start: 'top top',
          end: () => `+=${Math.max(900, getTravelDistance() * 1.15)}`,
          pin: true,
          scrub: 0.75,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            const idx = Math.min(
              MOTION_PILLARS.length,
              Math.max(
                1,
                Math.round(self.progress * (MOTION_PILLARS.length - 1)) + 1,
              ),
            );
            setActiveSlide(idx);

            if (barEl) {
              barEl.style.transform = `scaleX(${Math.max(0.06, self.progress)})`;
            }

            const vel = Math.max(-5, Math.min(5, self.getVelocity() / 420));
            gsap.to(cards, {
              skewX: -vel,
              duration: 0.35,
              ease: 'power2.out',
              overwrite: 'auto',
            });
          },
        },
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        gsap.set(cards, { clearProps: 'skewX' });
      };
    });

    return () => {
      mm.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="craft"
      data-testid="horizontal-motion-rail"
      aria-label="Signature motion and build showcase"
      className="relative z-10 bg-[#080a0f] text-[#f3f6fb] border-t border-white/[0.08] overflow-x-clip"
    >
      <div
        ref={pinRef}
        className="lg:min-h-screen flex flex-col justify-center py-20 lg:pt-24 lg:pb-8"
      >
        {/* Top Stage Header Bar */}
        <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 mb-7 lg:mb-7 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="font-mono-tabular text-[12px] font-medium tracking-[0.04em] text-[#9ec5ff]">
              SELECTED WORK · SCROLL TO EXPLORE
            </p>
            <h2
              data-cursor="text"
              className="mt-2 font-display text-[32px] sm:text-[44px] lg:text-[52px] font-bold leading-[1.02] tracking-[-0.036em] text-[#f3f6fb]"
            >
              What your brand can feel like.
            </h2>
          </div>

          <div className="hidden lg:flex items-center gap-5 shrink-0 pb-1">
            <span className="font-mono-tabular text-[13px] text-white/65">
              {String(activeSlide).padStart(2, '0')} /{' '}
              {String(MOTION_PILLARS.length).padStart(2, '0')}
            </span>
            <div className="w-36 h-[2px] bg-white/15 overflow-hidden">
              <div
                ref={progressBarRef}
                className="h-full w-full bg-[#4f7cff] origin-left"
                style={{ transform: 'scaleX(0.08)' }}
              />
            </div>
          </div>
        </div>

        {/* Horizontal Track on Desktop / Clean Vertical Grid on Mobile */}
        <div className="w-full overflow-visible">
          <div
            ref={trackRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:flex-nowrap gap-6 lg:gap-8 px-5 sm:px-8 lg:pl-[max(2rem,calc((100vw-1360px)/2+2rem))] lg:pr-24 will-change-transform"
          >
            {MOTION_PILLARS.map((item) => (
              <article
                key={item.index}
                data-rail-card
                className="lg:w-[540px] xl:w-[580px] lg:shrink-0 rounded-2xl bg-[#10141f] border border-white/[0.1] overflow-hidden flex flex-col justify-between"
              >
                <button
                  type="button"
                  onClick={() => setModalItem(item)}
                  data-cursor="play"
                  data-cursor-label="Watch"
                  aria-label={`Watch ${item.studyName} full screen`}
                  className="group relative block aspect-[16/9] w-full overflow-hidden bg-[#06080d] text-left cursor-pointer"
                >
                  <video
                    data-viewport-video={`rail-${item.index}`}
                    src={item.videoUrl}
                    crossOrigin="anonymous"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Play
                        className="w-3.5 h-3.5 text-white/90 fill-current shrink-0"
                        aria-hidden="true"
                      />
                      <span className="font-display text-[20px] font-semibold text-white truncate drop-shadow-sm">
                        {item.studyName}
                      </span>
                    </div>
                    <span className="font-mono-tabular font-medium text-[13px] text-white/85 shrink-0 drop-shadow-sm">
                      {item.price}
                    </span>
                  </div>
                </button>

                <div className="p-5 sm:p-6 flex flex-col justify-between flex-1">
                  <div>
                    <p className="font-mono-tabular text-[12px] text-[#9ec5ff]/85">
                      {item.tierLabel} · {item.tag} · {item.metric}
                    </p>
                    <h3 className="mt-2 font-display text-[22px] sm:text-[24px] font-bold leading-[1.14] tracking-[-0.025em] text-[#f3f6fb]">
                      {item.title}
                    </h3>
                    <p className="mt-2.5 text-[14px] leading-relaxed text-white/70">
                      {item.summary}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/[0.1] flex items-center justify-between gap-4">
                    <a
                      href="#pricing"
                      className="editorial-link text-[13px] font-medium text-white/75 hover:text-[#9ec5ff] transition-colors"
                    >
                      View full scope
                    </a>
                    <button
                      type="button"
                      data-cursor="action"
                      onClick={() =>
                        openWhatsAppChat(
                          `Hi Sai Charan, I loved the "${item.studyName}" style (${item.tierLabel} — ${item.price}) and want to build something similar.`,
                        )
                      }
                      className="btn-tactile inline-flex items-center gap-1.5 rounded-full bg-[#1b3bf5] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#4f7cff] cursor-pointer whitespace-nowrap"
                    >
                      <span>Build this style</span>
                      <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* Sunlit Optical Interaction Archive */}
      <div className="bg-white/86 backdrop-blur-xs text-[#080a0f] py-20 sm:py-28 border-t border-[#080a0f]/[0.09]">
        <div className="mx-auto max-w-[1360px] px-5 sm:px-8">
          <LivingArchiveStrip />
        </div>
      </div>

      {/* Fullscreen Lightbox (motion/react Spring Physics) */}
      <AnimatePresence>
        {modalItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.16, ease: EASE_IN } }}
            className="fixed inset-0 z-50 bg-[#0a0a0a]/86 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label={`${modalItem.studyName} full screen preview`}
            onClick={() => setModalItem(null)}
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
              className="w-full max-w-[1040px] rounded-2xl bg-[#ffffff] text-[#0a0a0a] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-video w-full max-h-[68vh] bg-[#0a0a0a]">
                <video
                  src={modalItem.videoUrl}
                  crossOrigin="anonymous"
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => setModalItem(null)}
                  aria-label="Close motion preview"
                  className="btn-tactile absolute top-3.5 right-3.5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-[13px] font-medium text-[#0a0a0a] hover:bg-white shadow-md cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                  <span>Close</span>
                </button>
              </div>
              <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-mono-tabular text-[12px] font-medium text-[#6b6b68]">
                    {modalItem.tierLabel} · {modalItem.price}
                  </p>
                  <h3 className="font-display text-[22px] font-semibold text-[#0a0a0a] mt-0.5">
                    {modalItem.studyName}
                  </h3>
                </div>
                <button
                  type="button"
                  data-cursor="action"
                  onClick={() =>
                    openWhatsAppChat(
                      `Hi Sai Charan, I watched "${modalItem.studyName}" (${modalItem.tierLabel} — ${modalItem.price}) and want to discuss a website like this.`,
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
    </section>
  );
}
