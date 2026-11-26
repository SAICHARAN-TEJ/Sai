import { useEffect } from 'react';
import { buildStructuredDataGraph } from '../utils/seo';

const JSON_LD_SCRIPT_ID = 'studio-jsonld';

/**
 * Keeps canonical URL, OpenGraph URL, and the 7-entity Schema.org JSON-LD @graph
 * (WebSite, WebPage, Person, ProfessionalService + OfferCatalog, FAQPage,
 * ItemList, BreadcrumbList) synchronized with the live deployed origin.
 */
export function SeoHeadManager() {
  useEffect(() => {
    const origin = window.location.origin;
    const canonicalUrl = `${origin}/`;

    // 1. Canonical link
    let canonicalLink = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonicalUrl;

    // 2. OpenGraph URL
    let ogUrl = document.head.querySelector<HTMLMetaElement>(
      'meta[property="og:url"]',
    );
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.content = canonicalUrl;

    // 3. Multi-entity JSON-LD @graph
    let scriptEl = document.getElementById(
      JSON_LD_SCRIPT_ID,
    ) as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = JSON_LD_SCRIPT_ID;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    const graph = buildStructuredDataGraph(origin);
    scriptEl.textContent = JSON.stringify(graph);
  }, []);

  return null;
}
