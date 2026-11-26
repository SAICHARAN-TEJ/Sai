import { ArrowUpRight, MessageCircle } from 'lucide-react';
import { DESIGNER_SHORT, openWhatsAppChat } from '../utils/contact';

const NAV_LINKS: { href: string; label: string }[] = [
  { href: '#zoom-portal', label: 'Showreel' },
  { href: '#craft', label: 'Craft' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#process', label: 'Process' },
  { href: '#faq', label: 'FAQ' },
];

export function TopBar() {
  return (
    <header className="sticky top-0 z-50 bg-[#f3f6fb]/86 backdrop-blur-md border-b border-[#080a0f]/[0.09] text-[#080a0f]">
      <div className="mx-auto max-w-[1360px] flex items-center justify-between gap-8 px-5 sm:px-8 py-3.5 sm:py-4">
        <a
          href="#top"
          className="font-display text-lg sm:text-xl font-bold tracking-tight whitespace-nowrap shrink-0 text-[#080a0f] hover:text-[#1b3bf5] transition-colors"
        >
          {DESIGNER_SHORT}
        </a>

        <nav
          aria-label="Primary sections"
          className="hidden md:flex items-center gap-8 lg:gap-10 text-sm font-medium text-[#3e4656]"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="editorial-link whitespace-nowrap shrink-0 hover:text-[#080a0f] transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            onClick={() =>
              openWhatsAppChat(
                'Hi Sai Charan, I visited your portfolio and would like to talk about building a website.',
              )
            }
            data-testid="topbar-contact-whatsapp"
            data-magnetic-cta
            data-cursor="action"
            aria-label="Contact Sai Charan on WhatsApp"
            className="btn-tactile inline-flex items-center gap-2 rounded-full bg-[#080a0f] px-4 py-2 sm:px-5 text-xs sm:text-sm font-medium text-white hover:bg-[#1b3bf5] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Contact me</span>
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Whisper-thin Electric Blue GPU scroll progress hairline */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-[-1px] h-[2px] overflow-hidden"
      >
        <div
          data-scroll-progress
          className="h-full w-full origin-left bg-[#1b3bf5]"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>
    </header>
  );
}
