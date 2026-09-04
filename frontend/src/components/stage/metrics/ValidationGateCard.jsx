import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTimeline } from '@/lib/timelineContext';
import { GlassCard } from '../GlassCard';
import { formatInr, resolveBenchmark, RL_RUN_PROTOCOL } from '@/config/rlRunStats';

export const ValidationGateCard = ({ delay = 0 }) => {
  const { wedgeSummary, caseData } = useTimeline();
  const wedge = caseData?.case?.wedge || wedgeSummary?.wedge || 'checkout_failed';
  const resolved = resolveBenchmark(
    { benchmark: caseData?.benchmark || wedgeSummary?.benchmark, model: caseData?.model || wedgeSummary?.model },
    wedge
  );
  const acc = resolved.acceptance;
  const passed = acc?.pass !== false && resolved.shipped;
  const ciOverlap = acc?.ci_non_overlap;

  const checks = [
    {
      id: 'seeds',
      label: `${RL_RUN_PROTOCOL.seeds}-seed benchmark`,
      ok: String(resolved.seedsBeaten).startsWith('10'),
      detail: `${resolved.seedsBeaten} seeds beat failure-rules`,
    },
    {
      id: 'lift',
      label: 'Mean net INR lift',
      ok: resolved.liftPct > 0,
      detail: `${resolved.liftLabel} vs failure-rules`,
    },
    {
      id: 'ci',
      label: '95% CI non-overlap',
      ok: ciOverlap !== false,
      detail: ciOverlap === false ? 'CIs overlap — marginal' : 'Policy CI above baseline',
    },
    {
      id: 'model',
      label: `Model ${resolved.gen}`,
      ok: resolved.shipped,
      detail: resolved.label,
    },
  ];

  return (
    <GlassCard
      testId="validation-gate"
      title="Deploy gate"
      subtitle="Shipped checkpoint vs 10-seed acceptance"
      delay={delay}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="type-meta text-white/60">{passed ? 'Ready to ship' : resolved.shipped ? 'Passed' : 'On hold'}</p>
        <div className="text-right">
          <span className="type-micro font-mono text-white/40">{resolved.gen}</span>
          <p className="type-micro text-white/35 mt-0.5">
            {formatInr(resolved.policyMeanNetInr)} / seed
          </p>
        </div>
      </div>

      <ul className="space-y-2.5">
        {checks.map((c, i) => (
          <motion.li
            key={c.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + i * 0.05 }}
            className="flex items-start gap-3 py-2 border-b border-white/[0.05] last:border-0"
          >
            <span className={`mt-0.5 type-micro ${c.ok ? 'text-success' : 'text-warning'}`}>{c.ok ? '✓' : '○'}</span>
            <div className="min-w-0 flex-1">
              <p className="type-meta text-white/75">{c.label}</p>
              <p className="type-micro text-white/40 mt-0.5">{c.detail}</p>
            </div>
          </motion.li>
        ))}
      </ul>

      <Link
        to="/research"
        className="mt-4 inline-flex type-micro text-primary/80 hover:text-primary transition-colors"
      >
        Full training log →
      </Link>
    </GlassCard>
  );
};
