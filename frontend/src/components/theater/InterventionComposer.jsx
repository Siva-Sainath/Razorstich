import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useTimeline } from '@/lib/timelineContext';
import { Panel } from './Panel';

const ACTION_LABEL = {
  wait: 'Hold — strategic wait',
  notify_whatsapp: 'Send a WhatsApp reminder with a UPI link',
  create_payment_link: 'Send a UPI-preselected payment link',
  offer_incentive: 'Text a ₹40 cashback offer',
  retry_upi: 'Fire a UPI collect request',
  stop: 'Close the episode — recovered',
};

export const InterventionComposer = ({ className }) => {
  const { intervention } = useTimeline();
  if (!intervention) return null;
  const confidence = Math.round((intervention.confidence || 0) * 100);

  return (
    <Panel
      title="AI’s next step"
      subtitle="Approve it in one click — or edit before it goes out."
      testId="intervention-composer"
      className={className}
      variant="focus"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={intervention.action}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } }}
          exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
          className="flex flex-col h-full"
        >
          <p data-testid="agent-chosen-action" className="text-[19px] font-semibold text-white leading-snug">
            {ACTION_LABEL[intervention.action] || intervention.action}
          </p>
          <p className="text-sm text-white/50 mt-1.5">
            Via {intervention.channel} · scheduled {intervention.timing}
            {intervention.incentive && (
              <span data-testid="intervention-incentive" className="text-warning"> · {intervention.incentive}</span>
            )}
          </p>

          <div className="mt-5 rounded-[16px] bg-white/[0.03] border border-white/[0.08] p-5">
            <p data-testid="intervention-message" className="text-[15px] leading-relaxed text-white/85">
              “{intervention.message}”
            </p>
          </div>

          <div className="mt-5">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-sm text-white/55">AI confidence</span>
              <span data-testid="agent-confidence" className="text-lg font-semibold tabular-nums text-white">
                {confidence}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${confidence}%` }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <p className="text-[13px] text-white/40 mt-2">Best of 11 actions, re-evaluated every 6 hours</p>
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              data-testid="approve-intervention-btn"
              onClick={() =>
                toast.success('Next step approved', {
                  description: `The ${intervention.channel} message will go out as recommended.`,
                })
              }
              className="flex-1 h-9 rounded-[12px] bg-primary text-primary-foreground hover:bg-primary/90 text-[13px] font-semibold transition-colors duration-150 active:scale-[0.98]"
            >
              Approve next step
            </Button>
            <Button
              data-testid="override-intervention-btn"
              variant="ghost"
              onClick={() =>
                toast('Sent for manual review', {
                  description: 'You can edit the message before it goes out.',
                })
              }
              className="h-9 px-4 rounded-[12px] bg-white/[0.05] border border-white/10 text-white/75 hover:text-white hover:bg-white/[0.09] text-[13px] font-medium transition-colors duration-150 active:scale-[0.98]"
            >
              Edit
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </Panel>
  );
};
