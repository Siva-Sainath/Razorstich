/** Pricing + add-ons — merchant-friendly tier config. */

export const PRICING_PLANS = [
  {
    id: 'sandbox',
    name: 'Sandbox',
    tagline: 'Try the product before you connect Razorpay',
    price: { monthly: '₹0', annual: '₹0' },
    period: 'forever',
    cta: 'Try Test checkout',
    ctaAction: 'razorpay_sandbox',
    ctaHref: '/checkout',
    highlight: false,
    features: [
      'Live demo — failed checkouts, carts, subscriptions, invoices',
      'See how the agent decides in real time',
      'Razorpay Test Mode webhooks',
      'Training details on /research',
    ],
    limits: ['No live recovery', 'No phone calls'],
  },
  {
    id: 'growth',
    name: 'Growth',
    tagline: 'Recover real payments on your Razorpay account',
    price: { monthly: '2.5%', annual: '2.0%' },
    period: 'per recovered payment',
    cta: 'Join pilot',
    ctaHref: '/start?plan=growth',
    highlight: true,
    badge: 'Popular',
    features: [
      'Connect Razorpay — agent recommends the best next step',
      'Covers checkouts, carts, subscriptions, and invoices',
      'Proof pack when you onboard',
      'Email + WhatsApp follow-ups',
      'Revenue recovered dashboard + audit trail',
    ],
    limits: ['Phone recovery optional'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Custom setup for high-volume merchants',
    price: { monthly: 'Custom', annual: 'Custom' },
    period: 'annual + success fee',
    cta: 'Talk to us',
    ctaHref: '/start?plan=enterprise',
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
  pricingNote: 'Pass-through ~$0.09–0.21/min (pay-as-you-go) · no platform markup in pilot',
  pilotIncluded: '100 demo minutes included in Growth pilot',
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
    title: 'Connect Razorpay',
    detail: 'Start in Test Mode. Webhooks flow into the agent with no live money at risk.',
    cta: 'Integrations',
    href: '/integrations',
  },
  {
    step: '03',
    title: 'Go live',
    detail: 'Switch to Live mode. Pay 2.5% only on payments the agent actually recovers.',
    cta: 'Join pilot',
    href: '/start',
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
  { label: 'Checkout recovery lift', value: '+61%', sub: 'vs basic retry rules', mono: true },
  { label: 'Scenarios passed', value: '10/10', sub: 'failed checkout tests', mono: true },
  { label: 'Training runs', value: '20k', sub: 'per recovery type', mono: true },
  { label: 'Tuning rounds', value: '24', sub: 'across all scenarios', mono: true },
];
