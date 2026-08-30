import React from 'react';
import { motion } from 'framer-motion';
import { useTimeline } from '@/lib/timelineContext';
import { LogoMark } from './LogoMark';
import { friendlyAction } from '@/config/consumerCopy';

const ACTION_PHRASE = {
  wait: 'hold and re-evaluate at the next tick',
  notify_sms: 'simulate an SMS reminder',
  notify_whatsapp: 'simulate a WhatsApp reminder',
  notify_email: 'simulate an email reminder',
  create_payment_link: 'simulate a payment-link nudge',
  retry_same_method: 'retry the card quietly',
  retry_upi: 'fire the UPI collect request',
  offer_incentive: 'offer the sim cashback',
  escalate_support: 'escalate to support',
  request_new_method: 'ask for another method',
  stop: 'close the episode',
};

/**
 * Quiet console header — replaces the removed fixed top bar.
 * Brand + case identity on the left; a contextual status sentence on the right.
 */
export const ConsoleHeader = () => {
  const { caseData, recoveryProb, recovered, intervention, clockAt, t, elapsedLabel, activeAgent } = useTimeline();
  const c = caseData.case;
  const amountLabel = `₹${Number(c.amount).toLocaleString('en-IN')}`;

  const dotClass = recovered
    ? 'bg-[rgba(45,212,191,0.8)]'
    : recoveryProb >= 0.4
      ? 'bg-primary/80'
      : 'bg-warning/80';

  const sentence = recovered
    ? `Recovered — ${amountLabel} in simulator · ${c.agentName || activeAgent?.name || 'agent'} closed the episode.`
    : `Eval replay · ${ACTION_PHRASE[intervention?.action] || friendlyAction(intervention?.action) || 'holding'}.`;

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
      data-testid="console-header"
    >
      <div className="flex items-center gap-3">
        <LogoMark size={30} />
        <div className="leading-none">
          <div className="type-panel-title font-semibold tracking-tight text-white/90" data-testid="brand-wordmark">
            Razor<span className="text-primary">Stitch</span>
          </div>
          <div className="font-mono type-meta text-white/40 mt-1">{c.id} · {c.paymentId}</div>
        </div>
      </div>

      <div className="flex items-center gap-3 type-body" data-testid="console-status">
        <span className="flex items-center gap-2 text-white/70">
          <motion.span
            className={`inline-block h-1.5 w-1.5 rounded-full ${dotClass}`}
            animate={{ opacity: [0.45, 1, 0.45] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            aria-hidden="true"
          />
          {sentence}
        </span>
        <span className="hidden sm:inline text-white/25" aria-hidden="true">·</span>
        <span className="hidden sm:inline font-mono text-white/45 tabular-nums">
          {`Updated ${clockAt(t)} · ${elapsedLabel}`}
        </span>
      </div>
    </motion.header>
  );
};
