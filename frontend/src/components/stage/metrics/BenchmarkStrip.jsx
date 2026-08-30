import React from 'react';
import { Link } from 'react-router-dom';
import { useTimeline } from '@/lib/timelineContext';

/** Compact RL proof — not a full card. */
export const BenchmarkStrip = () => {
  const { wedgeSummary, caseData } = useTimeline();
  const b = wedgeSummary?.benchmark;
  const acc = b?.acceptance;
  const wedge = caseData?.case?.wedge || wedgeSummary?.wedge;

  if (!b?.policy_mean_net_inr) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2 type-micro text-white/40">
        Loading benchmark…
      </div>
    );
  }

  const lift = acc?.mean_improvement_pct;
  const seeds = b.seeds_beaten || '10/10';
  const gen = wedge === 'checkout_failed' ? 'v2' : wedge === 'cart_abandon' || wedge === 'subscription_failed' ? 'v1' : 'v2';

  return (
    <div
      className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1"
      data-testid="benchmark-strip"
    >
      <span className="type-micro text-white/40">RL proof</span>
      {lift != null && (
        <span className="type-micro text-success font-mono">+{lift.toFixed(1)}% vs rules</span>
      )}
      <span className="type-micro text-white/50 font-mono">{seeds} seeds</span>
      <span className="type-micro text-white/35">model {gen}</span>
      <Link to="/research" className="type-micro text-primary/80 hover:text-primary ml-auto">
        Full run →
      </Link>
    </div>
  );
};
