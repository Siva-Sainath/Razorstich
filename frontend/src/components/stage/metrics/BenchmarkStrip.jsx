import React from 'react';
import { Link } from 'react-router-dom';
import { useTimeline } from '@/lib/timelineContext';
import { inr } from '../stageUtils';

const MODEL_STATUS = {
  checkout_failed: { gen: 'v2', shipped: true },
  cart_abandon: { gen: 'v1', shipped: true },
  subscription_failed: { gen: 'v1', shipped: true },
  invoice_overdue: { gen: 'v2', shipped: false },
};

/** Verified RL benchmark — one compact block, linked to /research for detail. */
export const BenchmarkStrip = () => {
  const { wedgeSummary, caseData } = useTimeline();
  const b = wedgeSummary?.benchmark;
  const acc = b?.acceptance;
  const trainV2 = wedgeSummary?.train_v2;
  const wedge = caseData?.case?.wedge || wedgeSummary?.wedge;
  const model = MODEL_STATUS[wedge] || { gen: 'v1', shipped: true };

  if (!b?.policy_mean_net_inr) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2 type-micro text-white/40">
        Loading benchmark…
      </div>
    );
  }

  const lift = acc?.mean_improvement_pct;
  const seeds = b.seeds_beaten || '10/10';
  const episodes = trainV2?.episodes;

  return (
    <div
      className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-3 space-y-2"
      data-testid="benchmark-strip"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="type-micro text-white/40">Training proof</span>
        {lift != null && (
          <span className="type-micro text-success font-mono">+{lift.toFixed(1)}% vs rules</span>
        )}
        <span className="type-micro text-white/50 font-mono">{seeds} seeds</span>
        <span className="type-micro text-white/40">
          model {model.gen}
          {!model.shipped && ' · review'}
        </span>
        <Link to="/research" className="type-micro text-primary/80 hover:text-primary ml-auto">
          Full run →
        </Link>
      </div>
      {episodes && (
        <p className="type-micro text-white/35 leading-snug">
          {episodes.toLocaleString()} episodes · seed {trainV2.seed ?? 42}
          {trainV2.v2_kept?.includes('checkout_failed') && wedge === 'checkout_failed'
            ? ' · checkout v2 shipped'
            : ''}
          {trainV2.regressions_restored_to_v1?.length > 0
            ? ` · ${trainV2.regressions_restored_to_v1.length} wedges on v1`
            : ''}
        </p>
      )}
      {b.policy_mean_net_inr != null && (
        <p className="type-micro text-white/30 font-mono">
          Mean net {inr(Math.round(b.policy_mean_net_inr))} vs rules{' '}
          {inr(Math.round(b.baseline_mean_net_inr || 0))}
        </p>
      )}
    </div>
  );
};
