import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { MotionConfig } from 'motion/react';
import { AnswerEngineFaqSection } from './components/AnswerEngineFaqSection';
import { ChromaticPrismBackdrop } from './components/ChromaticPrismBackdrop';
import { ClosingFooter } from './components/ClosingFooter';
import { EditorialManifesto } from './components/EditorialManifesto';
import { HeroSection } from './components/HeroSection';
import { IntroCurtain } from './components/IntroCurtain';
import { MotionShowcaseRail } from './components/MotionShowcaseRail';
import { PricingSection } from './components/PricingSection';
import { ProcessSection } from './components/ProcessSection';
import { SeoHeadManager } from './components/SeoHeadManager';
import { SphereFinaleSection } from './components/SphereFinaleSection';
import { StudioCursor } from './components/StudioCursor';
import { TopBar } from './components/TopBar';
import { VelocityMarquee } from './components/VelocityMarquee';
import { ZoomPortalShowcase } from './components/ZoomPortalShowcase';
import { attachMagneticCtas } from './utils/magnetic';
import { observeViewportVideos } from './utils/viewportVideo';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const pageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!pageRef.current) return;
    return observeViewportVideos(pageRef.current);
  }, []);

  useEffect(() => {
    if (!pageRef.current) return;

    const detachMagnetic = attachMagneticCtas(pageRef.current);

    const lenis = new Lenis({
      duration: 1.12,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.15,
    });

    const onLenisScroll = (instance: { velocity?: number }) => {
      ScrollTrigger.update();
      if (typeof instance?.velocity === 'number') {
        window.dispatchEvent(
          new CustomEvent('studio:scroll-velocity', {
            detail: { velocity: instance.velocity },
          }),
        );
      }
    };
    lenis.on('scroll', onLenisScroll);

    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    const onAnchorClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!anchor) return;
      const hash = anchor.getAttribute('href');
      if (!hash || hash === '#') return;
      const dest = document.querySelector<HTMLElement>(hash);
      if (!dest) return;
      event.preventDefault();
      lenis.scrollTo(dest, { offset: hash === '#zoom-portal' ? 0 : -64, duration: 1.1 });
    };
    document.addEventListener('click', onAnchorClick);

    const ctx = gsap.context(() => {
      // 1. Top reading-progress hairline
      const progressEl = document.querySelector<HTMLElement>(
        '[data-scroll-progress]',
      );
      if (progressEl) {
        gsap.fromTo(
          progressEl,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: document.documentElement,
              start: 'top top',
              end: 'bottom bottom',
              scrub: 0.15,
            },
          },
        );
      }

      // 2. Hero opening curtain — crisp masked line rise
      const heroLines = gsap.utils.toArray<HTMLElement>('[data-hero-line]');
      if (heroLines.length > 0) {
        gsap.fromTo(
          heroLines,
          { yPercent: 108, opacity: 0.01 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.85,
            stagger: 0.08,
            ease: 'power4.out',
            clearProps: 'transform,opacity',
          },
        );
      }

      // 3. Scroll-triggered masked editorial headings for downstream chapters
      const revealBlocks = gsap.utils.toArray<HTMLElement>('[data-reveal-block]');
      revealBlocks.forEach((block) => {
        const lines = block.querySelectorAll<HTMLElement>('[data-reveal-line]');
        if (lines.length === 0) return;
        gsap.fromTo(
          lines,
          { yPercent: 100, opacity: 0.01 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.08,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
            scrollTrigger: {
              trigger: block,
              start: 'top 86%',
              once: true,
            },
          },
        );
      });

      // 3b. Word-by-word scrubbed illumination in the Editorial Manifesto
      const manifestoSection = document.querySelector<HTMLElement>(
        '[data-manifesto-section]',
      );
      const manifestoWords = gsap.utils.toArray<HTMLElement>(
        '[data-manifesto-word]',
      );
      if (manifestoSection && manifestoWords.length > 0) {
        gsap.fromTo(
          manifestoWords,
          { opacity: 0.16, y: 8 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.055,
            ease: 'none',
            scrollTrigger: {
              trigger: manifestoSection,
              start: 'top 84%',
              end: 'bottom 58%',
              scrub: 0.45,
            },
          },
        );
      }

      // 4. Scroll-scrubbed sphere finale reveal
      const sphereStage = document.querySelector<HTMLElement>(
        '[data-zoom-stage="sphere-finale"]',
      );
      if (sphereStage) {
        gsap.fromTo(
          sphereStage,
          { scale: 0.92, opacity: 0.86 },
          {
            scale: 1,
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: sphereStage,
              start: 'top 96%',
              end: 'center center',
              scrub: 0.7,
            },
          },
        );
      }

      // 4b. Crisp reveal for architectural Pricing ledger rows
      const pricingGrid = document.querySelector<HTMLElement>(
        '[data-testid="pricing-cards-grid"]',
      );
      if (pricingGrid) {
        const cols = pricingGrid.querySelectorAll<HTMLElement>('[data-plan-id]');
        gsap.fromTo(
          cols,
          { y: 24, opacity: 0.01 },
          {
            y: 0,
            opacity: 1,
            duration: 0.72,
            stagger: 0.07,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
            scrollTrigger: {
              trigger: pricingGrid,
              start: 'top 84%',
              once: true,
            },
          },
        );
      }

      // 5. Process section hairline progress spine
      const spine = document.querySelector<HTMLElement>('[data-process-spine]');
      const processList = document.querySelector<HTMLElement>(
        '[data-process-list]',
      );
      if (spine && processList) {
        gsap.fromTo(
          spine,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: processList,
              start: 'top 72%',
              end: 'bottom 68%',
              scrub: 0.5,
            },
          },
        );
      }
    }, pageRef);

    const onResize = () => {
      lenis.resize();
      ScrollTrigger.refresh();
    };
    window.addEventListener('load', onResize);

    return () => {
      window.removeEventListener('load', onResize);
      document.removeEventListener('click', onAnchorClick);
      detachMagnetic();
      ctx.revert();
      gsap.ticker.remove(onTick);
      lenis.off('scroll', onLenisScroll);
      lenis.destroy();
    };
  }, []);

  return (
    <MotionConfig reducedMotion="never">
      <div
        ref={pageRef}
        className="relative min-h-screen w-full bg-[#f3f6fb] text-[#080a0f]"
      >
        <SeoHeadManager />
        <ChromaticPrismBackdrop />
        <div className="studio-grain" aria-hidden="true" />
        <IntroCurtain />
        <StudioCursor />
        <TopBar />
        <main className="relative z-10">
          <HeroSection />
          <ZoomPortalShowcase />
          <EditorialManifesto />
          <VelocityMarquee />
          <MotionShowcaseRail />
          <PricingSection />
          <ProcessSection />
          <AnswerEngineFaqSection />
          <SphereFinaleSection />
        </main>
        <ClosingFooter />
      </div>
    </MotionConfig>
  );
}
