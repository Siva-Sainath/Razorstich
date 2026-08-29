// Offline fallback: identical shape to GET /api/case/current + local policy mirror.

export const ACTIONS = [
  'wait', 'notify_sms', 'notify_whatsapp', 'notify_email', 'create_payment_link',
  'retry_same_method', 'retry_upi', 'offer_incentive', 'escalate_support', 'request_new_method', 'stop',
];

const CONTACT_ACTIONS = new Set(['notify_sms', 'notify_whatsapp', 'notify_email', 'create_payment_link', 'offer_incentive']);
const RETRY_ACTIONS = new Set(['retry_same_method', 'retry_upi']);

const Q_TABLE = [
  { wait: 2.27, notify_sms: 1.1, notify_whatsapp: 1.52, notify_email: 0.61, create_payment_link: 1.38, retry_same_method: 0.42, retry_upi: 0.88, offer_incentive: 0.75, escalate_support: 0.22, request_new_method: 0.51, stop: -0.8 },
  { wait: 1.94, notify_sms: 1.41, notify_whatsapp: 1.71, notify_email: 0.66, create_payment_link: 1.58, retry_same_method: 0.51, retry_upi: 0.97, offer_incentive: 0.88, escalate_support: 0.25, request_new_method: 0.55, stop: -0.62 },
  { wait: 1.62, notify_sms: 1.88, notify_whatsapp: 2.41, notify_email: 0.72, create_payment_link: 2.05, retry_same_method: 0.55, retry_upi: 1.02, offer_incentive: 1.05, escalate_support: 0.31, request_new_method: 0.62, stop: -0.44 },
  { wait: 2.1, notify_sms: 1.44, notify_whatsapp: 1.36, notify_email: 0.58, create_payment_link: 1.95, retry_same_method: 0.48, retry_upi: 1.18, offer_incentive: 1.12, escalate_support: 0.28, request_new_method: 0.57, stop: -0.31 },
  { wait: 2.27, notify_sms: 1.6, notify_whatsapp: 1.31, notify_email: 0.55, create_payment_link: 2.75, retry_same_method: 0.44, retry_upi: 1.25, offer_incentive: 1.34, escalate_support: 0.3, request_new_method: 0.6, stop: -0.22 },
  { wait: 2.02, notify_sms: 1.38, notify_whatsapp: 1.12, notify_email: 0.48, create_payment_link: 1.44, retry_same_method: 0.39, retry_upi: 1.21, offer_incentive: 1.85, escalate_support: 0.35, request_new_method: 0.58, stop: -0.1 },
  { wait: 1.78, notify_sms: 1.52, notify_whatsapp: 1.05, notify_email: 0.44, create_payment_link: 1.31, retry_same_method: 0.35, retry_upi: 1.15, offer_incentive: 1.72, escalate_support: 0.41, request_new_method: 0.55, stop: 0.05 },
  { wait: 1.35, notify_sms: 2.31, notify_whatsapp: 1.28, notify_email: 0.51, create_payment_link: 1.62, retry_same_method: 0.32, retry_upi: 1.34, offer_incentive: 2.58, escalate_support: 0.44, request_new_method: 0.52, stop: 0.18 },
  { wait: 1.9, notify_sms: 1.61, notify_whatsapp: 1.15, notify_email: 0.42, create_payment_link: 1.38, retry_same_method: 0.3, retry_upi: 1.66, offer_incentive: 1.48, escalate_support: 0.47, request_new_method: 0.49, stop: 0.36 },
  { wait: 1.21, notify_sms: 0.98, notify_whatsapp: 0.85, notify_email: 0.36, create_payment_link: 1.05, retry_same_method: 0.55, retry_upi: 2.66, offer_incentive: 0.92, escalate_support: 0.52, request_new_method: 0.46, stop: 0.64 },
  { wait: 0.42, notify_sms: 0.31, notify_whatsapp: 0.26, notify_email: 0.15, create_payment_link: 0.34, retry_same_method: 0.12, retry_upi: 0.48, offer_incentive: 0.28, escalate_support: 0.21, request_new_method: 0.18, stop: 2.9 },
  { wait: 0.22, notify_sms: 0.18, notify_whatsapp: 0.14, notify_email: 0.09, create_payment_link: 0.2, retry_same_method: 0.07, retry_upi: 0.25, offer_incentive: 0.16, escalate_support: 0.15, request_new_method: 0.11, stop: 3.02 },
];

const TICK_NOTES = [
  'Issuer decline velocity is elevated — waiting is the cheapest safe move.',
  'Issuer health improving; contact still premature.',
  'WhatsApp has the best open-rate for this customer at this hour.',
  "Customer just opened the link — observe, don't crowd.",
  'A UPI-preselected payment link converts best right now.',
  'Cool-off after abandonment; immediate follow-up feels like spam.',
  'Odds decaying slowly — holding the last contact for peak leverage.',
  'Price hesitation detected — a small cashback flips this cohort.',
  'Contact budget spent — waiting for the customer to move.',
  'Customer re-engaged — a UPI collect request closes it.',
  'Payment captured — episode complete, stop cleanly.',
  'Episode closed as RECOVERED.',
];

/** Client-side mirror of POST /api/policy/recommend for offline resilience. */
export const localRecommend = (tick, contactsUsed, method = 'card', hoursSinceFailure = 0) => {
  const tk = Math.max(0, Math.min(11, tick));
  const q = { ...Q_TABLE[tk] };
  const guardrails = [
    { rule: 'contact_budget', status: 'ok', note: `${contactsUsed} of 3 customer contacts used.` },
    { rule: 'upi_pending_window', status: 'ok', note: 'No NPCI auto-reversal in flight.' },
    { rule: 'duplicate_charge_risk', status: 'ok', note: 'No concurrent authorization detected.' },
  ];
  let legal = new Set(ACTIONS);
  if (contactsUsed >= 3) {
    CONTACT_ACTIONS.forEach((a) => legal.delete(a));
    guardrails[0] = { rule: 'contact_budget', status: 'enforced', note: 'Trust budget exhausted (3/3) — outreach actions masked; policy falls back to wait / retry / stop.' };
  }
  if (method === 'upi' && hoursSinceFailure < 6) {
    RETRY_ACTIONS.forEach((a) => legal.delete(a));
    guardrails[1] = { rule: 'upi_pending_window', status: 'enforced', note: 'UPI pending window — NPCI auto-reversal may be in flight; retries blocked, forcing wait.' };
  }
  const legalArr = [...legal];
  const selected = legalArr.reduce((best, a) => (q[a] > q[best] ? a : best), legalArr[0]);
  return {
    selected_action: selected,
    q_values: q,
    legal_actions: legalArr.sort(),
    policy_version: 'dqn-export-4748',
    source: 'dqn_export',
    constraints_passed: 3,
    constraints_total: 3,
    guardrails,
    tick: tk,
    note: TICK_NOTES[tk],
  };
};

export const FALLBACK_CASE = {
  case: {
    id: 'CASE-7F3A',
    paymentId: 'pay_NxT4bKQ2mYfA8c',
    orderId: 'order_NxT3zHkPq1',
    merchant: 'Aurora Fitness Pvt Ltd',
    amount: 2499.0,
    currency: 'INR',
    customer: 'Riya S.',
    method: 'card',
    failedAt: '2025-02-11T21:04:32+05:30',
    windowHours: 72,
    tickHours: 6,
    maxSteps: 12,
    declineCode: '05',
    declineReason: 'DO_NOT_HONOR',
    failureReason: 'issuer_declined_do_not_honor',
    errorSource: 'customer',
    issuer: 'HDFC Bank',
    network: 'VISA',
    status: 'recovering',
    maxContacts: 3,
  },
  events: [
    { t: 0.0, type: 'failure', severity: 'fail', label: 'payment.failed · card declined 05 DO_NOT_HONOR', detail: 'error_source: customer · issuer refused authorization.' },
    { t: 0.042, type: 'observe', severity: 'info', label: 'Agent ingested 41 signals · episode opened (72h)', detail: 'BIN health, issuer velocity, customer LTV, device trust.' },
    { t: 0.083, type: 'policy_eval', severity: 'info', label: 'Tick 1 · DQN chose wait', detail: 'Issuer decline velocity high — waiting is cheapest.' },
    { t: 0.167, type: 'policy_eval', severity: 'info', label: 'Tick 2 · DQN chose notify_whatsapp', detail: 'Best open-rate channel for this customer at this hour.' },
    { t: 0.18, type: 'intervention', severity: 'info', label: 'WhatsApp nudge sent · contact 1 of 3', detail: 'Template AUR-RECOV-2 with saved-order link.' },
    { t: 0.25, type: 'customer', severity: 'ok', label: 'Customer opened the recovery link', detail: 'Device match confirmed — same handset as original attempt.' },
    { t: 0.333, type: 'policy_eval', severity: 'info', label: 'Tick 4 · DQN chose create_payment_link', detail: 'Q=2.75 — UPI-preselected link converts best right now.' },
    { t: 0.347, type: 'intervention', severity: 'info', label: 'Payment link sent via SMS · contact 2 of 3', detail: 'UPI preselected · riya@okhdfc surfaced as primary.' },
    { t: 0.417, type: 'customer_drop', severity: 'warn', label: 'Customer viewed checkout, then abandoned', detail: 'Session idle 120s → classified as price hesitation (0.67).' },
    { t: 0.5, type: 'policy_eval', severity: 'info', label: 'Tick 6 · DQN chose wait — cool-off', detail: 'Immediate follow-up after abandonment reads as spam.' },
    { t: 0.583, type: 'policy_eval', severity: 'info', label: 'Tick 7 · DQN chose offer_incentive', detail: 'Price-hesitation cohort flips at ₹40 cashback.' },
    { t: 0.597, type: 'intervention', severity: 'info', label: '₹40 cashback SMS sent · contact 3 of 3', detail: 'Trust budget now exhausted — outreach masked from here.' },
    { t: 0.694, type: 'customer', severity: 'ok', label: 'Customer re-entered checkout', detail: 'Cashback ribbon rendered · offer countdown live.' },
    { t: 0.75, type: 'payment', severity: 'info', label: 'Tick 9 · retry_upi — collect request initiated', detail: 'riya@okhdfc · NPCI rail latency 128ms.' },
    { t: 0.833, type: 'captured', severity: 'ok', label: 'Payment captured · ₹2,499 recovered at T+60h', detail: 'Episode closed as RECOVERED. Net incentive cost ₹40 (1.6%).' },
  ],
  recoveryCurve: [
    { t: 0.0, p: 0.3 }, { t: 0.083, p: 0.33 }, { t: 0.167, p: 0.45 },
    { t: 0.25, p: 0.55 }, { t: 0.333, p: 0.62 }, { t: 0.417, p: 0.4 },
    { t: 0.5, p: 0.44 }, { t: 0.583, p: 0.58 }, { t: 0.694, p: 0.66 },
    { t: 0.75, p: 0.72 }, { t: 0.833, p: 0.95 }, { t: 1.0, p: 0.95 },
  ],
  ghostRuns: [
    { id: 'gr-chosen', label: 'Chosen policy path', prob: 0.78, chosen: true, reason: 'Selected — max net value under trust, dedupe and margin constraints.', points: [{ t: 0, p: 0.3 }, { t: 0.2, p: 0.42 }, { t: 0.4, p: 0.58 }, { t: 0.6, p: 0.52 }, { t: 0.8, p: 0.8 }, { t: 1, p: 0.95 }] },
    { id: 'gr-1', label: 'Retry burst at T+0', prob: 0.22, chosen: false, reason: 'Ruled out — issuer velocity lockout risk 0.63 while declines were spiking.', points: [{ t: 0, p: 0.3 }, { t: 0.2, p: 0.27 }, { t: 0.4, p: 0.23 }, { t: 0.6, p: 0.22 }, { t: 0.8, p: 0.22 }, { t: 1, p: 0.22 }] },
    { id: 'gr-2', label: 'Email-only outreach', prob: 0.31, chosen: false, reason: 'Ruled out — median email open of 4.2h wastes the best ticks of the window.', points: [{ t: 0, p: 0.3 }, { t: 0.2, p: 0.33 }, { t: 0.4, p: 0.36 }, { t: 0.6, p: 0.34 }, { t: 0.8, p: 0.32 }, { t: 1, p: 0.31 }] },
    { id: 'gr-3', label: 'No incentive, nudges only', prob: 0.48, chosen: false, reason: 'Ruled out — price-hesitation cohort converts 1.6× with a micro-incentive.', points: [{ t: 0, p: 0.3 }, { t: 0.2, p: 0.4 }, { t: 0.4, p: 0.52 }, { t: 0.6, p: 0.42 }, { t: 0.8, p: 0.46 }, { t: 1, p: 0.48 }] },
    { id: 'gr-4', label: 'Instant ₹100 discount', prob: 0.71, chosen: false, reason: 'Ruled out — breaches the ₹60 per-case incentive cap (margin guardrail).', points: [{ t: 0, p: 0.3 }, { t: 0.2, p: 0.46 }, { t: 0.4, p: 0.58 }, { t: 0.6, p: 0.64 }, { t: 0.8, p: 0.68 }, { t: 1, p: 0.71 }] },
  ],
  stages: [
    { from: 0.0, key: 'triage', label: 'Failure triage' },
    { from: 0.083, key: 'silent', label: 'Strategic wait' },
    { from: 0.167, key: 'nudge', label: 'WhatsApp nudge' },
    { from: 0.333, key: 'link', label: 'Payment link' },
    { from: 0.417, key: 'idle', label: 'Cool-off' },
    { from: 0.583, key: 'incentive', label: 'Incentive' },
    { from: 0.75, key: 'retry', label: 'UPI collect' },
    { from: 0.833, key: 'capture', label: 'Recovered' },
  ],
  interventions: {
    triage: { action: 'wait', channel: 'Internal', timing: 'Tick 1 · T+6h', message: 'No customer contact. Issuer decline velocity is elevated — retrying now would burn trust for a 4% gain. Re-evaluate at the next tick.', incentive: null, confidence: 0.62 },
    silent: { action: 'wait', channel: 'Internal', timing: 'Tick 1 · T+6h', message: 'No customer contact. Issuer decline velocity is elevated — retrying now would burn trust for a 4% gain. Re-evaluate at the next tick.', incentive: null, confidence: 0.62 },
    nudge: { action: 'notify_whatsapp', channel: 'WhatsApp', timing: 'Tick 2 · T+12h', message: 'Hi Riya — your Aurora Fitness order (₹2,499) is saved. Your bank declined the card, but you can finish in one tap with UPI: rzp.io/l/aur7f3a', incentive: null, confidence: 0.74 },
    link: { action: 'create_payment_link', channel: 'SMS', timing: 'Tick 4 · T+24h', message: 'Your Aurora Fitness order is one tap away — pay securely with UPI (riya@okhdfc preselected): rzp.io/l/aur7f3a', incentive: null, confidence: 0.78 },
    idle: { action: 'create_payment_link', channel: 'SMS', timing: 'Tick 4 · T+24h', message: 'Your Aurora Fitness order is one tap away — pay securely with UPI (riya@okhdfc preselected): rzp.io/l/aur7f3a', incentive: null, confidence: 0.78 },
    incentive: { action: 'offer_incentive', channel: 'SMS', timing: 'Tick 7 · T+42h', message: 'Riya, complete your Aurora Fitness order today and get ₹40 cashback: rzp.io/l/aur7f3a-c40', incentive: '₹40 cashback · expires with window', confidence: 0.81 },
    retry: { action: 'retry_upi', channel: 'UPI', timing: 'Tick 9 · T+54h', message: 'UPI collect request to riya@okhdfc for ₹2,499 — customer re-engaged, no further messaging needed.', incentive: '₹40 cashback active', confidence: 0.84 },
    capture: { action: 'stop', channel: 'Internal', timing: 'Tick 10 · T+60h', message: 'Payment captured. Episode closed as RECOVERED — stop cleanly, log reward, update counterfactual bank.', incentive: null, confidence: 0.97 },
  },
  trustLedger: [
    { t: 0.18, delta: -1, reason: 'WhatsApp nudge' },
    { t: 0.347, delta: -1, reason: 'Payment link via SMS' },
    { t: 0.597, delta: -1, reason: 'Reminder + ₹40 cashback' },
  ],
  riskSignals: [
    { k: 'balance_low_pattern', v: '0.71', tone: 'warn' },
    { k: 'retry_fatigue', v: '0.18', tone: 'ok' },
    { k: 'vpa_available', v: 'riya@okhdfc', tone: 'ok' },
    { k: 'past_upi_success', v: '9 / 11', tone: 'ok' },
    { k: 'device_trust', v: '0.93', tone: 'ok' },
    { k: 'card_testing_sig', v: 'none', tone: 'ok' },
  ],
  networkPath: [
    { node: 'Customer device', status: 'ok', meta: 'Android · Chrome 121' },
    { node: 'Razorpay gateway', status: 'ok', meta: 'auth 96ms' },
    { node: 'Card network · VISA', status: 'ok', meta: 'routed clean' },
    { node: 'Issuer · HDFC Bank', status: 'fail', meta: '05 DO_NOT_HONOR' },
  ],
};

export const FALLBACK_QUEUE = [
  { id: 'CASE-7F3A', customer: 'Riya S.', merchant: 'Aurora Fitness Pvt Ltd', amount: 2499, method: 'card', failureReason: 'issuer_declined_do_not_honor', status: 'recovering', odds: null, tick: null, isCurrent: true },
  { id: 'CASE-9K2D', customer: 'Aman T.', merchant: 'Nimbus Books', amount: 1249, method: 'upi', failureReason: 'upi_collect_expired', status: 'recovering', odds: 0.41, tick: 3, isCurrent: false },
  { id: 'CASE-2M6H', customer: 'Priya K.', merchant: 'Peak Nutrition', amount: 899, method: 'upi', failureReason: 'insufficient_funds', status: 'recovering', odds: 0.87, tick: 8, isCurrent: false },
  { id: 'CASE-4B8Q', customer: 'Dev M.', merchant: 'Statuesque Decor', amount: 7850, method: 'card', failureReason: 'gateway_timeout', status: 'queued', odds: 0.22, tick: 0, isCurrent: false },
  { id: 'CASE-8V1C', customer: 'Sana R.', merchant: 'Cobalt Audio', amount: 3150, method: 'card', failureReason: 'issuer_declined_do_not_honor', status: 'recovered', odds: 1.0, tick: 3, isCurrent: false },
];
