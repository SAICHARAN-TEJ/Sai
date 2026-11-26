import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTACT_EMAIL, buildEmailUrl, buildWhatsAppUrl } from './contact';
import {
  SHOWCASE_PROJECTS,
  SPHERE_PROJECTS,
  filterProjectsByCategory,
} from './projects';

test('WhatsApp URL targets the correct number with encoded message', () => {
  const defaultUrl = buildWhatsAppUrl();
  assert.ok(defaultUrl.startsWith('https://wa.me/918056159323?text='));
  assert.ok(defaultUrl.includes(encodeURIComponent('Sai Charan')));

  const customUrl = buildWhatsAppUrl('Hi Sai Charan, interested in Pulse (₹60,000)');
  assert.equal(
    customUrl,
    `https://wa.me/918056159323?text=${encodeURIComponent('Hi Sai Charan, interested in Pulse (₹60,000)')}`,
  );
});

test('Email URL targets saicharante505@gmail.com cleanly', () => {
  assert.equal(CONTACT_EMAIL, 'saicharante505@gmail.com');
  const mailto = buildEmailUrl('New Website Inquiry');
  assert.equal(mailto, 'mailto:saicharante505@gmail.com?subject=New+Website+Inquiry');
});

test('Showcase projects provide 24 total items and 20 sphere items with valid MP4 URLs', () => {
  assert.equal(SHOWCASE_PROJECTS.length, 24);
  assert.equal(SPHERE_PROJECTS.length, 20);
  for (const project of SHOWCASE_PROJECTS) {
    assert.ok(project.videoUrl.startsWith('https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/'));
    assert.ok(project.videoUrl.endsWith('.mp4'));
  }
  const ecommerce = filterProjectsByCategory(SHOWCASE_PROJECTS, 'Ecommerce');
  assert.equal(ecommerce.length, 4);
});
