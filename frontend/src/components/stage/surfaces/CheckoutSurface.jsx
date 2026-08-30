import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, CreditCard, CheckCircle2, AlertCircle, MessageSquare, Headphones, Store } from 'lucide-react';
import { useTimeline } from '@/lib/timelineContext';
import { customerPhaseFromRollout, inr } from '../stageUtils';

const PHASE_CONFIG = {
  fail: { icon: AlertCircle, label: 'Payment declined', color: 'text-destructive', bg: 'bg-destructive/15 border-destructive/30' },
  pay: { icon: CreditCard, label: 'Retry checkout', color: 'text-warning', bg: 'bg-warning/10 border-warning/30' },
  msg: { icon: MessageSquare, label: 'Recovery nudge sent', color: 'text-primary', bg: 'bg-primary/10 border-primary/30' },
  support: { icon: Headphones, label: 'Escalated to support', color: 'text-violet-300', bg: 'bg-violet-400/10 border-violet-400/30' },
  ok: { icon: CheckCircle2, label: 'Payment captured', color: 'text-success', bg: 'bg-success/10 border-success/30' },
};

export const CheckoutSurface = () => {
  const { caseData, t, rolloutSteps, recovered, displayAmount, currentRolloutStep } = useTimeline();
  const c = caseData?.case;
  if (!c) return null;

  const phase = customerPhaseFromRollout(rolloutSteps, t, recovered);
  const cfg = PHASE_CONFIG[phase] || PHASE_CONFIG.fail;
  const Icon = cfg.icon;
  const amount = recovered ? displayAmount.captured || c.amount : c.amount;

  return (
    <div
      className="flex flex-col h-full min-h-0 rounded-[24px] border border-white/[0.08] overflow-hidden glass-card"
      data-testid="checkout-surface"
    >
      <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
        <p className="type-micro text-white/45">Customer checkout · Razorpay</p>
        <span className={`type-micro font-mono px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>

      <div className="flex-1 min-h-0 p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-stretch">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col justify-between min-h-[200px] rounded-[20px] border border-white/10 bg-black/35 p-4 sm:p-5"
          >
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Store size={16} className="text-white/40" />
                <p className="type-meta text-white/70 truncate">{c.merchant}</p>
              </div>
              <p className="type-micro text-white/40">Amount at stake</p>
              <p className="font-mono text-3xl sm:text-4xl font-semibold text-white/95 tabular-nums mt-1">
                {inr(amount)}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 pt-4 border-t border-white/[0.06] type-micro">
              <dt className="text-white/40">Method</dt>
              <dd className="font-mono text-white/75 uppercase text-right">{c.method}</dd>
              <dt className="text-white/40">Decline</dt>
              <dd className="font-mono text-white/75 text-right truncate">
                {c.declineReason || c.failureReason?.replace(/_/g, ' ')}
              </dd>
              <dt className="text-white/40">Case</dt>
              <dd className="font-mono text-white/55 text-right">{c.id}</dd>
              {c.declineCode && (
                <>
                  <dt className="text-white/40">Code</dt>
                  <dd className="font-mono text-white/55 text-right">{c.declineCode}</dd>
                </>
              )}
            </dl>
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col gap-3 sm:min-w-[200px] justify-center">
          <motion.div
            className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${cfg.bg}`}
            animate={{ opacity: phase === 'fail' ? [0.85, 1, 0.85] : 1 }}
            transition={{ duration: 2.5, repeat: phase === 'fail' ? Infinity : 0 }}
          >
            <Icon size={22} className={`${cfg.color} shrink-0`} />
            <div>
              <p className={`type-section ${cfg.color}`}>{cfg.label}</p>
              <p className="type-micro text-white/45 mt-0.5">What the shopper sees</p>
            </div>
          </motion.div>

          {currentRolloutStep?.ui_action === 'create_payment_link' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 flex items-center gap-2"
            >
              <Link2 size={16} className="text-primary shrink-0" />
              <p className="type-meta text-primary/90">Payment link sent via SMS</p>
            </motion.div>
          )}

          {phase === 'support' && (
            <p className="type-micro text-white/40 px-1">
              High-value path — human or voice recovery in production.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
