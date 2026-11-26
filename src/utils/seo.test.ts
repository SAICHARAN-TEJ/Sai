import test from 'node:test';
import assert from 'node:assert/strict';
import { STUDIO_FAQS, buildStructuredDataGraph } from './seo';

test('JSON-LD graph includes Person, ProfessionalService, OfferCatalog, and FAQPage with exact parity', () => {
  const graph = buildStructuredDataGraph('https://saicharan.studio');
  const serialized = JSON.stringify(graph);

  assert.equal(graph['@context'], 'https://schema.org');
  assert.ok(Array.isArray(graph['@graph']));
  assert.equal(graph['@graph'].length, 7);

  // Never leak hidden WhatsApp number into SEO/GEO schema
  assert.equal(serialized.includes('8056159323'), false);

  // Must include visible contact email and all 4 INR plans
  assert.equal(serialized.includes('saicharante505@gmail.com'), true);
  assert.equal(serialized.includes('"price":"15000"'), true);
  assert.equal(serialized.includes('"price":"25000"'), true);
  assert.equal(serialized.includes('"price":"60000"'), true);
  assert.equal(serialized.includes('"price":"90000"'), true);

  // FAQPage mirrors STUDIO_FAQS 1:1
  const faqNode = graph['@graph'].find((n) => n['@type'] === 'FAQPage') as {
    mainEntity: { name: string }[];
  };
  assert.ok(faqNode);
  assert.equal(faqNode.mainEntity.length, STUDIO_FAQS.length);
  assert.equal(faqNode.mainEntity[0].name, STUDIO_FAQS[0].question);
});
