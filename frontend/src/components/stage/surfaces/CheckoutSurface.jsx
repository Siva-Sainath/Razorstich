import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, CreditCard, CheckCircle2, AlertCircle, MessageSquare, Headphones } from 'lucide-react';
import { useTimeline } from '@/lib/timelineContext';
import { customerPhaseFromRollout, inr } from '../stageUtils';
import { WEDGE_BY_ID } from '@/config/wedges';
import { WEDGE_ACCENT } from '@/config/demoPersonas';

function phaseConfigForWedge(wedge) {
  const accentKey = WEDGE_BY_ID[wedge]?.accent || 'checkout';
  const accent = WEDGE_ACCENT[accentKey];
  return {
    fail: {
      icon: AlertCircle,
      label: 'Payment declined',
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
      label: 'Recovery nudge sent',
      color: accent.text,
      bg: 'bg-primary/10 border-primary/30',
    },
    support: {
      icon: Headphones,
      label: 'Escalated to support',
      color: accent.text,
      bg: 'bg-primary/10 border-primary/30',
    },
    ok: {
      icon: CheckCircle2,
      label: 'Payment captured',
      color: 'text-success',
      bg: 'bg-success/10 border-success/30',
    },
  };
}

export const CheckoutSurface = ({ compact = false }) => {
  const { caseData, t, rolloutSteps, recovered, displayAmount, currentRolloutStep } = useTimeline();
  const c = caseData?.case;
  if (!c) return null;

  const phase = customerPhaseFromRollout(rolloutSteps, t, recovered);
  const PHASE_CONFIG = phaseConfigForWedge(c.wedge || 'checkout_failed');
  const cfg = PHASE_CONFIG[phase] || PHASE_CONFIG.fail;
  const Icon = cfg.icon;

  return (
    <div
      className={`flex flex-col h-full min-h-0 rounded-[24px] border border-white/[0.08] overflow-hidden glass-card ${
        compact ? 'max-h-[240px]' : 'min-h-[300px]'
      }`}
      data-testid="checkout-surface"
    >
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between shrink-0">
        <p className="type-micro text-white/45">Checkout · live scenario</p>
        <span className={`type-micro font-mono px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>
      <div className={`flex-1 p-5 flex flex-col items-center justify-center relative ${compact ? 'py-3' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35 }}
            className={`w-full rounded-[20px] border border-white/12 bg-black/40 shadow-2xl ${
              compact ? 'max-w-[240px] p-4' : 'max-w-[280px] p-5'
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                <CreditCard size={16} className="text-white/70" />
              </div>
              <div>
                <p className="type-micro text-white/40">Order total</p>
                <p className={`font-mono font-semibold text-white/95 tabular-nums ${compact ? 'text-lg' : 'text-xl'}`}>
                  {inr(recovered ? displayAmount.captured || c.amount : c.amount)}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between type-micro">
                <span className="text-white/45">Method</span>
                <span className="font-mono text-white/75 uppercase">{c.method}</span>
              </div>
              <div className="flex justify-between type-micro">
                <span className="text-white/45">Decline</span>
                <span className="font-mono text-white/75 truncate max-w-[140px]">
                  {c.declineReason || c.failureReason?.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
            <motion.div
              className={`mt-4 rounded-xl border px-3 py-2.5 flex items-center gap-2 ${cfg.bg}`}
              animate={{ opacity: phase === 'fail' ? [0.85, 1, 0.85] : 1 }}
              transition={{ duration: 2.5, repeat: phase === 'fail' ? Infinity : 0 }}
            >
              <Icon size={18} className={cfg.color} />
              <span className={`type-meta ${cfg.color}`}>{cfg.label}</span>
            </motion.div>
            {currentRolloutStep?.ui_action === 'create_payment_link' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 flex items-center gap-2 type-micro text-primary"
              >
                <Link2 size={14} />
                Payment link in SMS pipeline
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
        {!compact && <p className="type-micro font-mono text-white/30 mt-4">{c.id}</p>}
      </div>
    </div>
  );
};
