import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowUpRight,
  Check,
  Copy,
  Download,
  MessageCircle,
  Minus,
  Plus,
} from 'lucide-react';
import {
  CONTACT_EMAIL,
  PRICING_PDF_PATH,
  buildEmailUrl,
  openWhatsAppChat,
} from '../utils/contact';
import { EASE_IN, EASE_OUT, SPRING } from '../utils/motion';
import {
  ATLAS_MAINTENANCE_SURCHARGE,
  EXTRA_PAGE_RATE,
  LOCK_IN_AMOUNT,
  PRICING_PLANS,
  RENEWAL_OPTIONS,
  TERMS_LIST,
  calculatePaymentSchedule,
  calculateRenewalPrice,
  formatINR,
  type PlanId,
} from '../utils/pricing';

export function PricingSection() {
  // Highlight & expand Plan 02: Beacon (₹25,000) by default, and default estimator to Beacon
  const [expandedPlans, setExpandedPlans] = useState<PlanId[]>(['beacon']);
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>('beacon');
  const [extraPages, setExtraPages] = useState(0);
  const [negotiatedAnchor, setNegotiatedAnchor] = useState(15000);
  const [renewalId, setRenewalId] = useState('none');
  const [copied, setCopied] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  const selectedPlan =
    PRICING_PLANS.find((plan) => plan.id === selectedPlanId) ?? PRICING_PLANS[1];
  const isAtlas = selectedPlan.id === 'atlas';
  const schedule = calculatePaymentSchedule(
    selectedPlan.id,
    extraPages,
    selectedPlan.id === 'anchor' ? negotiatedAnchor : undefined,
  );
  const monthlyRenewal = calculateRenewalPrice(renewalId, isAtlas);
  const selectedRenewal =
    RENEWAL_OPTIONS.find((item) => item.id === renewalId) ?? RENEWAL_OPTIONS[0];

  const allExpanded = expandedPlans.length === PRICING_PLANS.length;

  const togglePlanRow = (planId: PlanId) => {
    setExpandedPlans((prev) =>
      prev.includes(planId)
        ? prev.filter((id) => id !== planId)
        : [...prev, planId],
    );
    setSelectedPlanId(planId);
  };

  const toggleAllRows = () => {
    if (allExpanded) {
      setExpandedPlans(['beacon']);
    } else {
      setExpandedPlans(PRICING_PLANS.map((p) => p.id));
    }
  };

  const selectPlanAndScrollToEstimator = (planId: PlanId) => {
    setSelectedPlanId(planId);
    const el = document.getElementById('quote-estimator');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const buildQuoteText = () => {
    const lines = [
      `Hi Sai Charan, I'd like to move forward with a website quote:`,
      `• Plan: ${selectedPlan.name} (${selectedPlan.covers})`,
      `• Timeline: ${selectedPlan.timeline}`,
      `• Plan price: ${formatINR(schedule.planPrice)}`,
      ...(extraPages > 0
        ? [
            `• Extra pages (${extraPages} × ${formatINR(EXTRA_PAGE_RATE)}): ${formatINR(schedule.extraPagesCost)}`,
          ]
        : []),
      `• Total build: ${formatINR(schedule.total)}`,
      `• Milestones: ${formatINR(schedule.step1LockIn)} lock-in / ${formatINR(schedule.step2AfterDemo)} after demo / ${formatINR(schedule.step3OnDelivery)} on delivery`,
      `• Post-month-1 renewal: ${
        monthlyRenewal > 0
          ? `${selectedRenewal.label} (${formatINR(monthlyRenewal)}/month)`
          : 'None (1 month free maintenance included)'
      }`,
    ];
    return lines.join('\n');
  };

  const handleCopyQuote = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(buildQuoteText());
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    }
  };

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
    <section
      id="pricing"
      aria-label="Website design plans, quote estimator, and terms"
      className="relative z-10 py-24 sm:py-32 border-t border-[#080a0f]/[0.09] bg-[#f3f6fb]/74 backdrop-blur-xs"
    >
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8">
        {/* Natural Editorial Header */}
        <div
          data-reveal-block
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-end"
        >
          <div className="lg:col-span-7">
            <p className="font-mono-tabular text-[12px] font-medium tracking-[0.04em] text-[#1b3bf5]">
              PLANS &amp; PRICING
            </p>
            <h2 className="mt-3 font-display text-[36px] sm:text-[52px] font-bold leading-[1.01] tracking-[-0.036em] text-[#080a0f] text-balance">
              <span className="reveal-mask">
                <span data-reveal-line className="reveal-line">
                  Straightforward studio rates
                </span>
              </span>
              <span className="reveal-mask">
                <span data-reveal-line className="reveal-line text-[#1b3bf5]">
                  in Indian Rupees.
                </span>
              </span>
            </h2>
          </div>

          <div className="lg:col-span-5 flex flex-col items-start lg:items-end justify-between gap-4">
            <p className="text-[15.5px] leading-[1.66] text-[#3e4656] max-w-[44ch] lg:text-right">
              Every engagement includes one month of free maintenance after
              launch, two demo revision rounds, and full source ownership.
            </p>
            <button
              type="button"
              onClick={toggleAllRows}
              className="editorial-link text-[13px] font-medium text-[#080a0f] hover:text-[#1b3bf5] transition-colors cursor-pointer"
            >
              {allExpanded ? 'Collapse other plans' : 'Expand all four plans'}
            </button>
          </div>
        </div>

        {/* Unboxed Editorial Studio Rate Ledger */}
        <div
          data-testid="pricing-cards-grid"
          className="mt-12 sm:mt-14 border-t border-black/[0.16]"
        >
          {/* Quiet Column Legend on Desktop */}
          <div className="hidden lg:grid grid-cols-12 gap-6 py-3.5 border-b border-[#080a0f]/[0.09] text-[12px] font-medium text-[#556075]">
            <span className="col-span-1">No.</span>
            <span className="col-span-5">Engagement &amp; Scope</span>
            <span className="col-span-3">Turnaround</span>
            <span className="col-span-3 text-right">Investment</span>
          </div>

          <div className="divide-y divide-[#080a0f]/[0.12] border-b border-[#080a0f]/[0.16]">
            {PRICING_PLANS.map((plan) => {
              const isBeacon = plan.id === 'beacon';
              const isOpen = expandedPlans.includes(plan.id);
              const planSchedule = calculatePaymentSchedule(plan.id);

              return (
                <article
                  key={plan.id}
                  data-plan-id={plan.id}
                  data-highlighted={isBeacon ? 'true' : 'false'}
                  className={`transition-colors duration-200 ${
                    isBeacon
                      ? 'bg-[#ffffff]/82 -mx-5 sm:-mx-8 px-5 sm:px-8'
                      : 'hover:bg-[#ffffff]/55 -mx-5 sm:-mx-8 px-5 sm:px-8'
                  }`}
                >
                  {/* Clickable Editorial Row Header */}
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => togglePlanRow(plan.id)}
                    className="group w-full py-7 sm:py-8 text-left grid grid-cols-12 items-baseline gap-y-3 gap-x-4 sm:gap-x-6 cursor-pointer"
                  >
                    <span
                      className={`col-span-2 sm:col-span-1 font-mono-tabular text-[13px] font-medium ${
                        isBeacon || isOpen
                          ? 'text-[#1b3bf5]'
                          : 'text-[#556075] group-hover:text-[#080a0f]'
                      }`}
                    >
                      {plan.number}
                    </span>

                    <div className="col-span-10 sm:col-span-6 lg:col-span-5">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3 className="font-display text-[30px] sm:text-[38px] font-bold leading-none tracking-[-0.034em] text-[#080a0f]">
                          {plan.name}
                        </h3>
                        {isBeacon && (
                          <span className="text-[12.5px] font-semibold text-[#1b3bf5]">
                            · Recommended
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-[14.5px] text-[#3e4656] leading-snug">
                        {plan.covers}
                      </p>
                    </div>

                    <div className="col-span-6 sm:col-span-5 lg:col-span-3 sm:text-right lg:text-left pl-0 sm:pl-0">
                      <span className="text-[14px] text-[#3e4656]">
                        {plan.timeline}
                      </span>
                    </div>

                    <div className="col-span-6 sm:col-span-12 lg:col-span-3 flex items-baseline justify-end gap-4">
                      <div className="text-right">
                        <span className="font-mono-tabular text-[24px] sm:text-[28px] font-medium tracking-[-0.025em] text-[#080a0f]">
                          {formatINR(plan.basePrice)}
                        </span>
                        {plan.negotiable && (
                          <span className="block text-[11.5px] text-[#556075] mt-0.5">
                            negotiable
                          </span>
                        )}
                      </div>

                      <span
                        aria-hidden="true"
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full border transition-colors shrink-0 ${
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
                    </div>
                  </button>

                  {/* Smooth Spring-Unfolding Scope Details (Zero Inner Boxes) */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key={`${plan.id}-details`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                          height: 'auto',
                          opacity: 1,
                          transition: { duration: 0.42, ease: EASE_OUT },
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                          transition: { duration: 0.24, ease: EASE_IN },
                        }}
                        className="overflow-hidden"
                      >
                        <div className="pb-9 pt-2 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 border-t border-black/[0.08]">
                          <div className="hidden lg:block lg:col-span-1" />

                          {/* Summary + Payment Milestone Prose */}
                          <div className="lg:col-span-4 pt-4">
                            <p className="text-[15px] leading-[1.68] text-[#222220] max-w-[38ch]">
                              {plan.summary}
                            </p>

                            <dl className="mt-6 pt-4 border-t border-black/[0.08] space-y-2 text-[13px]">
                              <div className="flex justify-between gap-4">
                                <dt className="text-[#6b6b68]">
                                  1. Lock-in deposit
                                </dt>
                                <dd className="font-mono-tabular font-medium text-[#0a0a0a]">
                                  {formatINR(planSchedule.step1LockIn)}
                                </dd>
                              </div>
                              <div className="flex justify-between gap-4">
                                <dt className="text-[#6b6b68]">
                                  2. After live demo
                                </dt>
                                <dd className="font-mono-tabular font-medium text-[#0a0a0a]">
                                  {formatINR(planSchedule.step2AfterDemo)}
                                </dd>
                              </div>
                              <div className="flex justify-between gap-4">
                                <dt className="text-[#6b6b68]">
                                  3. On final delivery
                                </dt>
                                <dd className="font-mono-tabular font-medium text-[#0a0a0a]">
                                  {formatINR(planSchedule.step3OnDelivery)}
                                </dd>
                              </div>
                            </dl>
                          </div>

                          {/* Deliverables List + Direct Actions */}
                          <div className="lg:col-span-7 pt-4 lg:pl-6 flex flex-col justify-between">
                            <div>
                              <p className="text-[12.5px] font-medium text-[#556075] mb-3.5">
                                Included in {plan.name}
                              </p>
                              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 text-[14px] leading-snug text-[#1d2230]">
                                {plan.deliverables.map((item) => (
                                  <li
                                    key={item}
                                    className="flex items-start gap-2.5"
                                  >
                                    <span
                                      aria-hidden="true"
                                      className="text-[#1b3bf5] shrink-0"
                                    >
                                      —
                                    </span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="mt-7 pt-5 border-t border-[#080a0f]/[0.08] flex flex-wrap items-center gap-5">
                              <button
                                type="button"
                                data-magnetic-cta={isBeacon ? '' : undefined}
                                data-cursor="action"
                                onClick={() =>
                                  openWhatsAppChat(
                                    `Hi Sai Charan, I'm interested in Plan ${plan.number}: ${plan.name} (${formatINR(plan.basePrice)}). Let's discuss my website.`,
                                  )
                                }
                                className={`btn-tactile inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-medium cursor-pointer whitespace-nowrap ${
                                  isBeacon
                                    ? 'bg-[#1b3bf5] text-white hover:bg-[#080a0f]'
                                    : 'bg-[#080a0f] text-white hover:bg-[#1b3bf5]'
                                }`}
                              >
                                <MessageCircle
                                  className="w-3.5 h-3.5"
                                  aria-hidden="true"
                                />
                                <span>
                                  {isBeacon
                                    ? 'Start with Beacon'
                                    : `Discuss ${plan.name}`}
                                </span>
                                <ArrowUpRight
                                  className="w-3.5 h-3.5"
                                  aria-hidden="true"
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  selectPlanAndScrollToEstimator(plan.id)
                                }
                                className="editorial-link text-[13.5px] font-medium text-[#3e4656] hover:text-[#1b3bf5] transition-colors cursor-pointer"
                              >
                                Estimate milestones with extras
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </article>
              );
            })}
          </div>
        </div>

        {/* Unboxed Conversational Quote Estimator Spread */}
        <div
          id="quote-estimator"
          className="mt-20 sm:mt-24 pt-14 border-t border-black/[0.14] grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start"
        >
          {/* Left Column: Natural Controls */}
          <div className="lg:col-span-6 space-y-8">
            <div>
              <p className="font-mono-tabular text-[12px] font-medium tracking-[0.04em] text-[#1b3bf5]">
                ESTIMATE YOUR BUILD
              </p>
              <h3 className="mt-2 font-display text-[30px] sm:text-[36px] font-bold tracking-[-0.032em] leading-[1.06] text-[#080a0f]">
                Work out your exact milestones.
              </h3>
              <p className="mt-2.5 text-[15px] text-[#3e4656] leading-relaxed max-w-[46ch]">
                Pick a plan, add any extra pages at {formatINR(EXTRA_PAGE_RATE)}{' '}
                each, or include optional post-launch care to see your split.
              </p>
            </div>

            <div>
              <span className="block text-[12.5px] font-medium text-[#556075] mb-3">
                Select plan
              </span>
              <div className="inline-flex flex-wrap items-center gap-1 border-b border-[#080a0f]/[0.12] pb-2 w-full">
                {PRICING_PLANS.map((plan) => {
                  const activeBtn = plan.id === selectedPlan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      aria-pressed={activeBtn}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`relative px-4 py-2 text-[14px] font-medium cursor-pointer transition-colors whitespace-nowrap ${
                        activeBtn
                          ? 'text-[#080a0f]'
                          : 'text-[#556075] hover:text-[#080a0f]'
                      }`}
                    >
                      <span>{plan.name}</span>
                      {activeBtn && (
                        <motion.span
                          layoutId="estimator-active-underline"
                          transition={SPRING.snap}
                          className="absolute left-0 right-0 -bottom-[9px] h-[2px] bg-[#1b3bf5]"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedPlan.negotiable && (
              <div className="flex items-center justify-between gap-4 pb-6 border-b border-black/[0.09]">
                <div>
                  <label
                    htmlFor="anchor-price-input"
                    className="block text-[14.5px] font-semibold text-[#0a0a0a]"
                  >
                    Agreed Anchor price (₹)
                  </label>
                  <p className="text-[13px] text-[#6b6b68] mt-0.5">
                    Anchor is negotiable — steps 2 &amp; 3 split the remainder
                    evenly.
                  </p>
                </div>
                <input
                  id="anchor-price-input"
                  type="number"
                  min={LOCK_IN_AMOUNT}
                  step={500}
                  value={negotiatedAnchor}
                  onChange={(e) => {
                    const parsed = Number(e.target.value);
                    setNegotiatedAnchor(
                      Number.isFinite(parsed) ? parsed : LOCK_IN_AMOUNT,
                    );
                  }}
                  className="w-32 bg-transparent border-b border-black/[0.3] px-2 py-1.5 text-right font-mono-tabular text-[16px] font-medium text-[#080a0f] focus:border-[#1b3bf5]"
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-4 pb-6 border-b border-black/[0.09]">
              <div>
                <span className="block text-[14.5px] font-semibold text-[#0a0a0a]">
                  Extra pages ({formatINR(EXTRA_PAGE_RATE)} each)
                </span>
                <p className="text-[13px] text-[#6b6b68] mt-0.5">
                  {isAtlas
                    ? 'Product pages in Atlas are included and not charged per page.'
                    : 'Any extra page beyond those agreed at the start.'}
                </p>
              </div>
              <div className="inline-flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  aria-label="Decrease extra pages"
                  onClick={() => setExtraPages((n) => Math.max(0, n - 1))}
                  className="btn-tactile w-9 h-9 rounded-full border border-black/[0.2] text-[#0a0a0a] text-[16px] hover:border-[#0a0a0a] cursor-pointer"
                >
                  −
                </button>
                <span
                  data-testid="extra-pages-count"
                  className="font-mono-tabular text-[16px] w-6 text-center text-[#0a0a0a]"
                >
                  {extraPages}
                </span>
                <button
                  type="button"
                  aria-label="Increase extra pages"
                  onClick={() => setExtraPages((n) => n + 1)}
                  className="btn-tactile w-9 h-9 rounded-full border border-black/[0.2] text-[#0a0a0a] text-[16px] hover:border-[#0a0a0a] cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="pb-2">
              <label
                htmlFor="renewal-select"
                className="block text-[14.5px] font-semibold text-[#0a0a0a] mb-2"
              >
                Optional monthly renewal (after your free first month)
              </label>
              <select
                id="renewal-select"
                value={renewalId}
                onChange={(e) => setRenewalId(e.target.value)}
                className="w-full bg-transparent border-b border-black/[0.25] py-2.5 pr-4 text-[14.5px] text-[#080a0f] cursor-pointer focus:border-[#1b3bf5]"
              >
                {RENEWAL_OPTIONS.map((opt) => {
                  const monthly = calculateRenewalPrice(opt.id, isAtlas);
                  return (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                      {monthly > 0 ? ` — ${formatINR(monthly)}/mo` : ''}
                    </option>
                  );
                })}
              </select>
              {isAtlas && selectedRenewal.includesMaintenance && (
                <p className="mt-2.5 text-[12.5px] font-medium text-[#1b3bf5]">
                  Includes the {formatINR(ATLAS_MAINTENANCE_SURCHARGE)} Atlas
                  store maintenance surcharge (orders, stock &amp; payment
                  checks).
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Clean Unboxed Proposal Ledger */}
          <div className="lg:col-span-6 lg:pl-8 lg:border-l lg:border-black/[0.1] flex flex-col justify-between">
            <div className="flex items-baseline justify-between gap-4 pb-6 border-b border-[#080a0f]/[0.14]">
              <div>
                <p className="text-[12.5px] font-medium text-[#556075]">
                  Estimated total
                </p>
                <h4 className="font-display text-[24px] sm:text-[28px] font-semibold text-[#080a0f] mt-1">
                  {selectedPlan.name} · {selectedPlan.timeline}
                </h4>
              </div>
              <motion.p
                key={schedule.total}
                initial={{ y: 6, opacity: 0.45 }}
                animate={{ y: 0, opacity: 1 }}
                transition={SPRING.snap}
                data-testid="estimator-total"
                className="font-mono-tabular text-[32px] sm:text-[38px] font-medium tracking-[-0.03em] text-[#080a0f] shrink-0"
              >
                {formatINR(schedule.total)}
              </motion.p>
            </div>

            <dl
              data-testid="estimator-breakdown"
              className="divide-y divide-[#080a0f]/[0.09] text-[14.5px]"
            >
              <div className="py-4 flex items-center justify-between gap-4">
                <dt className="text-[#3e4656]">
                  Step 1 — Lock-in deposit (non-refundable)
                </dt>
                <dd className="font-mono-tabular font-medium text-[#080a0f]">
                  {formatINR(schedule.step1LockIn)}
                </dd>
              </div>
              <div className="py-4 flex items-center justify-between gap-4">
                <dt className="text-[#3e4656]">
                  Step 2 — Paid after you see the demo
                </dt>
                <dd
                  data-testid="estimator-step2"
                  className="font-mono-tabular font-medium text-[#080a0f]"
                >
                  {formatINR(schedule.step2AfterDemo)}
                </dd>
              </div>
              <div className="py-4 flex items-center justify-between gap-4">
                <dt className="text-[#3e4656]">
                  Step 3 — Paid on final delivery
                </dt>
                <dd
                  data-testid="estimator-step3"
                  className="font-mono-tabular font-medium text-[#080a0f]"
                >
                  {formatINR(schedule.step3OnDelivery)}
                </dd>
              </div>
              <div className="py-4 flex items-center justify-between gap-4">
                <dt className="text-[#3e4656]">
                  Monthly renewal (optional, after month 1)
                </dt>
                <dd
                  data-testid="estimator-renewal"
                  className="font-mono-tabular font-medium text-[#1b3bf5]"
                >
                  {monthlyRenewal > 0
                    ? `${formatINR(monthlyRenewal)}/mo`
                    : 'None'}
                </dd>
              </div>
            </dl>

            <div className="mt-7 pt-6 border-t border-[#080a0f]/[0.12] flex flex-wrap items-center gap-5">
              <button
                type="button"
                data-magnetic-cta
                data-cursor="action"
                onClick={() => openWhatsAppChat(buildQuoteText())}
                className="btn-tactile inline-flex items-center justify-center gap-2 rounded-full bg-[#080a0f] px-6 py-3 text-[14px] font-medium text-white hover:bg-[#1b3bf5] cursor-pointer whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                <span>Send estimate on WhatsApp</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={handleCopyQuote}
                className="editorial-link inline-flex items-center gap-1.5 text-[14px] font-medium text-[#3e4656] hover:text-[#1b3bf5] cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{copied ? 'Summary copied' : 'Copy summary'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Unboxed Editorial Renewals & Clear Terms Spread */}
        <div className="mt-20 pt-14 border-t border-black/[0.12] grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-5">
            <h3 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#0a0a0a]">
              Renewals after the free month
            </h3>
            <p className="mt-2.5 text-[14.5px] leading-relaxed text-[#444442]">
              Maintenance covers bug fixes, security updates, backups, and small
              text or image swaps. New pages are {formatINR(EXTRA_PAGE_RATE)}{' '}
              each; new features are quoted separately.
            </p>

            <dl className="mt-6 divide-y divide-black/[0.09] border-y border-black/[0.09] text-[14px]">
              <div className="py-3 flex justify-between gap-4">
                <dt className="text-[#444442]">Maintenance</dt>
                <dd className="font-mono-tabular font-medium text-[#0a0a0a]">
                  ₹2,500/mo
                </dd>
              </div>
              <div className="py-3 flex justify-between gap-4">
                <dt className="text-[#444442]">Maintenance for Atlas stores</dt>
                <dd className="font-mono-tabular font-medium text-[#0a0a0a]">
                  ₹5,000/mo
                </dd>
              </div>
              <div className="py-3 flex justify-between gap-4">
                <dt className="text-[#444442]">SEO alone</dt>
                <dd className="font-mono-tabular font-medium text-[#0a0a0a]">
                  ₹8,000/mo
                </dd>
              </div>
              <div className="py-3 flex justify-between gap-4">
                <dt className="text-[#444442]">SEO + GEO + maintenance</dt>
                <dd className="font-mono-tabular font-medium text-[#0a0a0a]">
                  ₹15,000/mo
                </dd>
              </div>
              <div className="py-3 flex justify-between gap-4">
                <dt className="text-[#444442]">
                  SEO + GEO + AEO + maintenance
                </dt>
                <dd className="font-mono-tabular font-medium text-[#0a0a0a]">
                  ₹22,000/mo
                </dd>
              </div>
            </dl>

            <p className="mt-4 text-[12.5px] text-[#6b6b68] leading-relaxed">
              Any renewal bundle that includes maintenance adds ₹2,500/mo for
              Atlas e-commerce stores to cover ongoing order, stock, and payment
              upkeep.
            </p>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <h3 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#0a0a0a]">
                Clear terms before we begin
              </h3>
              <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                {TERMS_LIST.map((term) => (
                  <div
                    key={term.title}
                    className="pt-4 border-t border-black/[0.09]"
                  >
                    <dt className="text-[14px] font-semibold text-[#0a0a0a]">
                      {term.title}
                    </dt>
                    <dd className="mt-1.5 text-[13.5px] leading-relaxed text-[#444442]">
                      {term.detail}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-8 pt-6 border-t border-black/[0.1] flex flex-wrap items-center justify-between gap-4">
              <a
                href={PRICING_PDF_PATH}
                download="Sai_Charan_Pricing_Plans.pdf"
                className="editorial-link inline-flex items-center gap-2 text-[14px] font-semibold text-[#080a0f] hover:text-[#1b3bf5] transition-colors"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>Download original pricing sheet (PDF)</span>
              </a>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={buildEmailUrl('Website Pricing Inquiry')}
                  className="editorial-link text-[14px] text-[#3e4656] hover:text-[#080a0f] transition-colors"
                >
                  Or email {CONTACT_EMAIL}
                </a>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  aria-label="Copy email address"
                  data-testid="pricing-copy-email"
                  className="btn-tactile inline-flex items-center gap-1.5 rounded-full border border-[#080a0f]/[0.16] bg-[#ffffff] px-3 py-1 text-[12.5px] font-medium text-[#080a0f] hover:border-[#1b3bf5] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {emailCopied ? (
                    <Check
                      className="w-3.5 h-3.5 text-[#1b3bf5]"
                      aria-hidden="true"
                    />
                  ) : (
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span>{emailCopied ? 'Copied' : 'Copy email'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
