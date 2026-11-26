import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDown, ArrowUpRight, MessageCircle } from 'lucide-react';
import { DESIGNER_NAME, openWhatsAppChat } from '../utils/contact';
import { EASE_IN, EASE_OUT, REEL_HOLD_MS } from '../utils/motion';

const KINETIC_PHRASES = [
  'unmistakable.',
  'built to sell.',
  'crafted by hand.',
];

const HERO_PREVIEW_VIDEO =
  'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/facet-glass-hero.mp4';

const PROOF_METRICS = [
  { value: '3–7 days', label: 'Typical launch timeline' },
  { value: '₹2,500', label: 'Lock-in to start your build' },
  { value: '1 month', label: 'Free maintenance after launch' },
  { value: '100%', label: 'Source & domain ownership yours' },
];

function formatIndiaTime(): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date());
  } catch {
    return 'IST';
  }
}

export function HeroSection() {
  const [studioTime, setStudioTime] = useState<string>(() => formatIndiaTime());
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStudioTime(formatIndiaTime());
    }, 30000);
    return () => window.clearInterval(id);
  }, []);

  // Kinetic word-swap loop honoring reading-hold duration
  useEffect(() => {
    const timer = window.setInterval(() => {
      setPhraseIdx((i) => (i + 1) % KINETIC_PHRASES.length);
    }, REEL_HOLD_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section
      id="top"
      className="relative z-10 min-h-[calc(100vh-68px)] flex flex-col justify-between pt-8 sm:pt-12 lg:pt-14 pb-10 sm:pb-14 bg-transparent"
    >
      <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 flex-1 flex flex-col justify-between">
        {/* Top Metadata Baseline */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#080a0f]/[0.1] text-[13px] text-[#556075]">
          <p className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
            <span className="font-semibold text-[#080a0f]">{DESIGNER_NAME}</span>
            <span className="text-[#080a0f]/25" aria-hidden="true">
              /
            </span>
            <span>Independent Website Designer, Motion &amp; SEO Studio</span>
          </p>
          <p className="font-mono-tabular text-[12px] text-[#3e4656]">
            India · {studioTime} IST
          </p>
        </div>

        {/* Monumental Syne Sculptural Opening Composition over Living Caustic Light Field */}
        <div className="my-auto py-8 sm:py-12 lg:py-14 grid grid-cols-1 lg:grid-cols-12 gap-9 lg:gap-10 items-end">
          <div className="lg:col-span-8">
            <p className="font-mono-tabular text-[12px] font-medium tracking-[0.04em] text-[#1b3bf5] mb-4">
              DESIGN · SCROLL MOTION · SEO / GEO / AEO · E-COMMERCE
            </p>
            <h1
              data-cursor="text"
              className="font-display text-[36px] sm:text-[52px] lg:text-[64px] xl:text-[74px] font-bold leading-[1.01] tracking-[-0.036em] text-[#080a0f]"
            >
              <span className="reveal-mask">
                <span data-hero-line className="reveal-line">
                  Websites that feel
                </span>
              </span>
              <span className="block relative overflow-hidden h-[1.18em] mt-1">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={KINETIC_PHRASES[phraseIdx]}
                    initial={{ y: '104%', opacity: 0.01 }}
                    animate={{
                      y: '0%',
                      opacity: 1,
                      transition: { duration: 0.56, ease: EASE_OUT },
                    }}
                    exit={{
                      y: '-104%',
                      opacity: 0,
                      transition: { duration: 0.28, ease: EASE_IN },
                    }}
                    className="block whitespace-nowrap text-[#1b3bf5]"
                  >
                    {KINETIC_PHRASES[phraseIdx]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </h1>

            <p className="mt-7 text-[16px] sm:text-[17.5px] leading-[1.64] text-[#3e4656] max-w-[54ch]">
              I design and engineer fast, motion-crafted websites, Google &amp;
              AI search foundations (SEO, GEO &amp; AEO), and complete online
              stores—launched in 3 to 7 days with a live working demo before you
              pay half.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-5">
              <button
                type="button"
                onClick={() =>
                  openWhatsAppChat(
                    'Hi Sai Charan, I would like to discuss building a website for my business.',
                  )
                }
                data-testid="hero-contact-whatsapp"
                data-magnetic-cta
                data-cursor="action"
                className="btn-tactile inline-flex items-center gap-2 rounded-full bg-[#080a0f] px-6 py-3.5 text-[14px] font-medium text-white hover:bg-[#1b3bf5] whitespace-nowrap shrink-0 cursor-pointer shadow-[0_14px_30px_-12px_rgba(27,59,245,0.45)]"
              >
                <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Start on WhatsApp</span>
                <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </button>

              <a
                href="#pricing"
                className="editorial-link inline-flex items-center gap-1.5 py-2 text-[14.5px] font-semibold text-[#080a0f] hover:text-[#1b3bf5] whitespace-nowrap shrink-0 transition-colors"
              >
                <span>Plans from ₹15,000</span>
                <ArrowDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              </a>

              <a
                href="#zoom-portal"
                className="editorial-link hidden sm:inline-flex items-center gap-1.5 py-2 text-[14px] font-medium text-[#3e4656] hover:text-[#1b3bf5] whitespace-nowrap shrink-0 transition-colors"
              >
                <span>Scroll zoom showreel</span>
                <ArrowDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Asymmetric Right Optical Motion Plate Teasing the Zoom-In Portal Below */}
          <div className="lg:col-span-4 lg:pb-1">
            <a
              href="#zoom-portal"
              data-cursor="preview"
              data-cursor-label="Zoom"
              className="group block rounded-2xl overflow-hidden bg-[#080a0f] studio-frame transition-transform duration-500 ease-out hover:-translate-y-1"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <video
                  data-viewport-video="hero-teaser"
                  src={HERO_PREVIEW_VIDEO}
                  crossOrigin="anonymous"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#080a0f]/80 to-transparent" />
                <span className="absolute bottom-3 left-3.5 font-mono-tabular text-[11px] font-medium text-white/90">
                  Live Reel · Facet Glass 3D
                </span>
              </div>
              <div className="px-4 py-3.5 bg-white/95 backdrop-blur-md flex items-center justify-between gap-3 border-t border-[#080a0f]/[0.08]">
                <span className="text-[13px] font-semibold text-[#080a0f]">
                  Scroll down to zoom into full screen
                </span>
                <ArrowDown
                  className="w-4 h-4 text-[#1b3bf5] shrink-0 transition-transform duration-300 group-hover:translate-y-0.5"
                  aria-hidden="true"
                />
              </div>
            </a>
          </div>
        </div>

        {/* Full-Width Architectural Proof Bar */}
        <div className="border-y border-[#080a0f]/[0.11] bg-white/55 backdrop-blur-xs grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#080a0f]/[0.1]">
          {PROOF_METRICS.map((item, idx) => (
            <div
              key={item.label}
              className={`py-5 ${
                idx === 0
                  ? 'lg:pr-6 lg:pl-4'
                  : idx === PROOF_METRICS.length - 1
                    ? 'lg:pl-6 lg:pr-4'
                    : 'lg:px-6'
              } ${idx % 2 === 1 ? 'pl-5 lg:pl-6' : 'pr-4 pl-2 lg:pl-6'}`}
            >
              <p className="font-display text-[26px] sm:text-[32px] font-bold leading-none tracking-[-0.03em] text-[#080a0f] tabular-nums">
                {item.value}
              </p>
              <p className="mt-1.5 text-[13px] text-[#556075] leading-snug">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
