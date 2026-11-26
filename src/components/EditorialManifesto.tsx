const STUDIO_PLATE_URL =
  'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/orvante-agency.mp4';

const MANIFESTO_SEGMENTS = [
  {
    text: 'Most business websites feel like a template within three seconds.',
    accent: false,
  },
  {
    text: 'I build custom sites from scratch, keep them genuinely fast,',
    accent: false,
  },
  {
    text: 'and show you a live working demo before you pay half.',
    accent: true,
  },
];

interface WordToken {
  id: string;
  word: string;
  accent: boolean;
}

const MANIFESTO_WORDS: WordToken[] = MANIFESTO_SEGMENTS.flatMap(
  (seg, segIdx) =>
    seg.text.split(' ').map((word, wordIdx) => ({
      id: `${segIdx}-${wordIdx}`,
      word,
      accent: seg.accent,
    })),
);

export function EditorialManifesto() {
  return (
    <section
      id="philosophy"
      aria-label="Design philosophy"
      data-manifesto-section
      className="relative z-10 py-24 sm:py-32 border-t border-[#080a0f]/[0.09] bg-white/82 backdrop-blur-xs"
    >
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Studio Plate */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between text-[13px] text-[#556075] pb-2.5 border-b border-[#080a0f]/[0.1]">
              <span className="font-semibold text-[#080a0f]">Approach</span>
              <span className="font-mono-tabular text-[12px] text-[#1b3bf5]">Direct with founder</span>
            </div>

            <div className="overflow-hidden rounded-xl bg-[#080a0f] aspect-[4/3] studio-frame">
              <video
                data-viewport-video="manifesto-plate"
                src={STUDIO_PLATE_URL}
                crossOrigin="anonymous"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-[14px] leading-relaxed text-[#3e4656] max-w-[34ch]">
              You speak directly with the person designing and coding your site.
              No agency layers, no bloated themes, no surprise retainers.
            </p>
          </div>

          {/* Right Scroll-Scrubbed Editorial Statement */}
          <div className="lg:col-span-8 lg:pt-6">
            <p
              data-testid="manifesto-statement"
              data-cursor="text"
              className="font-display text-[30px] sm:text-[42px] lg:text-[50px] font-semibold leading-[1.09] tracking-[-0.032em] text-[#080a0f] text-balance"
            >
              {MANIFESTO_WORDS.map((token) => (
                <span
                  key={token.id}
                  data-manifesto-word
                  className={`inline-block mr-[0.23em] ${
                    token.accent ? 'text-[#1b3bf5]' : ''
                  }`}
                >
                  {token.word}
                </span>
              ))}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
