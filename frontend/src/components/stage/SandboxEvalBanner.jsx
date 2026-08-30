import React from 'react';
import { useTimeline } from '@/lib/timelineContext';
import { formatEpisodeWindow } from '@/config/recoveryScenarios';

/** Clarifies that the theater replays RL evaluation — no live integrations fire. */
export const SandboxEvalBanner = () => {
  const { caseData, activeAgent } = useTimeline();
  const c = caseData?.case;
  if (!c) return null;

  const windowLabel = formatEpisodeWindow(c.wedge, c.windowHours);
  const policy = c.policyVersion || activeAgent?.policy_version || 'dueling-ddqn';

  return (
    <div
      className="rounded-[14px] border border-white/[0.08] bg-white/[0.02] px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
      data-testid="sandbox-eval-banner"
    >
      <p className="type-meta text-white/60">
        <span className="text-primary/90 font-medium">Simulator evaluation</span>
        {' · '}
        Held-out validation case replayed with trained {policy} weights — no live SMS, email, or Razorpay sends.
      </p>
      <p className="type-micro font-mono text-white/35 shrink-0">
        {c.id} · {windowLabel} window · ₹{Number(c.amount).toLocaleString('en-IN')}
      </p>
    </div>
  );
};
