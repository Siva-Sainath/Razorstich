import {
  friendlyAction,
  friendlyUiAction,
  actionsAreRedundant,
} from './consumerCopy';

describe('consumerCopy', () => {
  it('maps RL actions to plain language', () => {
    expect(friendlyAction('escalate_support')).toBe('Escalate to human support');
    expect(friendlyAction('create_payment_link')).toBe('Send payment link');
  });

  it('maps UI actions to customer-facing language', () => {
    expect(friendlyUiAction('escalate_support')).toBe('Support team engaged');
    expect(friendlyUiAction('create_payment_link')).toBe('Payment link delivered');
  });

  it('detects redundant RL vs UI action pairs', () => {
    expect(actionsAreRedundant('escalate_support', 'escalate_support')).toBe(true);
    expect(actionsAreRedundant('notify_sms', 'escalate_support')).toBe(false);
  });

  it('does not expose raw snake_case in friendly labels', () => {
    const label = friendlyAction('request_new_method');
    expect(label).not.toMatch(/_/);
  });
});
