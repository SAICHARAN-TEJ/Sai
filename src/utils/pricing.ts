export type PlanId = 'anchor' | 'beacon' | 'pulse' | 'atlas';

export type FilterTag =
  | 'All'
  | 'Website'
  | 'SEO'
  | 'Motion'
  | 'GEO'
  | 'AEO'
  | 'E-Commerce'
  | 'Maintenance'
  | 'Negotiable'
  | 'AI Search';

export interface PricingPlan {
  id: PlanId;
  number: string;
  name: string;
  covers: string;
  basePrice: number;
  negotiable: boolean;
  timeline: string;
  cardLeft: string;
  cardRight: string;
  studyTitle: string;
  videoUrl: string;
  summary: string;
  deliverables: string[];
  tags: FilterTag[];
  extraNote?: string;
}

export interface RenewalOption {
  id: string;
  label: string;
  baseMonthly: number;
  includesMaintenance: boolean;
  atlasOnly?: boolean;
  description: string;
}

export interface PaymentSchedule {
  planPrice: number;
  extraPagesCost: number;
  total: number;
  step1LockIn: number;
  step2AfterDemo: number;
  step3OnDelivery: number;
}

export interface TermItem {
  title: string;
  detail: string;
}

export const LOCK_IN_AMOUNT = 2500;
export const EXTRA_PAGE_RATE = 1500;
export const ATLAS_MAINTENANCE_SURCHARGE = 2500;

export const FILTER_TAGS: FilterTag[] = [
  'All',
  'Website',
  'SEO',
  'Motion',
  'GEO',
  'AEO',
  'E-Commerce',
  'Maintenance',
  'Negotiable',
  'AI Search',
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'anchor',
    number: '01',
    name: 'Anchor',
    covers: 'Website only',
    basePrice: 15000,
    negotiable: true,
    timeline: '3 days',
    cardLeft: 'Anchor\nWebsite only',
    cardRight: '₹15,000*\n3 days',
    studyTitle: 'Lattices / zone',
    videoUrl:
      'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/oraciteslArea.mp4',
    summary:
      'Website only. Focused website design and build with no SEO, no motion graphics, and no online store.',
    deliverables: [
      'Design and build of the website, with pages and sections agreed at the start',
      'Responsive layout built for phones, tablets, and desktops',
      'Contact form setup',
      'Setup and launch on your domain and hosting',
      'One month of free maintenance after delivery',
    ],
    tags: ['Website', 'Maintenance', 'Negotiable'],
  },
  {
    id: 'beacon',
    number: '02',
    name: 'Beacon',
    covers: 'Website + SEO',
    basePrice: 25000,
    negotiable: false,
    timeline: '5 days',
    cardLeft: 'Beacon\nWebsite + SEO',
    cardRight: '₹25,000\n5 days',
    studyTitle: 'Prism / shell',
    videoUrl:
      'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/facet-glass-hero.mp4',
    summary:
      'Everything in Anchor, plus search engine optimization (SEO) so Google can find and understand your pages.',
    deliverables: [
      'Everything included in Anchor',
      'Keyword research for your business and location',
      'Page titles, descriptions, headings, and image alt text written for search',
      'Page speed optimization, XML sitemap, and robots.txt',
      'Google Search Console and Google Analytics setup',
      'Structured data (schema) added to key pages',
      'First month of SEO included; ongoing work covered under renewals',
      'One month of free maintenance after delivery',
    ],
    tags: ['Website', 'SEO', 'Maintenance'],
  },
  {
    id: 'pulse',
    number: '03',
    name: 'Pulse',
    covers: 'Website + motion graphics + SEO, GEO and AEO',
    basePrice: 60000,
    negotiable: false,
    timeline: '7 days',
    cardLeft: 'Pulse\nMotion + AI search',
    cardRight: '₹60,000\n7 days',
    studyTitle: 'Nebular / loop',
    videoUrl:
      'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/stellarmind-hero.mp4',
    summary:
      'Everything in Beacon, plus custom motion graphics and optimization for modern AI search and answer engines.',
    deliverables: [
      'Everything included in Beacon',
      'Motion graphics: scroll animations, page transitions, and animated visuals',
      'AEO (answer engine optimization): answer-first FAQ sections with FAQ schema',
      'GEO (generative engine optimization): structured content for ChatGPT, Gemini, and Perplexity citations',
      'First month of SEO, GEO, and AEO included',
      'One month of free maintenance after delivery',
    ],
    tags: ['Website', 'SEO', 'Motion', 'GEO', 'AEO', 'AI Search', 'Maintenance'],
  },
  {
    id: 'atlas',
    number: '04',
    name: 'Atlas',
    covers: 'E-commerce website',
    basePrice: 90000,
    negotiable: false,
    timeline: 'Scoped by workload',
    cardLeft: 'Atlas\nE-commerce store',
    cardRight: '₹90,000\nScoped build',
    studyTitle: 'Fall / forward',
    videoUrl:
      'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/thedropthroughArea.mp4',
    summary:
      'Everything in Pulse, plus a full online store where customers can browse, order, and pay securely.',
    deliverables: [
      'Everything included in Pulse',
      'Product catalogue with categories and product pages',
      'Shopping cart and checkout flow',
      'Payment gateway integration (such as Razorpay)',
      'Admin panel to manage products, stock, and orders',
      'Shipping and tax settings configured',
      'One month of free maintenance after delivery',
    ],
    extraNote:
      'Timeline depends on product count, features, and integrations — delivered in writing before work starts. Product pages are included and not charged per page.',
    tags: [
      'Website',
      'SEO',
      'Motion',
      'GEO',
      'AEO',
      'AI Search',
      'E-Commerce',
      'Maintenance',
    ],
  },
];

export const RENEWAL_OPTIONS: RenewalOption[] = [
  {
    id: 'none',
    label: 'No renewal (free month only)',
    baseMonthly: 0,
    includesMaintenance: false,
    description: '1 month free maintenance included with every plan.',
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    baseMonthly: 2500,
    includesMaintenance: true,
    description: 'Bug fixes, security updates, backups, and small text/image swaps.',
  },
  {
    id: 'seo-alone',
    label: 'SEO alone',
    baseMonthly: 8000,
    includesMaintenance: false,
    description: 'Ongoing technical and on-page search optimization without maintenance.',
  },
  {
    id: 'seo-geo-maint',
    label: 'SEO + GEO + maintenance',
    baseMonthly: 15000,
    includesMaintenance: true,
    description: 'Search + generative AI visibility plus monthly site maintenance.',
  },
  {
    id: 'seo-geo-aeo-maint',
    label: 'SEO + GEO + AEO + maintenance',
    baseMonthly: 22000,
    includesMaintenance: true,
    description: 'Full search, AI citation, answer-engine care, and monthly maintenance.',
  },
];

export const TERMS_LIST: TermItem[] = [
  {
    title: 'Domain',
    detail: 'Domain costs are paid directly by the client and are not part of any plan price.',
  },
  {
    title: 'Hosting & third-party fees',
    detail:
      'Hosting, payment gateway charges, paid plugins, and third-party services are paid directly by the client.',
  },
  {
    title: 'Timeline',
    detail:
      'Delivery days start once the ₹2,500 lock-in payment and all client content (text, logo, images) are received.',
  },
  {
    title: 'Changes',
    detail:
      'Two rounds of revisions are included after the demo. Additional rounds or out-of-scope features are quoted separately (extra pages are ₹1,500 each).',
  },
  {
    title: 'Search results',
    detail:
      'SEO, GEO, and AEO improve discoverability, but no specific ranking or AI citation can be guaranteed; results depend on competition and take weeks to months.',
  },
  {
    title: 'Ownership',
    detail: 'Full website and source files transfer to the client once the final payment is received.',
  },
];

export function formatINR(amount: number): string {
  const safe = Math.max(0, Math.round(amount));
  return `₹${safe.toLocaleString('en-IN')}`;
}

export function filterPlansByTag(
  plans: PricingPlan[],
  tag: FilterTag,
): PricingPlan[] {
  if (tag === 'All') {
    return plans;
  }
  return plans.filter((plan) => plan.tags.includes(tag));
}

export function calculatePaymentSchedule(
  planId: PlanId,
  extraPages = 0,
  negotiatedAnchorPrice?: number,
): PaymentSchedule {
  const plan = PRICING_PLANS.find((p) => p.id === planId) ?? PRICING_PLANS[0];
  const safeExtraPages = Math.max(0, Math.floor(extraPages));
  const rawPlanPrice =
    plan.id === 'anchor' && typeof negotiatedAnchorPrice === 'number'
      ? Math.max(LOCK_IN_AMOUNT, Math.round(negotiatedAnchorPrice))
      : plan.basePrice;

  const extraPagesCost = safeExtraPages * EXTRA_PAGE_RATE;
  const total = rawPlanPrice + extraPagesCost;
  const step1LockIn = Math.min(LOCK_IN_AMOUNT, total);
  const remaining = Math.max(0, total - step1LockIn);
  const step2AfterDemo = Math.floor(remaining / 2);
  const step3OnDelivery = remaining - step2AfterDemo;

  return {
    planPrice: rawPlanPrice,
    extraPagesCost,
    total,
    step1LockIn,
    step2AfterDemo,
    step3OnDelivery,
  };
}

export function calculateRenewalPrice(
  renewalId: string,
  isAtlasStore: boolean,
): number {
  const option = RENEWAL_OPTIONS.find((item) => item.id === renewalId);
  if (!option || option.baseMonthly === 0) {
    return 0;
  }
  return option.includesMaintenance && isAtlasStore
    ? option.baseMonthly + ATLAS_MAINTENANCE_SURCHARGE
    : option.baseMonthly;
}
