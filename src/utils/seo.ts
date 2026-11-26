import { CONTACT_EMAIL, DESIGNER_NAME } from './contact';
import {
  EXTRA_PAGE_RATE,
  LOCK_IN_AMOUNT,
  PRICING_PLANS,
  formatINR,
} from './pricing';
import { SHOWCASE_PROJECTS } from './projects';

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
}

/**
 * Answer-first AEO/GEO knowledge blocks. Every entry is 35–60 words,
 * self-contained for AI citation extraction (ChatGPT, Gemini, Perplexity,
 * Google AI Overviews), and mirrored 1:1 into FAQPage JSON-LD schema.
 */
export const STUDIO_FAQS: FaqEntry[] = [
  {
    id: 'pricing-tiers',
    question: 'How much does a custom website cost with M Sai Charan Tej?',
    answer:
      'Custom websites are offered in four transparent Indian Rupee tiers: Anchor (₹15,000 negotiable, 3-day website-only build), Beacon (₹25,000, 5-day website plus Google SEO foundation — most chosen), Pulse (₹60,000, 7-day site with scroll motion graphics plus SEO, GEO, and AEO), and Atlas (₹90,000 full e-commerce store with Razorpay checkout and admin panel).',
  },
  {
    id: 'payment-milestones',
    question: 'How does the 3-step milestone payment process work?',
    answer: `Every project starts with a ${formatINR(LOCK_IN_AMOUNT)} non-refundable lock-in deposit once pages, scope, and content are confirmed. The remaining balance is split 50/50: half is paid only after you review a live working demo in your browser (with two revision rounds included), and the final half is paid on delivery and full handover.`,
  },
  {
    id: 'seo-geo-aeo-difference',
    question: 'What is the difference between SEO, GEO, and AEO for my website?',
    answer:
      'SEO (Search Engine Optimization) structures titles, schema, sitemaps, and page speed so Google ranks your business. GEO (Generative Engine Optimization) formats entity facts and structured data so AI models like ChatGPT, Gemini, and Perplexity cite your brand accurately. AEO (Answer Engine Optimization) adds direct answer-first FAQ blocks and FAQPage schema so answer engines quote your pages directly.',
  },
  {
    id: 'turnaround-timeline',
    question: 'How fast can my website be designed and launched?',
    answer:
      'Anchor websites launch in 3 days, Beacon (Website + SEO) launches in 5 days, and Pulse (Motion + SEO/GEO/AEO) launches in 7 days once the ₹2,500 lock-in and all client content (text, logo, images) arrive. Atlas e-commerce stores are scoped directly to catalogue size and checkout complexity.',
  },
  {
    id: 'ownership-and-handover',
    question: 'Do I receive full code, website, and domain ownership?',
    answer:
      'Yes. You retain 100% ownership of your website, source files, domain, and hosting accounts immediately upon final delivery payment. Domain registration, hosting, and any third-party tools are billed directly to you at actual cost with zero lock-in markups.',
  },
  {
    id: 'renewals-and-extra-pages',
    question: 'What happens after the free first month of maintenance?',
    answer: `Every plan includes one full month of free post-launch maintenance covering fixes, backups, and minor edits. Afterwards, renewals are optional: ₹2,500/month for maintenance (₹5,000/month for Atlas stores), ₹8,000/month for SEO, ₹15,000/month for SEO + GEO + maintenance, or ₹22,000/month for SEO + GEO + AEO + maintenance. Extra pages are ${formatINR(EXTRA_PAGE_RATE)} each.`,
  },
];

export function buildStructuredDataGraph(originUrl: string) {
  const cleanOrigin = originUrl.replace(/\/+$/, '');
  const personId = `${cleanOrigin}/#person`;
  const serviceId = `${cleanOrigin}/#service`;
  const websiteId = `${cleanOrigin}/#website`;
  const webpageId = `${cleanOrigin}/#webpage`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: `${cleanOrigin}/`,
        name: `${DESIGNER_NAME} — Independent Website Design, Motion & SEO Studio`,
        description:
          'Independent website designer and developer in India building custom motion-crafted websites, Google SEO, AI search (GEO/AEO) foundations, and online stores.',
        inLanguage: 'en-IN',
        publisher: { '@id': personId },
      },
      {
        '@type': 'WebPage',
        '@id': webpageId,
        url: `${cleanOrigin}/`,
        name: `${DESIGNER_NAME} — Website Designer, Motion & SEO Studio`,
        isPartOf: { '@id': websiteId },
        about: { '@id': serviceId },
        dateModified: '2026-11-25',
        inLanguage: 'en-IN',
      },
      {
        '@type': 'Person',
        '@id': personId,
        name: DESIGNER_NAME,
        alternateName: 'Sai Charan',
        jobTitle: 'Independent Website Designer & Developer',
        email: `mailto:${CONTACT_EMAIL}`,
        url: `${cleanOrigin}/`,
        knowsAbout: [
          'Website Design',
          'Interactive Motion Graphics',
          'Scroll-Driven Web Animations',
          'WebGL and Three.js',
          'Search Engine Optimization (SEO)',
          'Generative Engine Optimization (GEO)',
          'Answer Engine Optimization (AEO)',
          'E-Commerce Storefront Engineering',
        ],
        homeLocation: {
          '@type': 'Country',
          name: 'India',
        },
      },
      {
        '@type': 'ProfessionalService',
        '@id': serviceId,
        name: `${DESIGNER_NAME} Web Design Studio`,
        description:
          'Custom website design, interactive scroll motion, SEO/GEO/AEO architecture, and full e-commerce storefronts built directly with founders in 3 to 7 days.',
        url: `${cleanOrigin}/`,
        email: CONTACT_EMAIL,
        founder: { '@id': personId },
        areaServed: [
          { '@type': 'Country', name: 'India' },
          { '@type': 'Place', name: 'Worldwide' },
        ],
        priceRange: '₹15,000 – ₹90,000',
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Website Design & Engineering Plans (INR)',
          itemListElement: PRICING_PLANS.map((plan, index) => ({
            '@type': 'Offer',
            position: index + 1,
            name: `Plan ${plan.number}: ${plan.name} — ${plan.covers}`,
            description: `${plan.summary} Turnaround: ${plan.timeline}. Includes: ${plan.deliverables.join('; ')}.`,
            price: String(plan.basePrice),
            priceCurrency: 'INR',
            availability: 'https://schema.org/InStock',
            url: `${cleanOrigin}/#pricing`,
            itemOffered: {
              '@type': 'Service',
              name: `${plan.name} (${plan.covers})`,
              provider: { '@id': personId },
            },
          })),
        },
      },
      {
        '@type': 'FAQPage',
        '@id': `${cleanOrigin}/#faq`,
        mainEntity: STUDIO_FAQS.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
      {
        '@type': 'ItemList',
        name: 'Featured Interactive Motion & Web Craft Studies',
        numberOfItems: 6,
        itemListElement: SHOWCASE_PROJECTS.slice(0, 6).map((project, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: `${project.title} (${project.category})`,
          description: project.description,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${cleanOrigin}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Craft & Motion',
            item: `${cleanOrigin}/#craft`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Plans & Pricing',
            item: `${cleanOrigin}/#pricing`,
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: 'FAQ',
            item: `${cleanOrigin}/#faq`,
          },
        ],
      },
    ],
  };
}
