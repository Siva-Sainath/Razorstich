import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTimeline } from '@/lib/timelineContext';

const Stat = ({ label, value, sub, testId }) => (
  <div className="rounded-[16px] bg-white/[0.03] border border-white/[0.07] px-4 py-3.5">
    <div className="text-[12px] leading-4 text-white/55">{label}</div>
    <div data-testid={testId} className="font-mono text-[20px] font-semibold text-white/90 tabular-nums mt-1.5 leading-none">{value}</div>
    {sub && <div className="text-[11px] text-white/40 mt-1.5">{sub}</div>}
  </div>
);

/** Recap card — appears once the episode closes as recovered. */
export const RecoverySummary = () => {
  const { recovered, caseData, contactsUsed, maxContacts, restart } = useTimeline();

  const path = useMemo(() => {
    const runs = caseData?.ghostRuns || [];
    const chosen = runs.find((r) => r.chosen);
    const alts = runs.filter((r) => !r.chosen);
    const best = alts.reduce((a, b) => (b.prob > (a?.prob || 0) ? b : a), null);
    return { chosen, best };
  }, [caseData]);

  if (!caseData) return null;

  return (
    <AnimatePresence>
      {recovered && (
        <motion.section
          initial={{ opacity: 0, y: 16, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ type: 'spring', stiffness: 170, damping: 22 }}
          data-testid="recovery-summary"
          className="gradient-border glint-top backdrop-blur-2xl rounded-[24px] p-6 shadow-[var(--shadow-2)]"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h2 className="font-display text-[18px] leading-6 font-semibold text-white/90">
                Episode recovered
              </h2>
              <p className="text-[12px] leading-4 text-white/55 mt-1.5">
                What the agent saved, what it spent, and the path it took.
              </p>
            </div>
            <Button
              data-testid="recap-replay-btn"
              onClick={restart}
              className="h-9 px-4 rounded-[12px] bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white/85 text-[13px] font-medium transition-colors duration-150 active:scale-[0.98]"
            >
              Replay episode
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <Stat
              label="Net revenue saved"
              value="₹2,459"
              sub="₹2,499 recovered − ₹40 cashback"
              testId="summary-net-amount"
            />
            <Stat
              label="Time to recovery"
              value="T+60h"
              sub="10 of 12 decision ticks used"
              testId="summary-time"
            />
            <Stat
              label="Contacts spent"
              value={`${contactsUsed} of ${maxContacts}`}
              sub="WhatsApp · payment link · cashback SMS"
              testId="summary-contacts"
            />
            <Stat
              label="Path vs best alternative"
              value={
                path.chosen && path.best
                  ? `+${Math.round((path.chosen.prob - path.best.prob) * 100)}%`
                  : '—'
              }
              sub={
                path.best
                  ? `${Math.round((path.chosen?.prob || 0) * 100)}% chosen · ${Math.round(path.best.prob * 100)}% ${path.best.label.toLowerCase()} (ruled out)`
                  : ''
              }
              testId="summary-path-lift"
            />
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
};
