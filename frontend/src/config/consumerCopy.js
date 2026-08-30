/** Plain-language labels for merchant-facing UI (no RL jargon). */

export const RECOVERY_TYPE_LABELS = {
  checkout_failed: 'Failed checkout',
  cart_abandon: 'Abandoned cart',
  subscription_failed: 'Failed subscription',
  invoice_overdue: 'Overdue invoice',
};

export const RECOVERY_SCENARIO_SHORT = {
  checkout_failed: 'Checkout',
  cart_abandon: 'Cart',
  subscription_failed: 'Subscription',
  invoice_overdue: 'Invoice',
};

export function recoveryTypeLabel(wedgeId) {
  return RECOVERY_TYPE_LABELS[wedgeId] || 'Payment recovery';
}

/** Plain label for research/demo UI. */
export function recoveryScenarioLabel(id, { short = false } = {}) {
  if (!id) return short ? 'Scenario' : 'Recovery scenario';
  if (short) return RECOVERY_SCENARIO_SHORT[id] || id.replace(/_/g, ' ');
  return RECOVERY_TYPE_LABELS[id] || id.replace(/_/g, ' ');
}

export const ACTION_LABELS = {
  wait: 'Wait and watch',
  stop: 'Stop outreach',
  send_reminder: 'Send reminder',
  create_payment_link: 'Send payment link',
  offer_partial: 'Offer partial payment',
  offer_incentive: 'Offer a small incentive',
  switch_method: 'Suggest another payment method',
  notify_customer: 'Notify customer',
  notify_sms: 'Send SMS reminder',
  notify_whatsapp: 'Send WhatsApp message',
  notify_email: 'Send email',
  escalate: 'Follow up personally',
  escalate_support: 'Escalate to human support',
  request_new_method: 'Request new payment method',
  retry_same_method: 'Retry the same card',
  retry_upi: 'Retry UPI payment',
  resend_invoice: 'Resend invoice',
  update_card: 'Ask to update card',
};

/** Customer-facing channel outcomes (ui_action from rollout). */
export const UI_ACTION_LABELS = {
  wait: 'Waiting for the right moment',
  stop: 'No further outreach',
  create_payment_link: 'Payment link delivered',
  offer_incentive: 'Incentive shown at checkout',
  notify_sms: 'SMS sent to customer',
  notify_whatsapp: 'WhatsApp message sent',
  notify_email: 'Email sent',
  escalate_support: 'Support team engaged',
  request_new_method: 'Asked for a new payment method',
  retry_same_method: 'Card retry screen shown',
  retry_upi: 'UPI retry screen shown',
};

export function friendlyAction(action) {
  if (!action) return '—';
  const key = String(action).toLowerCase();
  return ACTION_LABELS[key] || key.replace(/_/g, ' ');
}

export function friendlyUiAction(uiAction) {
  if (!uiAction) return '—';
  const key = String(uiAction).toLowerCase();
  return UI_ACTION_LABELS[key] || friendlyAction(key);
}

/** True when RL action and UI action describe the same thing to a merchant. */
export function actionsAreRedundant(rlAction, uiAction) {
  if (!rlAction || !uiAction) return true;
  const a = friendlyAction(rlAction).toLowerCase();
  const b = friendlyUiAction(uiAction).toLowerCase();
  if (a === b) return true;
  if (uiAction.includes('escalate') && rlAction.includes('escalate')) return true;
  if (uiAction.includes('notify') && rlAction.includes('notify')) return true;
  if (uiAction.includes('link') && rlAction.includes('link')) return true;
  if (uiAction.includes('retry') && rlAction.includes('retry')) return true;
  return false;
}
