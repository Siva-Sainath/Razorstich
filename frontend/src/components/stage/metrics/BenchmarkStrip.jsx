import React from 'react';
import { Link } from 'react-router-dom';
import { useTimeline } from '@/lib/timelineContext';
import { formatInr, resolveBenchmark, RL_RUN_PROTOCOL } from '@/config/rlRunStats';

/** Verified RL benchmark — shipped eval JSON for this wedge. */
export const BenchmarkStrip = () => {
  const { wedgeSummary, caseData } = useTimeline();
  const wedge = caseData?.case?.wedge || wedgeSummary?.wedge || 'checkout_failed';
  const resolved = resolveBenchmark(
    { benchmark: caseData?.benchmark || wedgeSummary?.benchmark, model: caseData?.model || wedgeSummary?.model },
    wedge
  );

  return (
    <div
      className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-3 space-y-2"
      data-testid="benchmark-strip"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="type-micro text-white/40">Training proof</span>
        <span className="type-micro text-success font-mono">{resolved.liftLabel} vs rules</span>
        <span className="type-micro text-white/50 font-mono">{resolved.seedsBeaten} seeds</span>
        <span className="type-micro text-white/40">
          model {resolved.gen}
          {!resolved.shipped && ' · review'}
        </span>
        <Link to="/research" className="type-micro text-primary/80 hover:text-primary ml-auto">
          Full run →
        </Link>
      </div>
      <p className="type-micro text-white/35 leading-snug">
        {RL_RUN_PROTOCOL.seeds} seeds × {resolved.episodesPerSeed} episodes · {resolved.label}
      </p>
      <p className="type-micro text-white/30 font-mono">
        Mean net {formatInr(resolved.policyMeanNetInr)} vs rules {formatInr(resolved.baselineMeanNetInr)}
      </p>
    </div>
  );
};
