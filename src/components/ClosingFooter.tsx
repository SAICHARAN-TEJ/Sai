import { useState } from 'react';
import {
  ArrowUpRight,
  Check,
  Copy,
  Download,
  Mail,
  MessageCircle,
} from 'lucide-react';
import {
  CONTACT_EMAIL,
  DESIGNER_NAME,
  PRICING_PDF_PATH,
  buildEmailUrl,
  openWhatsAppChat,
} from '../utils/contact';

export function ClosingFooter() {
  const [emailCopied, setEmailCopied] = useState(false);

  const handleCopyEmail = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(CONTACT_EMAIL);
      }
      setEmailCopied(true);
      window.setTimeout(() => setEmailCopied(false), 2200);
    } catch {
      setEmailCopied(true);
      window.setTimeout(() => setEmailCopied(false), 2200);
    }
  };

  return (
    <footer className="relative z-10 bg-[#080a0f] text-[#f3f6fb] border-t-2 border-[#4f7cff]">
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 pt-24 sm:pt-32 pb-12">
        <div
          data-reveal-block
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-end pb-20 border-b border-white/[0.12]"
        >
          <div className="lg:col-span-7">
            <p className="font-mono-tabular text-[12px] font-medium tracking-[0.04em] text-[#9ec5ff]">
              START A CONVERSATION
            </p>
            <h2
              data-cursor="text"
              className="mt-4 font-display text-[38px] sm:text-[54px] lg:text-[64px] font-bold leading-[1.0] tracking-[-0.038em] text-[#f3f6fb] text-balance"
            >
              <span className="reveal-mask">
                <span data-reveal-line className="reveal-line">
                  Let&apos;s build a website your
                </span>
              </span>
              <span className="reveal-mask">
                <span data-reveal-line className="reveal-line text-[#4f7cff]">
                  customers remember.
                </span>
              </span>
            </h2>
            <p className="mt-5 text-[16px] leading-[1.66] text-white/70 max-w-[46ch]">
              Send a quick WhatsApp message with what your business does.
              I&apos;ll reply personally with a clear recommendation and a
              realistic timeline.
            </p>
          </div>

          <div className="lg:col-span-5 flex flex-col items-start lg:items-end gap-4">
            <button
              type="button"
              onClick={() =>
                openWhatsAppChat(
                  'Hi Sai Charan, I visited your portfolio and would love to discuss building a website for my business.',
                )
              }
              data-testid="footer-contact-whatsapp"
              data-magnetic-cta
              data-cursor="action"
              className="btn-tactile inline-flex items-center justify-center gap-2.5 rounded-full bg-[#1b3bf5] px-7 py-4 text-[15px] font-semibold text-white hover:bg-[#4f7cff] whitespace-nowrap cursor-pointer shadow-[0_14px_34px_-10px_rgba(27,59,245,0.65)]"
            >
              <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Message me on WhatsApp</span>
              <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </button>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-[14px] text-white/75 pt-2">
              <div className="inline-flex items-center gap-2.5">
                <a
                  href={buildEmailUrl('Website Project Inquiry')}
                  className="editorial-link inline-flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{CONTACT_EMAIL}</span>
                </a>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  aria-label="Copy email address"
                  data-testid="footer-copy-email"
                  className="btn-tactile inline-flex items-center gap-1.5 rounded-full border border-white/18 bg-white/[0.06] px-3 py-1 text-[12px] font-medium text-white/85 hover:bg-white/[0.14] hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {emailCopied ? (
                    <Check
                      className="w-3.5 h-3.5 text-white"
                      aria-hidden="true"
                    />
                  ) : (
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span>{emailCopied ? 'Copied' : 'Copy email'}</span>
                </button>
              </div>
              <a
                href={PRICING_PDF_PATH}
                download="Sai_Charan_Pricing_Plans.pdf"
                className="editorial-link inline-flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Pricing PDF</span>
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[13.5px] text-white/55">
          <p>
            © {new Date().getFullYear()} {DESIGNER_NAME}
          </p>
          <div className="flex flex-wrap items-center gap-7">
            <a
              href="#craft"
              className="editorial-link hover:text-white transition-colors"
            >
              Craft
            </a>
            <a
              href="#pricing"
              className="editorial-link hover:text-white transition-colors"
            >
              Pricing
            </a>
            <a
              href="#process"
              className="editorial-link hover:text-white transition-colors"
            >
              Process
            </a>
            <a
              href="#faq"
              className="editorial-link hover:text-white transition-colors"
            >
              FAQ
            </a>
            <a
              href="#showreel"
              className="editorial-link hover:text-white transition-colors"
            >
              Showreel
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
