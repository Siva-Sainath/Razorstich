/** Plain-language labels for merchant-facing UI (no RL jargon). */

export const RECOVERY_TYPE_LABELS = {
  checkout_failed: 'Failed checkout',
  cart_abandon: 'Abandoned cart',
  subscription_failed: 'Failed subscription',
  invoice_overdue: 'Overdue invoice',
};

export function recoveryTypeLabel(wedgeId) {
  return RECOVERY_TYPE_LABELS[wedgeId] || 'Payment recovery';
}

export const ACTION_LABELS = {
  wait: 'Wait and watch',
  send_reminder: 'Send reminder',
  create_payment_link: 'Send payment link',
  offer_partial: 'Offer partial payment',
  switch_method: 'Suggest another payment method',
  notify_customer: 'Notify customer',
  escalate: 'Follow up personally',
  resend_invoice: 'Resend invoice',
  update_card: 'Ask to update card',
};

export function friendlyAction(action) {
  if (!action) return '—';
  return ACTION_LABELS[action] || action.replace(/_/g, ' ');
}
