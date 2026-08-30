import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useTimeline } from '@/lib/timelineContext';
import { Panel } from './Panel';
import { MetricNumber } from '@/components/kit/MetricNumber';
import { TrustBudgetGauge } from '@/components/svg/TrustBudgetGauge';

const ACTION_LABEL = {
  wait: 'Hold — strategic wait',
  notify_sms: 'Send an SMS reminder',
  notify_whatsapp: 'Send a WhatsApp reminder with a payment link',
  notify_email: 'Send an email reminder',
  create_payment_link: 'Send a UPI-preselected payment link',
  retry_same_method: 'Retry the card quietly',
  retry_upi: 'Fire a UPI collect request',
  offer_incentive: 'Offer a targeted cashback',
  escalate_support: 'Escalate to human support',
  request_new_method: 'Ask for another payment method',
  stop: 'Close the episode',
};

export const InterventionComposer = ({ className }) => {
  const { intervention, activeAgent, livePolicy, contactsUsed, maxContacts } = useTimeline();
  if (!intervention) return null;
  const confidence = Math.round((intervention.confidence || 0) * 100);
  const fromLivePolicy = intervention.source === 'live_policy' || Boolean(livePolicy);

  return (
    <Panel
      title="Agent recommendation"
      subtitle={
        fromLivePolicy
          ? `${intervention.agentName || activeAgent?.name || 'DQN agent'} · live forward pass`
          : 'From episode rollout · approve or edit before send'
      }
      testId="intervention-composer"
      className={className}
      variant="primary"
      figure="FIG.3"
      bodyClassName="pt-3 flex flex-col gap-5"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={intervention.action}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } }}
          exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
          className="flex flex-col gap-5"
        >
          <div>
            <p data-testid="agent-chosen-action" className="type-section text-white leading-snug">
              {ACTION_LABEL[intervention.action] || intervention.action}
            </p>
            <p className="type-meta mt-2">
              Via {intervention.channel} · {intervention.timing}
              {intervention.incentive && (
                <span data-testid="intervention-incentive" className="text-warning"> · {intervention.incentive}</span>
              )}
            </p>
          </div>

          <div className="surface-inset p-4">
            <p className="type-micro mb-2">Draft message</p>
            <p data-testid="intervention-message" className="type-body text-white/88 leading-relaxed">
              “{intervention.message}”
            </p>
          </div>

          <div>
            <p className="type-micro mb-2">Trust budget</p>
            <TrustBudgetGauge used={contactsUsed} max={maxContacts} />
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="type-meta">Policy confidence</span>
              <MetricNumber testId="agent-confidence" size="md">
                {confidence}%
              </MetricNumber>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary/80 to-[rgba(45,212,191,0.85)]"
                initial={{ width: 0 }}
                animate={{ width: `${confidence}%` }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <p className="type-micro mt-2">
              {fromLivePolicy
                ? 'Masked argmax over Q-values · re-evaluated each tick'
                : 'Best action from DQN rollout replay'}
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              data-testid="approve-intervention-btn"
              onClick={() =>
                toast.success('Recommendation approved', {
                  description: `${intervention.agentName || 'Agent'} will execute ${intervention.action} via ${intervention.channel}.`,
                })
              }
              className="flex-1 btn-primary"
            >
              Approve next step
            </Button>
            <Button
              data-testid="override-intervention-btn"
              variant="ghost"
              onClick={() =>
                toast('Sent for manual review', {
                  description: 'Edit the drafted copy before it goes out.',
                })
              }
              className="btn-quiet"
            >
              Edit
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </Panel>
  );
};
