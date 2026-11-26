import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRICING_PLANS,
  calculatePaymentSchedule,
  calculateRenewalPrice,
  filterPlansByTag,
  formatINR,
} from './pricing';

test('default payment schedules match the uploaded pricing PDF exactly', () => {
  const anchor = calculatePaymentSchedule('anchor');
  assert.deepEqual(anchor, {
    planPrice: 15000,
    extraPagesCost: 0,
    total: 15000,
    step1LockIn: 2500,
    step2AfterDemo: 6250,
    step3OnDelivery: 6250,
  });

  const beacon = calculatePaymentSchedule('beacon');
  assert.deepEqual(beacon, {
    planPrice: 25000,
    extraPagesCost: 0,
    total: 25000,
    step1LockIn: 2500,
    step2AfterDemo: 11250,
    step3OnDelivery: 11250,
  });

  const pulse = calculatePaymentSchedule('pulse');
  assert.deepEqual(pulse, {
    planPrice: 60000,
    extraPagesCost: 0,
    total: 60000,
    step1LockIn: 2500,
    step2AfterDemo: 28750,
    step3OnDelivery: 28750,
  });

  const atlas = calculatePaymentSchedule('atlas');
  assert.deepEqual(atlas, {
    planPrice: 90000,
    extraPagesCost: 0,
    total: 90000,
    step1LockIn: 2500,
    step2AfterDemo: 43750,
    step3OnDelivery: 43750,
  });
});

test('negotiated Anchor price and extra pages split accurately across steps 2 and 3', () => {
  const negotiated = calculatePaymentSchedule('anchor', 0, 12000);
  assert.equal(negotiated.step1LockIn, 2500);
  assert.equal(negotiated.step2AfterDemo, 4750);
  assert.equal(negotiated.step3OnDelivery, 4750);
  assert.equal(
    negotiated.step1LockIn + negotiated.step2AfterDemo + negotiated.step3OnDelivery,
    12000,
  );

  const pulseWithExtra = calculatePaymentSchedule('pulse', 2);
  assert.equal(pulseWithExtra.extraPagesCost, 3000);
  assert.equal(pulseWithExtra.total, 63000);
  assert.equal(pulseWithExtra.step1LockIn, 2500);
  assert.equal(pulseWithExtra.step2AfterDemo, 30250);
  assert.equal(pulseWithExtra.step3OnDelivery, 30250);

  const clampedLow = calculatePaymentSchedule('anchor', -3, 1000);
  assert.equal(clampedLow.planPrice, 2500);
  assert.equal(clampedLow.extraPagesCost, 0);
  assert.equal(clampedLow.step2AfterDemo, 0);
  assert.equal(clampedLow.step3OnDelivery, 0);
});

test('renewal bundles add ₹2,500 surcharge for Atlas stores only when maintenance is included', () => {
  assert.equal(calculateRenewalPrice('none', false), 0);
  assert.equal(calculateRenewalPrice('none', true), 0);
  assert.equal(calculateRenewalPrice('maintenance', false), 2500);
  assert.equal(calculateRenewalPrice('maintenance', true), 5000);
  assert.equal(calculateRenewalPrice('seo-alone', false), 8000);
  assert.equal(calculateRenewalPrice('seo-alone', true), 8000);
  assert.equal(calculateRenewalPrice('seo-geo-maint', false), 15000);
  assert.equal(calculateRenewalPrice('seo-geo-maint', true), 17500);
  assert.equal(calculateRenewalPrice('seo-geo-aeo-maint', false), 22000);
  assert.equal(calculateRenewalPrice('seo-geo-aeo-maint', true), 24500);
});

test('tag filtering returns matching plans', () => {
  assert.equal(filterPlansByTag(PRICING_PLANS, 'All').length, 4);
  assert.deepEqual(
    filterPlansByTag(PRICING_PLANS, 'SEO').map((p) => p.id),
    ['beacon', 'pulse', 'atlas'],
  );
  assert.deepEqual(
    filterPlansByTag(PRICING_PLANS, 'Motion').map((p) => p.id),
    ['pulse', 'atlas'],
  );
  assert.deepEqual(
    filterPlansByTag(PRICING_PLANS, 'E-Commerce').map((p) => p.id),
    ['atlas'],
  );
  assert.deepEqual(
    filterPlansByTag(PRICING_PLANS, 'Negotiable').map((p) => p.id),
    ['anchor'],
  );
});

test('Indian Rupee formatting uses en-IN grouping', () => {
  assert.equal(formatINR(15000), '₹15,000');
  assert.equal(formatINR(90000), '₹90,000');
  assert.equal(formatINR(112500), '₹1,12,500');
});
