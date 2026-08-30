/** Four RL wedge lanes — demo config + validation case lists. */
export const WEDGE_LANES = [
  {
    wedge: 'checkout_failed',
    path: '/checkout',
    label: 'Checkout failed',
    short: 'Checkout',
    accent: 'checkout',
    description: '72h window · card/UPI declines · 6h ticks',
    defaultCaseId: 'VAL-CHK-004',
    timeUnit: 'hours',
    windowLabel: '72h',
    leftPanel: 'hybrid',
    alwaysGhost: false,
    showSpontaneousBand: true,
    chapterLabels: ['Decline', 'Observe', 'Policy', 'Nudge', 'Captured'],
  },
  {
    wedge: 'cart_abandon',
    path: '/cart',
    label: 'Cart abandon',
    short: 'Cart',
    accent: 'cart',
    description: '48h intent window · 2h ticks · payment-page idle',
    defaultCaseId: 'VAL-CART-002',
    timeUnit: 'hours',
    windowLabel: '48h',
    leftPanel: 'hybrid',
    alwaysGhost: true,
    showFunnel: true,
    showIntentDecay: true,
    chapterLabels: ['Idle', 'Intent', 'Link', 'Recover'],
  },
  {
    wedge: 'subscription_failed',
    path: '/subscription',
    label: 'Subscription failed',
    short: 'Subscription',
    accent: 'subscription',
    description: '14-day renewal window · 12h ticks',
    defaultCaseId: 'VAL-SUB-003',
    timeUnit: 'days',
    windowLabel: '14d',
    leftPanel: 'hybrid',
    alwaysGhost: false,
    showRenewalRing: true,
    showChurnMeter: true,
    chapterLabels: ['Renewal fail', 'Wait', 'Update', 'Retain'],
  },
  {
    wedge: 'invoice_overdue',
    path: '/invoice',
    label: 'Invoice overdue',
    short: 'Invoice',
    accent: 'invoice',
    description: '30-day dunning window · 24h ticks · B2B',
    defaultCaseId: 'VAL-INV-002',
    timeUnit: 'days',
    windowLabel: '30d',
    leftPanel: 'hybrid',
    alwaysGhost: false,
    showDunningLadder: true,
    showARTimeline: true,
    amountHero: true,
    chapterLabels: ['Overdue', 'Remind', 'Escalate', 'Captured'],
  },
];

export const WEDGE_BY_PATH = Object.fromEntries(WEDGE_LANES.map((w) => [w.path, w]));
export const WEDGE_BY_ID = Object.fromEntries(WEDGE_LANES.map((w) => [w.wedge, w]));

export const WEDGE_CASES = {
  checkout_failed: ['VAL-CHK-004', 'VAL-CHK-002', 'VAL-CHK-001', 'VAL-CHK-003', 'VAL-CHK-005'],
  cart_abandon: ['VAL-CART-002', 'VAL-CART-003', 'VAL-CART-001'],
  subscription_failed: ['VAL-SUB-003', 'VAL-SUB-002', 'VAL-SUB-001'],
  invoice_overdue: ['VAL-INV-002', 'VAL-INV-001', 'VAL-INV-003'],
};

/** Per-case metadata for taxonomy picker and badges — from val_scenarios.json only. */
export const CASE_CATALOG = {
  'VAL-CHK-001': { taxonomy: 'UPI', hook: 'UPI timeout · ₹1,499', recoverable: true },
  'VAL-CHK-002': { taxonomy: 'Funds', hook: 'Insufficient funds · patience loop', recoverable: true },
  'VAL-CHK-003': { taxonomy: 'Gateway', hook: 'Gateway error · fast retry', recoverable: true },
  'VAL-CHK-004': { taxonomy: 'Auth', hook: 'Auth fail · mixed DQN path', recoverable: true },
  'VAL-CHK-005': { taxonomy: 'Outage', hook: 'Bank outage · UPI', recoverable: true },
  'VAL-CART-001': { taxonomy: 'Payment page', hook: 'Stuck on pay step', recoverable: true },
  'VAL-CART-002': { taxonomy: 'Browsing', hook: 'Beats failure rules', recoverable: true, beatsRules: true },
  'VAL-CART-003': { taxonomy: 'Shipping', hook: 'Link cadence', recoverable: true },
  'VAL-SUB-001': { taxonomy: 'Expired', hook: 'Card expired', recoverable: false, badge: 'Hard val' },
  'VAL-SUB-002': { taxonomy: 'Funds', hook: 'Renewal insufficient funds', recoverable: true },
  'VAL-SUB-003': { taxonomy: 'Auth', hook: 'Card update loop', recoverable: true },
  'VAL-INV-001': { taxonomy: 'SMB', hook: '₹12.5k SMB', recoverable: true },
  'VAL-INV-002': { taxonomy: 'Enterprise', hook: '₹45k whale · 1-tick close', recoverable: true, whale: true },
  'VAL-INV-003': { taxonomy: 'SMB', hook: '₹8.9k SMB', recoverable: true },
};

export const CHECKOUT_TAXONOMY = ['Auth', 'Funds', 'Gateway', 'UPI', 'Outage'];

export function getCaseMeta(caseId) {
  return CASE_CATALOG[caseId] || { recoverable: true };
}

export function formatWedgeElapsed(wedgeId, t, windowHours) {
  const lane = WEDGE_BY_ID[wedgeId];
  const hours = t * windowHours;
  if (lane?.timeUnit === 'days') {
    const days = hours / 24;
    if (days < 1) return `D+${(days * 24).toFixed(0)}h`;
    return `D+${days.toFixed(1).replace(/\.0$/, '')}`;
  }
  return `T+${Math.round(hours)}h`;
}

export function formatWedgeClock(wedgeId, hoursElapsed) {
  const lane = WEDGE_BY_ID[wedgeId];
  if (lane?.timeUnit === 'days') {
    const d = hoursElapsed / 24;
    return `${d.toFixed(1)}d elapsed`;
  }
  return `${Math.round(hoursElapsed)}h elapsed`;
}
