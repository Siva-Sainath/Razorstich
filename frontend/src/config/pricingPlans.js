/** Pricing + add-ons — merchant-friendly tier config. */

export const PRICING_PLANS = [
  {
    id: 'sandbox',
    name: 'Sandbox',
    tagline: 'Try checkout + demo before you connect live Razorpay',
    price: { monthly: 'Free', annual: 'Free' },
    checkoutInr: 1499,
    period: 'platform · ₹1,499 test payment',
    cta: 'Pay with test card',
    ctaAction: 'razorpay_checkout',
    checkoutPlan: 'sandbox',
    highlight: false,
    features: [
      'Razorpay Test checkout on this page — real checkout.js modal',
      'Live demo — failed checkouts, carts, subscriptions, invoices',
      'See how the agent decides in real time',
      'Training details on /research',
    ],
    limits: ['No live recovery', 'No phone calls'],
  },
  {
    id: 'growth',
    name: 'Growth',
    tagline: 'Recover real payments on your Razorpay account',
    price: { monthly: '2.5%', annual: '2.0%' },
    checkoutInr: 499,
    period: 'per recovered payment',
    cta: 'Pre-book with test card',
    ctaAction: 'razorpay_checkout',
    checkoutPlan: 'growth',
    highlight: true,
    badge: 'Popular',
    features: [
      'Connect Razorpay — agent recommends the best next step',
      'Covers checkouts, carts, subscriptions, and invoices',
      'Proof pack when you onboard',
      'Email + WhatsApp follow-ups',
      'Revenue recovered dashboard + audit trail',
    ],
    limits: ['₹499 refundable pre-book (Test Mode)'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Custom setup for high-volume merchants',
    price: { monthly: 'Custom', annual: 'Custom' },
    period: 'annual + success fee',
    cta: 'Contact sales',
    ctaHref: 'mailto:hello@razorstitch.dev?subject=Enterprise%20pricing',
    highlight: false,
    features: [
      'Custom recovery playbooks for your business',
      'Private deployment options',
      'Dedicated VPC / Razorpay routing',
      'Applied ML support team',
      'White-label demo for your team',
    ],
    limits: ['Volume discounts on success fee'],
  },
];

/** Optional phone recovery — powered by Smallest AI (pass-through pricing). */
export const VOICE_ADDON = {
  id: 'voice',
  name: 'Phone recovery',
  provider: 'Smallest AI',
  providerUrl: 'https://smallest.ai/pricing/agents',
  docsUrl: 'https://docs.smallest.ai',
  tagline: 'When email and WhatsApp are not enough, call the customer with a natural voice.',
  pricingNote: 'Pass-through ~$0.09–0.21/min (pay-as-you-go) · no platform markup',
  pilotIncluded: '100 demo minutes included with Growth',
  useCases: [
    'Overdue invoices — polite reminder call',
    'Failed subscription — nudge to update card',
    'High-value checkout — personal recovery call for large carts',
  ],
  howItWorks: [
    'Agent picks the right moment to reach out',
    'RazorStitch turns context into a short script',
    'Smallest AI places the call — Hindi or English',
    'Outcome updates your recovery dashboard',
  ],
  features: [
    'Natural, low-latency voice',
    'Scripts tailored to each recovery type',
    'FAQ knowledge for your store',
    'Call recording + transcript in audit trail',
  ],
};

export const FEATURE_MATRIX = [
  { feature: 'Razorpay payment recovery', sandbox: true, growth: true, enterprise: true },
  { feature: 'AI recovery agent (4 scenarios)', sandbox: 'Demo', growth: true, enterprise: true },
  { feature: 'Pay only on recovered revenue', sandbox: '—', growth: true, enterprise: true },
  { feature: 'Proof pack on onboarding', sandbox: 'View only', growth: true, enterprise: true },
  { feature: 'Email + WhatsApp', sandbox: false, growth: true, enterprise: true },
  { feature: 'Phone recovery (Smallest AI)', sandbox: false, growth: 'Add-on', enterprise: true },
  { feature: 'Custom recovery playbooks', sandbox: false, growth: false, enterprise: true },
  { feature: 'Private deployment', sandbox: false, growth: false, enterprise: true },
];

export const CONVERSION_STEPS = [
  {
    step: '01',
    title: 'Try the demo',
    detail: 'Walk through failed checkout, cart, subscription, and invoice — watch the agent decide live.',
    cta: 'Open demo',
    href: '/checkout',
  },
  {
    step: '02',
    title: 'Try Test checkout',
    detail: 'Sandbox opens Razorpay Test Mode in-place. Fail a payment — see what the agent recommends next.',
    cta: 'Open test checkout',
    action: 'sandbox',
    href: '/pricing#pricing-checkout',
  },
  {
    step: '03',
    title: 'Pre-book or go live',
    detail: 'Pre-book Growth with a ₹499 test payment, or connect Razorpay Live when you are ready.',
    cta: 'Pre-book Growth',
    action: 'growth',
    href: '/pricing#pricing-checkout',
  },
];

export const STACK_LAYERS = [
  {
    fig: 'FIG.1',
    num: '01',
    title: 'Practice environment',
    subtitle: 'Every failed payment becomes a scenario the agent can learn from',
    bullets: [
      'Realistic customer behaviour — timing, trust, payment methods',
      'Same four recovery types you see in production',
      'Held-out test cases so results stay honest',
    ],
    cta: 'Explore how it works',
    href: '/research',
  },
  {
    fig: 'FIG.2',
    num: '02',
    title: 'Agent training',
    subtitle: 'Each recovery type gets its own tuned model',
    bullets: [
      'Thousands of practice runs per scenario',
      'Automatic tuning of learning settings',
      'Checkpoints saved along the way',
    ],
    cta: 'Read training log',
    href: '/research',
  },
  {
    fig: 'FIG.3',
    num: '03',
    title: 'Quality checks',
    subtitle: 'We test before anything ships to merchants',
    bullets: [
      'Many random scenarios per recovery type',
      'Compared against basic retry rules',
      'Automatic rollback if quality drops',
    ],
    cta: 'See results',
    href: '/research',
  },
  {
    fig: 'FIG.4',
    num: '04',
    title: 'Live product',
    subtitle: 'Same agent in the demo runs on your Razorpay webhooks',
    bullets: [
      'Instant recommendations on each failure',
      'Full audit trail of every action',
      'Demo replays real validation cases',
    ],
    cta: 'Launch demo',
    href: '/checkout',
  },
];

export const PROOF_METRICS = [
  { label: 'Checkout net lift', value: '+61.2%', sub: 'vs failure-rules · 10×200 simulator', mono: true },
  { label: 'Seeds beaten', value: '10/10', sub: 'checkout_failed gate', mono: true },
  { label: 'Checkout mean net', value: '₹5.17L', sub: 'vs ₹3.21L rules / seed', mono: true },
  { label: 'HPO trials', value: '24', sub: '6 × 4 wedges · 1.5k ep', mono: true },
];
