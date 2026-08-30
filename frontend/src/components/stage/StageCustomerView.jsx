import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Headphones, XCircle } from 'lucide-react';
import { useTimeline } from '@/lib/timelineContext';
import { customerPhaseFromRollout, inr } from './stageUtils';

const fade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

export const StageCustomerView = () => {
  const { caseData, rolloutSteps, t, recovered, intervention } = useTimeline();
  const c = caseData?.case;
  const amount = inr(c?.amount);
  const phase = customerPhaseFromRollout(rolloutSteps, t, recovered);

  return (
    <div className="flex flex-col items-center justify-center h-full py-4" data-testid="stage-customer-view">
      <div className="w-full max-w-[280px] rounded-[28px] border border-white/12 bg-white/[0.04] p-3 shadow-[var(--shadow-2)]">
        <div className="rounded-[20px] bg-background border border-white/[0.08] min-h-[300px] p-4 flex flex-col">
          <div className="w-12 h-1 rounded-full bg-white/15 mx-auto mb-4" aria-hidden="true" />
          <AnimatePresence mode="wait">
            <motion.div key={phase} {...fade} className="flex-1 flex flex-col justify-center text-center">
              {phase === 'fail' && (
                <>
                  <XCircle size={40} className="text-destructive mx-auto mb-3" />
                  <p className="type-section text-white/90">Payment failed</p>
                  <p className="type-meta mt-2">{c?.declineReason || c?.failureReason?.replace(/_/g, ' ')}</p>
                  <p className="font-mono type-body text-white/50 mt-3">{amount}</p>
                </>
              )}
              {phase === 'msg' && (
                <div className="rounded-[14px] bg-success/10 border border-success/25 p-4 text-left">
                  <p className="type-meta text-white/70">{intervention?.channel || 'Message'} · Agent outreach</p>
                  <p className="type-body text-white/90 mt-2 leading-relaxed">
                    {intervention?.message?.slice(0, 120) || `Complete your ${amount} order in one tap.`}
                  </p>
                </div>
              )}
              {phase === 'pay' && (
                <div className="space-y-3 text-left">
                  <p className="type-meta text-center text-white/55">Retry checkout</p>
                  <div className="rounded-[12px] border border-primary/30 bg-primary/10 px-3 py-2 type-body text-center">
                    {c?.method === 'upi' ? 'UPI collect' : 'Card retry'}
                  </div>
                  <div className="rounded-[12px] bg-primary text-primary-foreground py-3 type-body font-semibold text-center">
                    Pay {amount}
                  </div>
                </div>
              )}
              {phase === 'support' && (
                <>
                  <Headphones size={40} className="text-primary mx-auto mb-3" />
                  <p className="type-section text-white/90">Support engaged</p>
                  <p className="type-meta mt-2">Human follow-up · DQN escalation</p>
                </>
              )}
              {phase === 'ok' && (
                <>
                  <CheckCircle2 size={44} className="text-success mx-auto mb-3" />
                  <p className="type-section text-success">Payment captured</p>
                  <p className="font-mono type-metric text-white/90 mt-2">{amount}</p>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <p className="type-micro mt-4 text-white/35">Customer device · simulated view</p>
    </div>
  );
};
