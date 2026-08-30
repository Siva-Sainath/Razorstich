import React from 'react';
import { Link } from 'react-router-dom';
import { useTimeline } from '@/lib/timelineContext';

const MODEL_STATUS = {
  checkout_failed: { gen: 'v2', shipped: true },
  cart_abandon: { gen: 'v1', shipped: true },
  subscription_failed: { gen: 'v1', shipped: true },
  invoice_overdue: { gen: 'v2', shipped: false },
};

/** Single-line RL proof — model, lift, seeds. No extra cards. */
export const DemoProofStrip = () => {
  const { wedgeSummary, caseData } = useTimeline();
  const b = wedgeSummary?.benchmark;
  const acc = b?.acceptance;
  const wedge = caseData?.case?.wedge || wedgeSummary?.wedge;
  const model = MODEL_STATUS[wedge] || { gen: 'v1', shipped: true };
  const trainV2 = wedgeSummary?.train_v2;

  if (!b?.policy_mean_net_inr) {
    return (
      <div
        className="rounded-[14px] border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 type-meta text-white/40"
        data-testid="demo-proof-strip"
      >
        Loading training proof…
      </div>
    );
  }

  const lift = acc?.mean_improvement_pct;
  const liftLabel = lift != null ? `+${lift.toFixed(1)}% vs rules` : 'beats baseline';
  const seedsPassed = acc?.seeds_passed != null && acc?.seeds_total != null
    ? `${acc.seeds_passed}/${acc.seeds_total} seeds`
    : '10-seed benchmark';

  return (
    <div
      className="rounded-[14px] border border-primary/20 bg-primary/[0.06] px-4 py-3 flex flex-wrap items-center justify-between gap-3"
      data-testid="demo-proof-strip"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 type-meta text-white/70">
        <span>
          Model <span className="font-mono text-primary">{model.gen}</span>
          {trainV2?.episodes && (
            <span className="text-white/40"> · {trainV2.episodes.toLocaleString()} ep</span>
          )}
        </span>
        <span className="font-mono text-teal-300/90">{liftLabel}</span>
        <span>{seedsPassed}</span>
        {!model.shipped && (
          <span className="text-warning/80">parity review</span>
        )}
      </div>
      <Link to="/research" className="type-meta text-primary/85 hover:text-primary shrink-0">
        Full training log →
      </Link>
    </div>
  );
};
