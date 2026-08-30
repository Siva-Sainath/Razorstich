import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, CreditCard, CheckCircle2, AlertCircle, MessageSquare, Headphones } from 'lucide-react';
import { useTimeline } from '@/lib/timelineContext';
import { customerPhaseFromRollout, inr } from '../stageUtils';
import { RECOVERY_BY_ID } from '@/config/recoveryScenarios';
import { WEDGE_ACCENT } from '@/config/demoPersonas';

function phaseConfigForWedge(wedge) {
  const accentKey = RECOVERY_BY_ID[wedge]?.accent || 'checkout';
  const accent = WEDGE_ACCENT[accentKey];
  return {
    fail: {
      icon: AlertCircle,
      label: 'Declined',
      color: 'text-destructive',
      bg: 'bg-destructive/15 border-destructive/30',
    },
    pay: {
      icon: CreditCard,
      label: 'Retry checkout',
      color: accent.text,
      bg: 'bg-primary/10 border-primary/30',
    },
    msg: {
      icon: MessageSquare,
      label: 'Nudge sent',
      color: accent.text,
      bg: 'bg-primary/10 border-primary/30',
    },
    support: {
      icon: Headphones,
      label: 'Support',
      color: accent.text,
      bg: 'bg-primary/10 border-primary/30',
    },
    ok: {
      icon: CheckCircle2,
      label: 'Captured',
      color: 'text-success',
      bg: 'bg-success/10 border-success/30',
    },
  };
}

export const CheckoutSurface = ({ embedded = false }) => {
  const { caseData, t, rolloutSteps, recovered, displayAmount, currentRolloutStep } = useTimeline();
  const c = caseData?.case;
  if (!c) return null;

  const phase = customerPhaseFromRollout(rolloutSteps, t, recovered);
  const PHASE_CONFIG = phaseConfigForWedge(c.wedge || 'checkout_failed');
  const cfg = PHASE_CONFIG[phase] || PHASE_CONFIG.fail;
  const Icon = cfg.icon;
  const amount = recovered ? displayAmount.captured || c.amount : c.amount;

  const shell = embedded
    ? 'h-full flex flex-col rounded-[20px] border border-white/[0.08] bg-black/30 overflow-hidden'
    : 'flex flex-col h-full min-h-[300px] rounded-[24px] border border-white/[0.08] overflow-hidden glass-card';

  return (
    <div className={shell} data-testid="checkout-surface">
      <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
        <p className="type-micro text-white/45">Customer view</p>
        <span className={`type-micro px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>

      <div className="flex-1 p-4 flex flex-col justify-center min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <CreditCard size={18} className="text-white/70" />
                </div>
                <div>
                  <p className="type-micro text-white/40">Order total</p>
                  <p className="font-mono text-2xl font-semibold text-white/95 tabular-nums">{inr(amount)}</p>
                </div>
              </div>
              <span className="type-micro font-mono text-white/35 uppercase">{c.method}</span>
            </div>

            <dl className="grid grid-cols-2 gap-2 type-micro mb-4">
              <dt className="text-white/40">Decline</dt>
              <dd className="font-mono text-white/75 text-right truncate">
                {c.declineReason || c.failureReason?.replace(/_/g, ' ')}
              </dd>
              {c.declineCode && (
                <>
                  <dt className="text-white/40">Code</dt>
                  <dd className="font-mono text-white/55 text-right">{c.declineCode}</dd>
                </>
              )}
            </dl>

            <div className={`rounded-xl border px-3 py-2.5 flex items-center gap-2 ${cfg.bg}`}>
              <Icon size={16} className={cfg.color} />
              <span className={`type-meta ${cfg.color}`}>{cfg.label}</span>
            </div>

            {currentRolloutStep?.ui_action === 'create_payment_link' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 flex items-center gap-2 type-micro text-primary rounded-lg border border-primary/20 bg-primary/5 px-3 py-2"
              >
                <Link2 size={14} />
                Payment link queued via SMS
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
