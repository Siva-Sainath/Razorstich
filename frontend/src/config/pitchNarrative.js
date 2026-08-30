/**
 * Pitch / demo narration — plain language for live pitches and recorded walkthroughs.
 * Pair with PitchNarrator + pitch mode (auto-pause between steps).
 */

export const WEDGE_PITCH = {
  checkout_failed: {
    agent: 'Checkout recovery agent',
    handles: 'Failed card & UPI payments',
    mission:
      'Watches a declined checkout and decides when to retry, send a payment link, or wait — without spamming the customer.',
    window: '72-hour recovery window',
  },
  cart_abandon: {
    agent: 'Cart recovery agent',
    handles: 'Abandoned carts',
    mission:
      'Tracks shoppers who left items behind and picks the right moment to send a reminder or payment link.',
    window: '48-hour intent window',
  },
  subscription_failed: {
    agent: 'Subscription recovery agent',
    handles: 'Failed renewals',
    mission:
      'Helps subscribers update cards or retry billing before they churn — especially around renewal day.',
    window: '14-day renewal window',
  },
  invoice_overdue: {
    agent: 'Invoice recovery agent',
    handles: 'Overdue B2B invoices',
    mission:
      'Runs a polite dunning sequence for overdue invoices — reminders, partial offers, and escalation when needed.',
    window: '30-day dunning window',
  },
};

export const STAGE_PITCH = {
  failure: {
    title: 'Payment failed',
    say: 'The customer tried to pay but it did not go through. Razorpay sent us the failure event.',
    detail: 'The agent opens a recovery episode — same customer, same cart, clock starts.',
  },
  observe: {
    title: 'Agent is watching',
    say: 'The agent waits and reads the situation — amount, failure reason, and how many messages we have already sent.',
    detail: 'No blast yet. It is building context before the first nudge.',
  },
  policy: {
    title: 'Agent is deciding',
    say: 'The model ranks every allowed next step — wait, payment link, SMS, partial offer — and picks the best one.',
    detail: 'Safety rules can block actions that would burn trust or violate timing.',
  },
  intervene: {
    title: 'Customer gets a nudge',
    say: 'The chosen action goes out on the right channel — SMS, WhatsApp, email, or a fresh payment link.',
    detail: 'You only pay on Growth when money actually comes back.',
  },
  outcome: {
    title: 'Revenue recovered',
    say: 'Payment captured. The episode closes and the merchant books the recovered amount.',
    detail: 'Full audit trail — what was tried, when, and what worked.',
  },
};

const ACTION_PITCH = {
  wait: {
    say: 'The agent chooses to wait — the customer may retry on their own soon.',
    detail: 'Patience is often the highest-value move on insufficient funds or bank delays.',
  },
  create_payment_link: {
    say: 'A fresh Razorpay payment link goes to the customer — one tap to complete checkout.',
    detail: 'Common on high-intent carts and failed checkouts.',
  },
  notify_sms: {
    say: 'A short SMS reminder — low friction, high open rate.',
    detail: 'Timed so we do not feel spammy.',
  },
  notify_whatsapp: {
    say: 'WhatsApp message with context and a pay link.',
    detail: 'Works well for Indian D2C and subscription renewals.',
  },
  notify_email: {
    say: 'Email follow-up — often used for B2B invoices and larger amounts.',
    detail: 'Pairs with net terms and AR workflows.',
  },
  offer_incentive: {
    say: 'A small incentive or partial path to close — only when the model expects lift.',
    detail: 'Guardrails cap how aggressive we can be.',
  },
  retry_upi: {
    say: 'Suggest UPI retry — good when the original method was card and UPI is available.',
    detail: 'Method switch can unlock instant success.',
  },
  retry_same_method: {
    say: 'Gentle retry on the same payment method after a short wait.',
    detail: 'Used when transient gateway errors are likely.',
  },
  escalate_support: {
    say: 'Human-style escalation — for high-value carts or enterprise invoices.',
    detail: 'Can pair with voice recovery in production.',
  },
  escalate_human: {
    say: 'Human-style escalation — for high-value carts or enterprise invoices.',
    detail: 'Can pair with voice recovery in production.',
  },
  request_method_update: {
    say: 'Ask the customer to update their card or payment method.',
    detail: 'Critical for subscription renewals after expiry.',
  },
  offer_partial: {
    say: 'Partial payment offer to unblock a large overdue invoice.',
    detail: 'Common in B2B dunning when full pay is stuck.',
  },
  resend_invoice: {
    say: 'Invoice resent with clear pay instructions.',
    detail: 'First step in many AR sequences.',
  },
  request_new_method: {
    say: 'Ask the customer to update their card or payment method.',
    detail: 'Critical for subscription renewals after expiry.',
  },
  stop: {
    say: 'Agent stops outreach — trust budget spent or case marked unrecoverable.',
    detail: 'Protects brand and deliverability.',
  },
};

export const PITCH_SPEED_PRESETS = [
  { id: 'slow', label: 'Slow', speed: 0.45, hint: '~2 min · best for recording' },
  { id: 'pitch', label: 'Pitch', speed: 0.65, hint: '~80s · live demos' },
  { id: 'normal', label: 'Normal', speed: 1, hint: '~52s · quick replay' },
];

export function getPitchBeat({
  wedge,
  stageMode,
  currentRolloutStep,
  intervention,
  recovered,
  caseMeta,
}) {
  const wedgeInfo = WEDGE_PITCH[wedge] || WEDGE_PITCH.checkout_failed;
  const stage = STAGE_PITCH[stageMode] || STAGE_PITCH.observe;

  const rlAction =
    currentRolloutStep?.rl_action || intervention?.action || livePolicyAction(intervention);
  const actionPitch = rlAction ? ACTION_PITCH[rlAction] : null;
  const uiAction = currentRolloutStep?.ui_action?.replace(/_/g, ' ');

  let title = stage.title;
  let say = stage.say;
  let detail = stage.detail;

  if (stageMode === 'intervene' && actionPitch) {
    title = uiAction ? `Action: ${uiAction}` : title;
    say = actionPitch.say;
    detail = actionPitch.detail;
  } else if (stageMode === 'policy' && intervention?.action) {
    const ap = ACTION_PITCH[intervention.action];
    if (ap) {
      say = `Top recommendation right now: ${intervention.action.replace(/_/g, ' ')}. ${ap.say}`;
      detail = ap.detail;
    }
  }

  if (recovered) {
    title = 'Payment recovered';
    say = `₹${Number(caseMeta?.amount || 0).toLocaleString('en-IN')} is back. This is what merchants pay us 2.5% on — only on success.`;
    detail = STAGE_PITCH.outcome.detail;
  }

  return {
    agent: wedgeInfo.agent,
    handles: wedgeInfo.handles,
    mission: wedgeInfo.mission,
    window: wedgeInfo.window,
    title,
    say,
    detail,
    stepLabel: currentRolloutStep
      ? `Step ${currentRolloutStep.step + 1}${uiAction ? ` · ${uiAction}` : ''}`
      : null,
  };
}

function livePolicyAction(intervention) {
  return intervention?.action;
}
