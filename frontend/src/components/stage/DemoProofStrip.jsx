import React from 'react';
import { Link } from 'react-router-dom';
import { useTimeline } from '@/lib/timelineContext';
import { formatInr, resolveBenchmark, RL_RUN_PROTOCOL } from '@/config/rlRunStats';

/** Single-line RL proof — shipped 10-seed numbers for this wedge. */
export const DemoProofStrip = () => {
  const { wedgeSummary, caseData } = useTimeline();
  const wedge = caseData?.case?.wedge || wedgeSummary?.wedge || 'checkout_failed';
  const resolved = resolveBenchmark(
    { benchmark: caseData?.benchmark || wedgeSummary?.benchmark, model: caseData?.model || wedgeSummary?.model },
    wedge
  );

  return (
    <div
      className="rounded-[14px] border border-primary/20 bg-primary/[0.06] px-4 py-3 flex flex-wrap items-center justify-between gap-3"
      data-testid="demo-proof-strip"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 type-meta text-white/70">
        <span>
          Model <span className="font-mono text-primary">{resolved.gen}</span>
          <span className="text-white/40">
            {' '}
            · {resolved.episodesPerSeed} ep × {RL_RUN_PROTOCOL.seeds} seeds
          </span>
        </span>
        <span className="font-mono text-teal-300/90">{resolved.liftLabel} vs rules</span>
        <span>{resolved.seedsBeaten} seeds</span>
        <span className="font-mono text-white/45">
          {formatInr(resolved.policyMeanNetInr)} vs {formatInr(resolved.baselineMeanNetInr)}
        </span>
        {!resolved.shipped && <span className="text-warning/80">parity review</span>}
      </div>
      <Link to="/research" className="type-meta text-primary/85 hover:text-primary shrink-0">
        Full training log →
      </Link>
    </div>
  );
};
