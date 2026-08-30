/** Map rollout step to customer phone screen phase. */
export function customerPhaseFromRollout(rolloutSteps, t, recovered) {
  if (recovered) return 'ok';
  const steps = rolloutSteps.filter((s) => s.t <= t);
  if (!steps.length) return 'fail';
  const last = steps[steps.length - 1];
  const ui = last.ui_action || '';
  if (ui === 'escalate_support') return 'support';
  if (ui.includes('notify') || ui === 'create_payment_link' || ui === 'offer_incentive') return 'msg';
  if (ui.includes('retry')) return 'pay';
  if (last.recovered) return 'ok';
  return 'fail';
}

export const STAGE_MODE_LABEL = {
  failure: 'Payment failed',
  observe: 'Watching the case',
  policy: 'Choosing next step',
  intervene: 'Reaching the customer',
  outcome: 'Money recovered',
};

export const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
