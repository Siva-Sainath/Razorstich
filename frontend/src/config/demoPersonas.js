/** Curated validation runs — labels from val_scenarios fields, not invented customer names. */
export const DEMO_FLAGSHIP_ID = 'VAL-CHK-004';

export const DEMO_PERSONAS = [
  {
    caseId: 'VAL-CHK-004',
    label: 'VAL-CHK-004',
    hook: 'High-value auth fail',
    story: 'Mixed DQN actions across 9 simulator ticks',
    wedge: 'checkout_failed',
    accent: 'checkout',
    hero: 'action_mix',
  },
  {
    caseId: 'VAL-CHK-002',
    label: 'VAL-CHK-002',
    hook: 'Insufficient funds',
    story: 'Patience loop — escalate until recovery',
    wedge: 'checkout_failed',
    accent: 'checkout',
    hero: 'patience',
  },
  {
    caseId: 'VAL-CART-002',
    label: 'VAL-CART-002',
    hook: 'Beats failure rules',
    story: 'Cart idle · DQN path wins on ghost replay',
    wedge: 'cart_abandon',
    accent: 'cart',
    hero: 'beats_rules',
  },
  {
    caseId: 'VAL-INV-002',
    label: 'VAL-INV-002',
    hook: '₹45k enterprise invoice',
    story: 'Single-tick B2B escalation close',
    wedge: 'invoice_overdue',
    accent: 'invoice',
    hero: 'whale',
  },
  {
    caseId: 'VAL-CART-003',
    label: 'VAL-CART-003',
    hook: 'Shipping-step drop',
    story: 'Persistent payment-link cadence',
    wedge: 'cart_abandon',
    accent: 'cart',
    hero: 'link_cadence',
  },
  {
    caseId: 'VAL-SUB-003',
    label: 'VAL-SUB-003',
    hook: 'Renewal lane',
    story: '14-day window · card update loop',
    wedge: 'subscription_failed',
    accent: 'subscription',
    hero: 'renewal',
  },
];

export const WEDGE_ACCENT = {
  checkout: {
    glow: 'rgba(43, 138, 247, 0.12)',
    border: 'rgba(43, 138, 247, 0.35)',
    text: 'text-primary',
    bar: 'bg-primary/80',
  },
  cart: {
    glow: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.35)',
    text: 'text-warning',
    bar: 'bg-warning/80',
  },
  subscription: {
    glow: 'rgba(167, 139, 250, 0.12)',
    border: 'rgba(167, 139, 250, 0.35)',
    text: 'text-violet-300',
    bar: 'bg-violet-400/80',
  },
  invoice: {
    glow: 'rgba(45, 212, 191, 0.12)',
    border: 'rgba(45, 212, 191, 0.35)',
    text: 'text-teal-300',
    bar: 'bg-teal-400/80',
  },
};

export function getPersona(caseId) {
  return DEMO_PERSONAS.find((p) => p.caseId === caseId);
}
