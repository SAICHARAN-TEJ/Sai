import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, X } from 'lucide-react';
import { openWhatsAppChat } from '../utils/contact';
import { EASE_IN, SPRING } from '../utils/motion';
import type { ShowcaseProject } from '../utils/projects';
import { SphereGalleryEngine } from '../webgl/SphereGalleryEngine';

export function SphereFinaleSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<SphereGalleryEngine | null>(null);

  const [shouldMount, setShouldMount] = useState(false);
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState<ShowcaseProject | null>(null);
  const [zoomed, setZoomed] = useState<ShowcaseProject | null>(null);
  const [overviewOpen, setOverviewOpen] = useState(false);

  // Lazy-mount WebGL sphere when approaching the finale & pause when scrolled away
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const mountObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldMount(true);
          mountObserver.disconnect();
        }
      },
      { rootMargin: '180px 0px 180px 0px' },
    );

    const activeObserver = new IntersectionObserver(
      (entries) => {
        setInView(entries.some((e) => e.isIntersecting));
      },
      { rootMargin: '40px 0px 40px 0px' },
    );

    mountObserver.observe(el);
    activeObserver.observe(el);

    return () => {
      mountObserver.disconnect();
      activeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!shouldMount || !mountRef.current || engineRef.current) return;

    const engine = new SphereGalleryEngine(mountRef.current, {
      backgroundColor: 0xe8eef8,
      placeholderColor: 0xd4dfef,
      onHoverChange: (project) => setHovered(project),
      onZoomChange: (project, open) => {
        setZoomed(project);
        setOverviewOpen(open);
      },
    });
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [shouldMount]);

  useEffect(() => {
    engineRef.current?.setActive(inView);
  }, [inView]);

  return (
    <section
      ref={sectionRef}
      id="showreel"
      aria-label="Interactive 3D website showreel sphere"
      className="relative z-10 py-24 sm:py-32 border-t border-[#080a0f]/[0.09] bg-white/82 backdrop-blur-xs"
    >
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8">
        <div
          data-reveal-block
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-end"
        >
          <div className="lg:col-span-7">
            <p className="font-mono-tabular text-[12px] font-medium tracking-[0.04em] text-[#1b3bf5]">
              INTERACTIVE 3D SHOWREEL
            </p>
            <h2 className="mt-3 font-display text-[36px] sm:text-[50px] font-bold leading-[1.03] tracking-[-0.036em] text-[#080a0f] text-balance">
              <span className="reveal-mask">
                <span data-reveal-line className="reveal-line">
                  Spin through twenty live
                </span>
              </span>
              <span className="reveal-mask">
                <span data-reveal-line className="reveal-line text-[#1b3bf5]">
                  interaction styles.
                </span>
              </span>
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-[15px] leading-[1.66] text-[#3e4656] max-w-[42ch]">
              Drag anywhere on the sphere to explore motion, retail, and 3D
              concepts. Click any preview to expand it and let me know what
              catches your eye.
            </p>
          </div>
        </div>

        {/* Optical Glacial Stone 3D Sphere Stage */}
        <div
          data-zoom-stage="sphere-finale"
          data-cursor="drag"
          data-cursor-label="Drag"
          className="zoom-stage relative mt-12 h-[520px] sm:h-[620px] w-full rounded-2xl overflow-hidden bg-[#e8eef8] studio-frame"
        >
          <div ref={mountRef} className="absolute inset-0 w-full h-full" />

          {/* Quiet Unboxed Bottom Caption */}
          {!zoomed && (
            <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center px-4 z-10">
              {hovered ? (
                <div className="flex items-baseline gap-2.5 bg-white/92 px-4 py-1.5 rounded-md shadow-xs">
                  <span className="text-[13.5px] font-semibold text-[#080a0f]">
                    {hovered.title}
                  </span>
                  <span className="text-[12.5px] text-[#1b3bf5]">
                    {hovered.category}
                  </span>
                </div>
              ) : (
                <p className="text-[12.5px] font-medium text-[#3e4656]">
                  Drag to spin · Click any preview to zoom in
                </p>
              )}
            </div>
          )}

          {/* Zoomed Quick Bar */}
          {zoomed && !overviewOpen && (
            <div className="absolute inset-x-0 bottom-5 flex justify-center px-4 z-20">
              <div className="flex items-center gap-3 rounded-full bg-[#ffffff]/96 border border-black/[0.12] px-4 py-2 shadow-lg">
                <span className="text-[14px] font-semibold text-[#0a0a0a]">
                  {zoomed.title}
                </span>
                <span className="text-black/25" aria-hidden="true">
                  /
                </span>
                <button
                  type="button"
                  onClick={() => engineRef.current?.toggleOverview()}
                  className="text-[13px] font-semibold text-[#1b3bf5] hover:text-[#122bc9] cursor-pointer"
                >
                  Read details
                </button>
                <button
                  type="button"
                  onClick={() => engineRef.current?.closeZoom()}
                  aria-label="Close expanded preview"
                  className="ml-1 inline-flex items-center justify-center rounded-full bg-[#eaeae6] p-1 text-[#0a0a0a] hover:bg-[#dcdcd6] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {/* Expanded Overview Card (motion/react Spring Physics) */}
          <AnimatePresence>
            {zoomed && overviewOpen && (
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: SPRING.smooth,
                }}
                exit={{
                  opacity: 0,
                  y: 10,
                  scale: 0.96,
                  transition: { duration: 0.16, ease: EASE_IN },
                }}
                className="absolute inset-x-0 bottom-5 px-4 flex justify-center z-20"
                role="dialog"
                aria-label={`${zoomed.title} overview`}
              >
                <div className="w-full max-w-[580px] rounded-2xl bg-[#ffffff]/98 border border-black/[0.12] p-5 sm:p-6 shadow-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-[21px] font-semibold text-[#0a0a0a]">
                        {zoomed.title}
                      </h3>
                      <p className="font-mono-tabular text-[12px] text-[#6b6b68] mt-0.5">
                        {zoomed.category} · {zoomed.year}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => engineRef.current?.closeZoom()}
                      className="btn-tactile inline-flex items-center gap-1 rounded-full bg-[#eaeae6] px-3 py-1.5 text-[12px] font-medium text-[#0a0a0a] hover:bg-[#dcdcd6] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Close</span>
                    </button>
                  </div>

                  <p className="mt-3 text-[14.5px] leading-relaxed text-[#444442]">
                    {zoomed.description}
                  </p>

                  <div className="mt-4 pt-3.5 border-t border-black/[0.09] flex flex-wrap items-center justify-between gap-3">
                    <a
                      href="#pricing"
                      onClick={() => engineRef.current?.closeZoom()}
                      className="editorial-link text-[13px] font-medium text-[#444442] hover:text-[#0a0a0a]"
                    >
                      See pricing plans
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        openWhatsAppChat(
                          `Hi Sai Charan, I spotted "${zoomed.title}" (${zoomed.category}) in your 3D showreel and would like to build something similar.`,
                        )
                      }
                      className="btn-tactile inline-flex items-center gap-1.5 rounded-full bg-[#080a0f] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#1b3bf5] cursor-pointer"
                    >
                      <span>Build something like this</span>
                      <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
