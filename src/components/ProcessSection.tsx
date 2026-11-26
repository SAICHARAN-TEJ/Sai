const STEPS = [
  {
    step: '01',
    kicker: 'Start & Scope',
    title: 'Lock in with ₹2,500',
    detail:
      'We agree on your pages, sections, and timeline in writing. Once your content (text, logo, photos) and lock-in deposit arrive, the build clock starts immediately.',
    plateLabel: 'Architecture & Wireframe',
    videoUrl:
      'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/kinestra-card-story-v2.mp4',
  },
  {
    step: '02',
    kicker: 'Live Working Demo',
    title: 'Review a working demo before paying half',
    detail:
      'Before paying half the remaining balance, you test a live working version on phone and desktop. Two full revision rounds are included so every interaction and sentence feels right.',
    plateLabel: 'Interactive Browser Review',
    videoUrl:
      'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/lumen-roof-hero.mp4',
  },
  {
    step: '03',
    kicker: 'Launch & Handover',
    title: 'Go live with full ownership',
    detail:
      'We connect your domain and hosting, transfer 100% of the website and source files upon final payment, and include one full month of free maintenance.',
    plateLabel: 'Production Deployment',
    videoUrl:
      'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/designs/roadster-3d-car-landing.mp4',
  },
];

export function ProcessSection() {
  return (
    <section
      id="process"
      className="relative z-10 py-24 sm:py-32 border-t border-[#080a0f]/[0.09] bg-white/82 backdrop-blur-xs"
    >
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Sticky Editorial Left Column */}
          <div
            data-reveal-block
            className="lg:col-span-5 lg:sticky lg:top-28 self-start"
          >
            <p className="font-mono-tabular text-[12px] font-medium tracking-[0.04em] text-[#1b3bf5]">
              HOW WE WORK
            </p>
            <h2
              data-cursor="text"
              className="mt-3 font-display text-[34px] sm:text-[48px] font-bold leading-[1.03] tracking-[-0.036em] text-[#080a0f] text-balance"
            >
              <span className="reveal-mask">
                <span data-reveal-line className="reveal-line">
                  Simple, low-risk, and
                </span>
              </span>
              <span className="reveal-mask">
                <span data-reveal-line className="reveal-line">
                  transparent from day one.
                </span>
              </span>
            </h2>
            <p className="mt-5 text-[15.5px] leading-[1.66] text-[#3e4656] max-w-[42ch]">
              You work directly with me. No middlemen, no surprise invoices, and
              no paying half the balance before testing real working progress in
              your browser.
            </p>
          </div>

          {/* Right Vertical Sequence with Scroll-Scrubbed Electric Blue Spine */}
          <div
            data-process-list
            className="lg:col-span-7 relative pl-7 sm:pl-10"
          >
            <div
              aria-hidden="true"
              className="absolute left-0 top-2 bottom-2 w-[2px] bg-[#080a0f]/[0.1]"
            >
              <div
                data-process-spine
                className="w-full h-full origin-top bg-[#1b3bf5]"
                style={{ transform: 'scaleY(0)' }}
              />
            </div>

            <div className="divide-y divide-[#080a0f]/[0.09]">
              {STEPS.map((item, idx) => (
                <article
                  key={item.step}
                  data-process-step
                  className={`${
                    idx === 0 ? 'pb-10 sm:pb-12' : 'py-10 sm:py-12'
                  } last:pb-0 grid grid-cols-1 sm:grid-cols-12 gap-6 items-start`}
                >
                  <div className="sm:col-span-7">
                    <div className="flex items-center gap-2 text-[13px] text-[#556075]">
                      <span className="font-mono-tabular font-medium text-[#1b3bf5]">
                        Step {item.step}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{item.kicker}</span>
                    </div>
                    <h3 className="mt-3 font-display text-[25px] sm:text-[28px] font-bold leading-[1.12] tracking-[-0.028em] text-[#080a0f]">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-[15px] leading-[1.66] text-[#3e4656]">
                      {item.detail}
                    </p>
                  </div>

                  {/* Studio Motion Plate */}
                  <div className="sm:col-span-5">
                    <div className="overflow-hidden rounded-xl bg-[#080a0f] aspect-[16/10] studio-frame">
                      <video
                        data-viewport-video={`process-${item.step}`}
                        src={item.videoUrl}
                        crossOrigin="anonymous"
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="mt-2 text-[12px] text-[#556075]">
                      {item.plateLabel}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
