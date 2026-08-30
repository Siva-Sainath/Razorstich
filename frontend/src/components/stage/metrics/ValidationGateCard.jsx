import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTimeline } from '@/lib/timelineContext';
import { GlassCard } from '../GlassCard';

const MODEL_STATUS = {
  checkout_failed: { gen: 'v2', label: '20k HPO-tuned', shipped: true },
  cart_abandon: { gen: 'v1', label: 'stable baseline', shipped: true },
  subscription_failed: { gen: 'v1', label: 'stable baseline', shipped: true },
  invoice_overdue: { gen: 'v2', label: 'trained · parity review', shipped: false },
};

/**
 * Post-training validation gate — mirrors train_all_wedges.py acceptance + regression checks.
 */
export const ValidationGateCard = ({ delay = 0 }) => {
  const { wedgeSummary, caseData } = useTimeline();
  const wedge = caseData?.case?.wedge || wedgeSummary?.wedge;
  const b = wedgeSummary?.benchmark;
  const acc = b?.acceptance;
  const model = MODEL_STATUS[wedge] || { gen: 'v1', label: 'checkpoint', shipped: true };
  const trainV2 = wedgeSummary?.train_v2;

  if (!b?.policy_mean_net_inr) {
    return (
      <GlassCard testId="validation-gate" variant="training" title="Validation gate" delay={delay}>
        <p className="type-body text-white/45">Loading benchmark acceptance…</p>
      </GlassCard>
    );
  }

  const passed = acc?.pass !== false;
  const seedsBeaten = b.seeds_beaten || `${acc?.policy?.seeds_beaten ?? 0}/${acc?.policy?.seeds_total ?? 10}`;
  const lift = acc?.mean_improvement_pct;
  const ciOverlap = acc?.ci_non_overlap;

  const checks = [
    {
      id: 'seeds',
      label: '10-seed benchmark',
      ok: String(seedsBeaten).startsWith('10'),
      detail: `${seedsBeaten} seeds beat rules baseline`,
    },
    {
      id: 'lift',
      label: 'Mean net INR lift',
      ok: lift > 0,
      detail: lift != null ? `+${lift.toFixed(1)}% vs failure-rules` : '—',
    },
    {
      id: 'ci',
      label: '95% CI non-overlap',
      ok: ciOverlap !== false,
      detail: ciOverlap ? 'Policy CI above baseline' : 'CIs overlap — marginal',
    },
    {
      id: 'model',
      label: `Model ${model.gen}`,
      ok: model.shipped,
      detail: model.label,
    },
  ];

  return (
    <GlassCard
      testId="validation-gate"
      title="Deploy gate"
      subtitle="Benchmark acceptance before ship"
      delay={delay}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="type-meta text-white/60">
          {passed && model.shipped ? 'Ready to ship' : model.shipped ? 'Passed · under review' : 'On hold'}
        </p>
        <div className="text-right">
          <span className="type-micro font-mono text-white/40">{model.gen}</span>
          {trainV2?.episodes && (
            <p className="type-micro text-white/35 mt-0.5">
              {trainV2.episodes.toLocaleString()} ep · seed {trainV2.seed ?? 42}
            </p>
          )}
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
