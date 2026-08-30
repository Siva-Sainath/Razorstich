import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useTimeline } from '@/lib/timelineContext';
import { MetricNumber } from '@/components/kit/MetricNumber';
import { TrustBudgetGauge } from '@/components/svg/TrustBudgetGauge';
import { inr } from './stageUtils';

const ACTION_LABEL = {
  wait: 'Hold — strategic wait',
  notify_sms: 'Send SMS reminder',
  notify_whatsapp: 'Send WhatsApp with link',
  notify_email: 'Send email reminder',
  create_payment_link: 'Send UPI-preselected link',
  retry_same_method: 'Retry card quietly',
  retry_upi: 'Fire UPI collect',
  offer_incentive: 'Offer targeted cashback',
  escalate_support: 'Escalate to human support',
  request_new_method: 'Request new payment method',
  stop: 'Close episode',
};

export const StageContextPanel = () => {
  const {
    stageMode,
    intervention,
    livePolicy,
    contactsUsed,
    maxContacts,
    caseData,
    recovered,
    displayAmount,
    currentRolloutStep,
    activeAgent,
  } = useTimeline();

  const c = caseData?.case;
  const confidence = Math.round((intervention?.confidence || 0) * 100);

  return (
    <div className="h-full flex flex-col gap-4" data-testid="stage-context">
      <AnimatePresence mode="wait">
        {stageMode === 'outcome' ? (
          <motion.div
            key="outcome"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="gradient-border glint-top rounded-[20px] p-5 flex-1"
          >
            <p className="type-micro text-success">Episode closed</p>
            <h2 className="type-panel-title text-success mt-2">Revenue recovered</h2>
            <MetricNumber size="hero" className="mt-4 text-success">
              {inr(displayAmount.captured || c?.amount)}
            </MetricNumber>
            <p className="type-body mt-4 text-white/60">
              {c?.agentName || activeAgent?.name} closed the episode with net-positive simulator reward.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="surface-inset px-3 py-3">
                <p className="type-micro">Contacts used</p>
                <p className="type-metric mt-1">{contactsUsed}/{maxContacts}</p>
              </div>
              <div className="surface-inset px-3 py-3">
                <p className="type-micro">Policy</p>
                <p className="type-meta font-mono mt-1 truncate">{c?.policyVersion}</p>
              </div>
            </div>
          </motion.div>
        ) : stageMode === 'policy' ? (
          <motion.div
            key="policy-ctx"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="surface-1 rounded-[20px] border border-white/10 p-5 flex-1"
          >
            <p className="type-micro text-primary">Dueling DDQN forward pass</p>
            <h2 className="type-panel-title mt-2">Evaluating legal actions</h2>
            <p className="type-body mt-3 text-white/55 leading-relaxed">
              The policy reads episode state — failure reason, hours elapsed, contacts used — and ranks masked Q-values.
              The argmax becomes the next intervention.
            </p>
            {livePolicy?.note && (
              <p className="type-meta mt-4 surface-inset px-3 py-3 leading-relaxed">{livePolicy.note}</p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="intervene-ctx"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4 flex-1"
          >
            {intervention ? (
              <>
                <div className="surface-1 rounded-[20px] border border-primary/20 p-5">
                  <p className="type-micro text-accent">Agent recommendation</p>
                  <p data-testid="agent-chosen-action" className="type-section mt-2 text-white leading-snug">
                    {ACTION_LABEL[intervention.action] || intervention.action}
                  </p>
                  <p className="type-meta mt-2">
                    {intervention.channel} · {intervention.timing}
                  </p>
                  <div className="surface-inset p-3 mt-4">
                    <p className="type-micro mb-2">Draft</p>
                    <p data-testid="intervention-message" className="type-body text-white/85 leading-relaxed line-clamp-4">
                      “{intervention.message}”
                    </p>
                  </div>
                </div>

                <div>
                  <p className="type-micro mb-2">Trust budget</p>
                  <TrustBudgetGauge used={contactsUsed} max={maxContacts} />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="type-meta">Confidence</span>
                    <MetricNumber testId="agent-confidence" size="sm">{confidence}%</MetricNumber>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary/80 to-teal-400/85"
                      animate={{ width: `${confidence}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    data-testid="approve-intervention-btn"
                    className="flex-1 btn-primary"
                    onClick={() =>
                      toast.success('Step approved', {
                        description: `${intervention.action} queued for ${intervention.channel}.`,
                      })
                    }
                  >
                    Approve step
                  </Button>
                  <Button
                    data-testid="override-intervention-btn"
                    variant="ghost"
                    className="btn-quiet"
                    onClick={() => toast('Edit mode', { description: 'Manual review opened.' })}
                  >
                    Edit
                  </Button>
                </div>
              </>
            ) : (
              <div className="surface-inset p-5 flex-1 flex items-center justify-center">
                <p className="type-body text-white/45">Loading agent recommendation…</p>
              </div>
            )}

            {currentRolloutStep && (
              <p className="type-micro font-mono text-white/35 text-center">
                Rollout step {currentRolloutStep.step}: {currentRolloutStep.ui_action?.replace(/_/g, ' ')}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
