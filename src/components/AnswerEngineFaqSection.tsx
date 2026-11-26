import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, MessageCircle, Minus, Plus } from 'lucide-react';
import { openWhatsAppChat } from '../utils/contact';
import { EASE_IN, EASE_OUT } from '../utils/motion';
import { STUDIO_FAQS } from '../utils/seo';

/**
 * Answer-First AEO & GEO Knowledge Section.
 * Mirrors the exact 6 questions & factual INR answers emitted in the
 * FAQPage JSON-LD schema so both human visitors and AI answer engines
 * (Google AI Overviews, ChatGPT, Gemini, Perplexity) read identical facts.
 */
export function AnswerEngineFaqSection() {
  // Open first two core questions (pricing & milestones) by default for instant scannability
  const [openIds, setOpenIds] = useState<string[]>([
    STUDIO_FAQS[0].id,
    STUDIO_FAQS[1].id,
  ]);

  const allOpen = openIds.length === STUDIO_FAQS.length;

  const toggleId = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    if (allOpen) {
      setOpenIds([STUDIO_FAQS[0].id, STUDIO_FAQS[1].id]);
    } else {
      setOpenIds(STUDIO_FAQS.map((f) => f.id));
    }
  };

  return (
    <section
      id="faq"
      data-testid="faq-section"
      aria-label="Frequently asked questions about website pricing, SEO, GEO, AEO, and timelines"
      className="relative z-10 py-24 sm:py-32 border-t border-[#080a0f]/[0.09] bg-[#f3f6fb]/74 backdrop-blur-xs"
    >
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Sticky Editorial Left Column */}
          <div
            data-reveal-block
            className="lg:col-span-4 lg:sticky lg:top-28 self-start"
          >
            <p className="font-mono-tabular text-[12px] font-medium tracking-[0.04em] text-[#1b3bf5]">
              COMMON QUESTIONS · AEO &amp; GEO
            </p>
            <h2
              data-cursor="text"
              className="mt-3 font-display text-[34px] sm:text-[46px] font-bold leading-[1.02] tracking-[-0.035em] text-[#080a0f] text-balance"
            >
              <span className="reveal-mask">
                <span data-reveal-line className="reveal-line">
                  Everything clear
                </span>
              </span>
              <span className="reveal-mask">
                <span data-reveal-line className="reveal-line text-[#1b3bf5]">
                  before you ask.
                </span>
              </span>
            </h2>
            <p className="mt-4 text-[15px] leading-[1.66] text-[#3e4656] max-w-[38ch]">
              Straight answers on INR pricing, live demo milestones, Google SEO,
              AI search visibility (GEO &amp; AEO), and 100% ownership.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <button
                type="button"
                data-cursor="action"
                onClick={() =>
                  openWhatsAppChat(
                    'Hi Sai Charan, I have a quick question about building a website for my business.',
                  )
                }
                className="btn-tactile inline-flex items-center gap-2 rounded-full bg-[#080a0f] px-5 py-2.5 text-[13.5px] font-medium text-white hover:bg-[#1b3bf5] whitespace-nowrap cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Ask on WhatsApp</span>
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={toggleAll}
                className="editorial-link text-[13px] font-medium text-[#3e4656] hover:text-[#1b3bf5] transition-colors cursor-pointer"
              >
                {allOpen ? 'Collapse extras' : 'Expand all 6'}
              </button>
            </div>
          </div>

          {/* Unboxed Editorial Answer-First Ledger */}
          <div className="lg:col-span-8 border-t border-[#080a0f]/[0.15] divide-y divide-[#080a0f]/[0.1] border-b border-b-[#080a0f]/[0.15]">
            {STUDIO_FAQS.map((faq, idx) => {
              const isOpen = openIds.includes(faq.id);
              return (
                <article
                  key={faq.id}
                  data-faq-id={faq.id}
                  className="transition-colors duration-200"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => toggleId(faq.id)}
                    className="group w-full py-6 sm:py-7 text-left flex items-start justify-between gap-6 cursor-pointer"
                  >
                    <div className="flex items-baseline gap-4 sm:gap-6">
                      <span
                        className={`font-mono-tabular text-[12px] font-medium shrink-0 ${
                          isOpen
                            ? 'text-[#1b3bf5]'
                            : 'text-[#556075] group-hover:text-[#080a0f]'
                        }`}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <h3 className="font-display text-[20px] sm:text-[23px] font-bold leading-[1.18] tracking-[-0.025em] text-[#080a0f] group-hover:text-[#1b3bf5] transition-colors">
                        {faq.question}
                      </h3>
                    </div>

                    <span
                      aria-hidden="true"
                      className={`mt-0.5 inline-flex items-center justify-center w-8 h-8 rounded-full border shrink-0 transition-colors ${
                        isOpen
                          ? 'bg-[#080a0f] border-[#080a0f] text-white'
                          : 'border-[#080a0f]/[0.18] text-[#080a0f] group-hover:border-[#1b3bf5] group-hover:text-[#1b3bf5]'
                      }`}
                    >
                      {isOpen ? (
                        <Minus className="w-3.5 h-3.5" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key={`${faq.id}-answer`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                          height: 'auto',
                          opacity: 1,
                          transition: { duration: 0.36, ease: EASE_OUT },
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                          transition: { duration: 0.22, ease: EASE_IN },
                        }}
                        className="overflow-hidden"
                      >
                        <p className="pb-7 pl-9 sm:pl-12 pr-4 text-[15px] leading-[1.72] text-[#3e4656] max-w-[66ch]">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
