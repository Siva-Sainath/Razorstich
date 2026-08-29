import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimeline } from '@/lib/timelineContext';
import { Panel } from './Panel';

/** Trust budget — max 3 customer contacts per 72h episode. */
export const TrustBudget = ({ className }) => {
  const { caseData, trustRemaining, contactsUsed, maxContacts, t } = useTimeline();
  const visibleLedger = caseData.trustLedger.filter((e) => e.t <= t);

  return (
    <Panel
      title="Trust budget"
      subtitle="Three customer contacts per episode — the agent spends them like capital."
      testId="trust-budget"
      className={className}
      right={
        <div className="text-right shrink-0">
          <div data-testid="trust-budget-remaining" className="font-mono text-2xl font-semibold tabular-nums text-white leading-none">
            {trustRemaining}
          </div>
          <div className="text-[13px] text-white/45 mt-1">of {maxContacts} left</div>
        </div>
      }
    >
      {/* 3 contact slots */}
      <div className="grid grid-cols-3 gap-2.5">
        {Array.from({ length: maxContacts }).map((_, i) => {
          const spent = i < contactsUsed;
          return (
            <motion.div
              key={i}
              data-testid="contact-slot"
              className={`h-2 rounded-full ${spent ? 'bg-white/[0.08]' : 'bg-primary/80'}`}
              animate={{ opacity: spent ? 0.6 : 1 }}
              transition={{ duration: 0.3 }}
            />
          );
        })}
      </div>

      <div className="mt-4 space-y-2" data-testid="trust-ledger">
        <AnimatePresence>
          {visibleLedger.map((e, i) => (
            <motion.div
              key={e.t}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-center justify-between text-sm"
              data-testid="trust-ledger-row"
            >
              <span className="text-white/60">{e.reason}</span>
              <span className="font-mono text-[13px] tabular-nums text-white/85">{`contact ${i + 1}/3`}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {visibleLedger.length === 0 && (
          <p className="text-sm text-white/40">No customer contacts yet.</p>
        )}
        {contactsUsed >= maxContacts && (
          <p className="text-[13px] text-warning">Budget exhausted — outreach actions are masked from the policy.</p>
        )}
      </div>
    </Panel>
  );
};
