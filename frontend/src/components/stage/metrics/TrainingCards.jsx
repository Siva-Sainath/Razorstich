import React from 'react';
import { motion } from 'framer-motion';
import { useTimeline } from '@/lib/timelineContext';
import { recoveryScenarioLabel } from '@/config/consumerCopy';
import { GlassCard } from '../GlassCard';
import { MetricNumber } from '@/components/kit/MetricNumber';
import { PolicyCompareBars } from '@/components/research/PolicyCompareBars';
import { inr } from '../stageUtils';

export const TrainingBenchmarkCard = ({ delay = 0 }) => {
  const { wedgeSummary, caseData } = useTimeline();
  const b = wedgeSummary?.benchmark;
  const curve = wedgeSummary?.training_curve || [];
  const lastCurve = curve[curve.length - 1];
  const wedge = caseData?.case?.wedge || wedgeSummary?.wedge;

  if (!b && !lastCurve) {
    return (
      <GlassCard testId="metric-training" variant="training" title="Training run metrics" delay={delay}>
        <p className="type-body text-white/45">Loading eval/results artifacts…</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard
      testId="metric-training"
      title="Training benchmark"
      subtitle={recoveryScenarioLabel(wedge)}
      delay={delay}
    >
      {b?.policy_mean_net_inr && (
        <PolicyCompareBars benchmark={b} compact className="mb-4" />
      )}
      {lastCurve && (
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 0.1 }}
            className="surface-inset px-3 py-2.5 rounded-xl"
          >
            <p className="type-micro">Val net ep {lastCurve.episode?.toLocaleString()}</p>
            <p className="type-metric mt-1">{inr(lastCurve.val_net_inr)}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 0.15 }}
            className="surface-inset px-3 py-2.5 rounded-xl"
          >
            <p className="type-micro">ε at save</p>
            <p className="type-metric mt-1">{lastCurve.epsilon?.toFixed(3)}</p>
          </motion.div>
        </div>
      )}
    </GlassCard>
  );
};

export const GhostCompareCard = ({ delay = 0 }) => {
  const { caseData } = useTimeline();
  const runs = caseData?.ghostRuns || [];
  const dqn = runs.find((r) => r.chosen);
  const rules = runs.find((r) => r.id === 'gr-rules');
  if (!dqn) return null;

  const delta = rules ? Math.round((dqn.prob - rules.prob) * 100) : 0;

  return (
    <GlassCard
      testId="metric-ghost-compare"
      title="Smarter than basic retries"
      subtitle="Same customer · trained agent vs default rules"
      delay={delay}
    >
      <div className="space-y-4">
        <div>
          <div className="flex justify-between type-micro mb-1.5 text-white/55">
            <span>RazorStitch agent</span>
            <span className="font-mono tabular-nums text-white/80">
              {Math.round(dqn.prob * 100)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full bg-primary/70 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${dqn.prob * 100}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
        {rules && (
          <div>
            <div className="flex justify-between type-micro mb-1.5 text-white/55">
              <span>Basic retry rules</span>
              <span className="font-mono tabular-nums">{Math.round(rules.prob * 100)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-white/25 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${rules.prob * 100}%` }}
                transition={{ duration: 0.5, delay: 0.08 }}
              />
            </div>
          </div>
        )}
        {delta > 0 && (
          <p className="type-meta text-white/60">
            +{delta}% better odds of recovery on this example
          </p>
        )}
      </div>
    </GlassCard>
  );
};

export const OutcomeCard = ({ delay = 0 }) => {
  const { caseData, displayAmount, contactsUsed, maxContacts } = useTimeline();
  const c = caseData?.case;
  if (!c) return null;

  return (
    <GlassCard
      testId="metric-outcome"
      title="Money recovered"
      subtitle="Final result for this example"
      delay={delay}
    >
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <MetricNumber size="hero" className="text-white/92">
          {inr(displayAmount.captured || c.amount)}
        </MetricNumber>
      </motion.div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="surface-inset px-3 py-2.5 rounded-xl">
          <p className="type-micro text-white/45">Messages sent</p>
          <p className="type-metric mt-1">{contactsUsed}/{maxContacts}</p>
        </div>
        <div className="surface-inset px-3 py-2.5 rounded-xl">
          <p className="type-micro text-white/45">Agent version</p>
          <p className="type-meta mt-1 truncate text-white/70">{c.policyVersion?.replace(/dueling-ddqn-/i, '') || 'Latest'}</p>
        </div>
      </div>
    </GlassCard>
  );
};
