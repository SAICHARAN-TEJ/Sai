export type ProjectCategory =
  | 'All'
  | 'Motion'
  | 'Interactive'
  | 'Ecommerce'
  | 'Portfolio'
  | '3D'
  | 'AI'
  | 'Agency';

export interface ShowcaseProject {
  id: number;
  indexLabel: string;
  slug: string;
  videoUrl: string;
  title: string;
  category: string;
  filterGroup: Exclude<ProjectCategory, 'All'>;
  year: string;
  description: string;
}

const VIDEO_BASE = 'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/';

interface RawProject {
  path: string;
  title: string;
  category: string;
  filterGroup: Exclude<ProjectCategory, 'All'>;
  year: string;
  description: string;
}

const RAW_PROJECTS: RawProject[] = [
  {
    path: 'aaaf/glaze-motion',
    title: 'Glaze',
    category: 'Motion',
    filterGroup: 'Motion',
    year: '2026',
    description:
      'A three-part product story where glazed ceramics spin, drip, and settle as you scroll.',
  },
  {
    path: 'a/obsisidianArea',
    title: 'Obsidian',
    category: 'Interactive',
    filterGroup: 'Interactive',
    year: '2026',
    description:
      'An editorial hero where a winged figure breaks through the oversized wordmark.',
  },
  {
    path: 'aaaf/try-the-look-hero',
    title: 'Try The Look',
    category: 'Ecommerce',
    filterGroup: 'Ecommerce',
    year: '2026',
    description:
      'Outfits swap on a live model the moment you hover a garment.',
  },
  {
    path: 'aaaf/loops-virtual-store',
    title: 'Loops Store',
    category: 'Ecommerce',
    filterGroup: 'Ecommerce',
    year: '2026',
    description:
      'A virtual store you walk through room by room, with products arranged on the shelves.',
  },
  {
    path: 'aaaf/vell-lookbook',
    title: 'Runway Lookbook',
    category: 'Interactive',
    filterGroup: 'Interactive',
    year: '2026',
    description:
      'Looks walk down a runway and pause gently wherever your cursor lands.',
  },
  {
    path: 'uploaded/jackportofplio',
    title: '3D Portfolio',
    category: 'Portfolio',
    filterGroup: 'Portfolio',
    year: '2025',
    description:
      'A character-led portfolio hero anchored by an expressive 3D centerpiece.',
  },
  {
    path: 'aaaf/virtualfit-arc-hero',
    title: 'Virtual Fitting',
    category: 'Ecommerce',
    filterGroup: 'Ecommerce',
    year: '2026',
    description:
      'Garments arc around a mannequin and snap smoothly into place when selected.',
  },
  {
    path: 'aaaf/vasari-vhs-hero',
    title: 'Shelf Hero',
    category: 'Portfolio',
    filterGroup: 'Portfolio',
    year: '2026',
    description:
      'Work stored as tactile VHS tapes on a shelf — pull one out to play the case study.',
  },
  {
    path: 'aaaf/orvante-agency',
    title: 'Orvante Agency',
    category: 'Agency',
    filterGroup: 'Agency',
    year: '2026',
    description:
      'A monochrome agency landing page built around campaign stills and a tight editorial grid.',
  },
  {
    path: 'designs/orbit-spher-hero-interactive',
    title: 'Orbit Sphere',
    category: 'Interactive',
    filterGroup: 'Interactive',
    year: '2026',
    description:
      'Cards orbit a glowing core — drag to spin, tap any card to bring it forward.',
  },
  {
    path: 'aaaf/reelmark-hero-interaction',
    title: 'Reelmark',
    category: 'Creator Platform',
    filterGroup: 'Motion',
    year: '2026',
    description:
      'A creator platform hero with a cinema reel strip that scrubs effortlessly as you move.',
  },
  {
    path: 'aaaf/lena-varga-hero',
    title: 'Lena Varga',
    category: '3D Portfolio',
    filterGroup: '3D',
    year: '2026',
    description:
      'A warm 3D sculptor portfolio guided by a clay-soft interactive mascot.',
  },
  {
    path: 'designs/ink-reveal-hover',
    title: 'Ink Reveal',
    category: 'Hover',
    filterGroup: 'Interactive',
    year: '2026',
    description:
      'Organic ink blooms smoothly through the wordmark wherever the cursor passes.',
  },
  {
    path: 'aaaf/living-portrait-hero',
    title: 'Living Portrait',
    category: 'Portfolio',
    filterGroup: 'Portfolio',
    year: '2026',
    description:
      'A responsive portrait that blinks, breathes, and tracks your cursor naturally.',
  },
  {
    path: 'aaaf/lumen-roof-hero',
    title: 'Solar Fog',
    category: 'Interactive',
    filterGroup: 'Interactive',
    year: '2026',
    description:
      'An architectural house at dusk that transitions smoothly between daylight and night.',
  },
  {
    path: 'aaaf/axon-hero',
    title: 'AXON',
    category: 'Portfolio',
    filterGroup: '3D',
    year: '2026',
    description:
      'A luminous point-cloud sculpture drifting inside a responsive particle field.',
  },
  {
    path: 'aaaf/clothing-rail-hero',
    title: 'Clothing Rail',
    category: 'Ecommerce',
    filterGroup: 'Ecommerce',
    year: '2026',
    description:
      'Garments glide along a physical rail — grab any piece to pull it cleanly into view.',
  },
  {
    path: 'aaaf/facet-glass-hero',
    title: 'Facet Glass',
    category: '3D',
    filterGroup: '3D',
    year: '2026',
    description:
      'Refractive faceted glass panels catching studio light as the page scrolls.',
  },
  {
    path: 'aaaf/nomi-hero',
    title: 'Nomi Agent',
    category: 'AI',
    filterGroup: 'AI',
    year: '2026',
    description:
      'A playful scan-lined character introducing a calm, focused inbox assistant.',
  },
  {
    path: 'aaaf/stellarmind-hero',
    title: 'Stellarmind',
    category: 'AI',
    filterGroup: 'AI',
    year: '2026',
    description:
      'A deep starfield hero built for an AI research studio with a quiet camera drift.',
  },
  {
    path: 'aaaf/vhs-arc-hero',
    title: 'VHS Archive',
    category: 'Portfolio',
    filterGroup: 'Portfolio',
    year: '2026',
    description:
      'Tapes fan out across a gentle arc, each case opening a complete project story.',
  },
  {
    path: 'designs/saffron-3d-webgl-landing',
    title: 'Saffron Field',
    category: 'Interactive',
    filterGroup: 'Interactive',
    year: '2026',
    description:
      'Warm golden particles bloom into typography as you glide across the field.',
  },
  {
    path: 'designs/roadster-3d-car-landing',
    title: 'Roadster 3D',
    category: '3D',
    filterGroup: '3D',
    year: '2026',
    description:
      'An interactive roadster turntable supporting live paint and wheel finishes.',
  },
  {
    path: 'aaaf/kinestra-card-story-v2',
    title: 'Card Story',
    category: 'Interactive',
    filterGroup: 'Motion',
    year: '2026',
    description:
      'An editorial product narrative told through stacked tactile cards that turn on scroll.',
  },
];

export const SHOWCASE_PROJECTS: ShowcaseProject[] = RAW_PROJECTS.map(
  (item, idx) => ({
    id: idx + 1,
    indexLabel: String(idx + 1).padStart(2, '0'),
    slug: item.path,
    videoUrl: `${VIDEO_BASE}${item.path}.mp4`,
    title: item.title,
    category: item.category,
    filterGroup: item.filterGroup,
    year: item.year,
    description: item.description,
  }),
);

export const SPHERE_PROJECTS: ShowcaseProject[] = SHOWCASE_PROJECTS.slice(0, 20);

export const PROJECT_CATEGORIES: ProjectCategory[] = [
  'All',
  'Interactive',
  'Motion',
  'Ecommerce',
  '3D',
  'Portfolio',
  'AI',
  'Agency',
];

export function filterProjectsByCategory(
  projects: ShowcaseProject[],
  category: ProjectCategory,
): ShowcaseProject[] {
  if (category === 'All') return projects;
  return projects.filter((p) => p.filterGroup === category);
}
