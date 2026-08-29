// Offline fallback: identical shape to GET /api/case/current.
// Keeps the demo alive even if the backend is unreachable.

export const FALLBACK_CASE = {
  case: {
    id: 'CASE-7F3A',
    paymentId: 'pay_NxT4bKQ2mYfA8c',
    orderId: 'order_NxT3zHkPq1',
    merchant: 'Aurora Fitness Pvt Ltd',
    amount: 2499.0,
    currency: 'INR',
    customer: 'Riya S.',
    method: 'card → upi',
    failedAt: '2025-02-11T21:04:32+05:30',
    windowMinutes: 90,
    declineCode: '05',
    declineReason: 'DO_NOT_HONOR',
    issuer: 'HDFC Bank',
    network: 'VISA',
    status: 'recovering',
  },
  events: [
    { t: 0.0, type: 'failure', severity: 'fail', label: 'Issuer declined · 05 DO_NOT_HONOR', detail: 'HDFC issuer refused authorization. Raw ARN trace captured.' },
    { t: 0.06, type: 'observe', severity: 'info', label: 'Agent ingested failure context · 41 signals', detail: 'Card BIN health, issuer decline velocity, customer LTV, device trust.' },
    { t: 0.1, type: 'policy_eval', severity: 'info', label: 'Policy evaluated 4 candidate actions', detail: 'Chose WAIT_RETRY — silent re-route beats immediate contact.' },
    { t: 0.16, type: 'retry', severity: 'warn', label: 'Silent retry via backup rail AXIS → NPCI', detail: 'Re-routed authorization attempt, no customer contact.' },
    { t: 0.2, type: 'retry_failed', severity: 'fail', label: 'Retry failed · network timeout 5xx', detail: 'Backup rail timed out at switch. Issuer never reached.' },
    { t: 0.28, type: 'policy_eval', severity: 'info', label: 'Policy re-evaluated · contact unlocked', detail: 'Chose WHATSAPP_NUDGE with UPI intent deep link.' },
    { t: 0.32, type: 'intervention', severity: 'info', label: 'WhatsApp nudge dispatched · UPI intent link', detail: 'Template AUR-RECOV-2 · trust budget −12.' },
    { t: 0.44, type: 'customer', severity: 'ok', label: 'Customer opened recovery link', detail: 'Device match confirmed · same handset as original attempt.' },
    { t: 0.5, type: 'customer', severity: 'ok', label: 'Checkout rendered · UPI preselected', detail: 'Saved VPA riya@okhdfc surfaced as primary.' },
    { t: 0.58, type: 'customer_drop', severity: 'warn', label: 'Customer abandoned checkout', detail: 'Session idle 120s → classified as price hesitation (0.67).' },
    { t: 0.66, type: 'policy_eval', severity: 'info', label: 'Policy re-evaluated · incentive unlocked', detail: 'Chose INCENTIVE_SMS · ₹40 cashback within margin cap.' },
    { t: 0.7, type: 'intervention', severity: 'info', label: 'SMS with ₹40 cashback dispatched', detail: '30-minute expiry window attached · trust budget −14.' },
    { t: 0.82, type: 'customer', severity: 'ok', label: 'Customer re-entered checkout', detail: 'Cashback ribbon rendered · offer countdown 22:41 remaining.' },
    { t: 0.88, type: 'payment', severity: 'info', label: 'UPI collect request initiated', detail: 'riya@okhdfc · NPCI rail latency 128ms.' },
    { t: 0.94, type: 'captured', severity: 'ok', label: 'Payment captured · ₹2,499 recovered', detail: 'Case closed as RECOVERED. Net incentive cost ₹40 (1.6%).' },
  ],
  recoveryCurve: [
    { t: 0.0, p: 0.34 }, { t: 0.06, p: 0.36 }, { t: 0.1, p: 0.42 },
    { t: 0.16, p: 0.4 }, { t: 0.2, p: 0.31 }, { t: 0.28, p: 0.47 },
    { t: 0.32, p: 0.52 }, { t: 0.44, p: 0.61 }, { t: 0.5, p: 0.66 },
    { t: 0.58, p: 0.44 }, { t: 0.66, p: 0.58 }, { t: 0.7, p: 0.64 },
    { t: 0.82, p: 0.78 }, { t: 0.88, p: 0.86 }, { t: 0.94, p: 0.97 },
    { t: 1.0, p: 0.97 },
  ],
  ghostRuns: [
    {
      id: 'gr-chosen', label: 'Chosen policy path', prob: 0.78, chosen: true,
      reason: 'Selected — max expected recovery under trust + margin constraints.',
      points: [{ t: 0, p: 0.34 }, { t: 0.2, p: 0.4 }, { t: 0.4, p: 0.6 }, { t: 0.6, p: 0.5 }, { t: 0.8, p: 0.78 }, { t: 1, p: 0.97 }],
    },
    {
      id: 'gr-1', label: '3× hard retry burst', prob: 0.22, chosen: false,
      reason: 'Rejected — issuer velocity lockout risk 0.63, trust burn −34.',
      points: [{ t: 0, p: 0.34 }, { t: 0.2, p: 0.3 }, { t: 0.4, p: 0.24 }, { t: 0.6, p: 0.22 }, { t: 0.8, p: 0.22 }, { t: 1, p: 0.22 }],
    },
    {
      id: 'gr-2', label: 'Email receipt + link', prob: 0.31, chosen: false,
      reason: 'Rejected — slow channel, median open 4.2h exceeds recovery window.',
      points: [{ t: 0, p: 0.34 }, { t: 0.2, p: 0.36 }, { t: 0.4, p: 0.38 }, { t: 0.6, p: 0.35 }, { t: 0.8, p: 0.33 }, { t: 1, p: 0.31 }],
    },
    {
      id: 'gr-3', label: 'Nudge only, no incentive', prob: 0.48, chosen: false,
      reason: 'Rejected — price-hesitation cohort converts 1.6× with micro-incentive.',
      points: [{ t: 0, p: 0.34 }, { t: 0.2, p: 0.42 }, { t: 0.4, p: 0.55 }, { t: 0.6, p: 0.44 }, { t: 0.8, p: 0.47 }, { t: 1, p: 0.48 }],
    },
    {
      id: 'gr-4', label: 'Instant ₹100 discount', prob: 0.71, chosen: false,
      reason: 'Rejected — breaches merchant incentive cap (₹60/case) · margin guard.',
      points: [{ t: 0, p: 0.34 }, { t: 0.2, p: 0.5 }, { t: 0.4, p: 0.62 }, { t: 0.6, p: 0.68 }, { t: 0.8, p: 0.7 }, { t: 1, p: 0.71 }],
    },
  ],
  policySnapshots: [
    {
      t: 0.1, chosen: 'WAIT_RETRY', confidence: 0.62,
      stateFeatures: [
        { k: 'decline_code', v: '05' }, { k: 'issuer_health', v: '0.81' },
        { k: 'retry_fatigue', v: '0.18' }, { k: 'customer_ltv', v: '₹18.4k' },
      ],
      candidates: [
        { action: 'WAIT_RETRY', q: 0.42, note: 'Silent re-route, zero trust cost' },
        { action: 'WHATSAPP_NUDGE', q: 0.38, note: 'Early contact, premature' },
        { action: 'HARD_RETRY', q: 0.22, note: 'Lockout risk 0.63' },
        { action: 'EMAIL_LINK', q: 0.19, note: 'Too slow for window' },
      ],
    },
    {
      t: 0.28, chosen: 'WHATSAPP_NUDGE', confidence: 0.74,
      stateFeatures: [
        { k: 'retry_state', v: 'failed×2' }, { k: 'vpa_on_file', v: 'true' },
        { k: 'wa_opt_in', v: 'true' }, { k: 'window_left', v: '65m' },
      ],
      candidates: [
        { action: 'WHATSAPP_NUDGE', q: 0.61, note: 'UPI deep link, device match' },
        { action: 'SMS_NUDGE', q: 0.44, note: 'Lower open rate cohort' },
        { action: 'INCENTIVE_NOW', q: 0.4, note: 'Premature spend' },
        { action: 'WAIT', q: 0.27, note: 'Window decay penalty' },
      ],
    },
    {
      t: 0.66, chosen: 'INCENTIVE_SMS', confidence: 0.81,
      stateFeatures: [
        { k: 'drop_reason', v: 'price 0.67' }, { k: 'trust_left', v: '80' },
        { k: 'incentive_cap', v: '₹60' }, { k: 'window_left', v: '31m' },
      ],
      candidates: [
        { action: 'INCENTIVE_SMS', q: 0.64, note: '₹40 cashback, 30m expiry' },
        { action: 'INCENTIVE_WA', q: 0.58, note: 'Channel fatigue risk' },
        { action: 'NO_ACTION', q: 0.31, note: 'Window decays to 0.29' },
        { action: 'AGENT_CALLBACK', q: 0.2, note: 'Cost ₹85 > margin' },
      ],
    },
  ],
  stages: [
    { from: 0.0, key: 'triage', label: 'Failure triage' },
    { from: 0.1, key: 'silent', label: 'Silent retry' },
    { from: 0.28, key: 'nudge', label: 'WhatsApp nudge' },
    { from: 0.5, key: 'watch', label: 'Customer session' },
    { from: 0.66, key: 'incentive', label: 'Incentive deployment' },
    { from: 0.88, key: 'capture', label: 'Capture & recovery' },
  ],
  interventions: {
    triage: {
      action: 'WAIT_RETRY', channel: 'Internal', timing: 't+9m',
      message: 'No customer contact. Re-route authorization via AXIS backup rail and observe issuer health before spending trust budget.',
      incentive: null, confidence: 0.62,
    },
    silent: {
      action: 'WAIT_RETRY', channel: 'Internal', timing: 't+9m',
      message: 'No customer contact. Re-route authorization via AXIS backup rail and observe issuer health before spending trust budget.',
      incentive: null, confidence: 0.62,
    },
    nudge: {
      action: 'WHATSAPP_NUDGE', channel: 'WhatsApp', timing: 't+24m',
      message: 'Hi Riya — your Aurora Fitness order (₹2,499) is saved. Your bank declined the card, but you can finish in one tap with UPI: rzp.io/l/aur7f3a',
      incentive: null, confidence: 0.74,
    },
    watch: {
      action: 'WHATSAPP_NUDGE', channel: 'WhatsApp', timing: 't+24m',
      message: 'Hi Riya — your Aurora Fitness order (₹2,499) is saved. Your bank declined the card, but you can finish in one tap with UPI: rzp.io/l/aur7f3a',
      incentive: null, confidence: 0.74,
    },
    incentive: {
      action: 'INCENTIVE_SMS', channel: 'SMS', timing: 't+59m',
      message: 'Riya, complete your Aurora Fitness order in the next 30 min and get ₹40 cashback: rzp.io/l/aur7f3a-c40',
      incentive: '₹40 cashback · 30m expiry', confidence: 0.81,
    },
    capture: {
      action: 'INCENTIVE_SMS', channel: 'SMS', timing: 't+59m',
      message: 'Riya, complete your Aurora Fitness order in the next 30 min and get ₹40 cashback: rzp.io/l/aur7f3a-c40',
      incentive: '₹40 cashback · 30m expiry', confidence: 0.81,
    },
  },
  trustLedger: [
    { t: 0.16, delta: -8, reason: 'Silent retry (backup rail)' },
    { t: 0.32, delta: -12, reason: 'WhatsApp nudge sent' },
    { t: 0.7, delta: -14, reason: 'SMS + ₹40 incentive' },
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
    { node: 'Card network · VISA', status: 'ok', meta: 'routed 07:34:12' },
    { node: 'Issuer · HDFC Bank', status: 'fail', meta: '05 DO_NOT_HONOR' },
  ],
};
