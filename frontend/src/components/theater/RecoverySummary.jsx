import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTimeline } from '@/lib/timelineContext';
import { MetricNumber } from '@/components/kit/MetricNumber';
import { FigureFrame } from '@/components/kit/FigureFrame';
import { RecoveryFlowMap } from '@/components/svg/RecoveryFlowMap';

const Stat = ({ label, value, sub, testId }) => (
  <div className="surface-inset px-4 py-4">
    <div className="type-micro">{label}</div>
    <div data-testid={testId} className="mt-2">
      <MetricNumber size="md">{value}</MetricNumber>
    </div>
    {sub && <div className="type-micro mt-2 text-white/40">{sub}</div>}
  </div>
);

export const RecoverySummary = () => {
  const { recovered, caseData, contactsUsed, maxContacts, restart, elapsedLabel, maxSteps, tickHours } = useTimeline();
  const c = caseData?.case;
  const amountLabel = c ? `₹${Number(c.amount).toLocaleString('en-IN')}` : '—';

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
          className="gradient-border glint-top backdrop-blur-2xl rounded-[24px] p-6 lg:p-8 shadow-[var(--shadow-2)]"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <p className="type-micro text-accent mb-2">FIG.6 · Episode closure</p>
              <h2 className="type-panel-title">Episode recovered</h2>
              <p className="type-meta mt-2 max-w-md">
                What the agent saved, what it spent, and the path it took.
              </p>
            </div>
            <Button
              data-testid="recap-replay-btn"
              onClick={restart}
              className="btn-quiet"
            >
              Replay episode
            </Button>
          </div>

          <FigureFrame figure="" caption="Stitch path complete — revenue captured." compact className="mt-5 mb-5">
            <RecoveryFlowMap progress={1} recovered height={64} />
          </FigureFrame>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat
              label="Net revenue saved"
              value={amountLabel}
              sub={`Recovered by ${c?.agentName || c?.wedge || 'recovery agent'}`}
              testId="summary-net-amount"
            />
            <Stat
              label="Time to recovery"
              value={elapsedLabel}
              sub={`${maxSteps} decision ticks · ${tickHours}h cadence`}
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
