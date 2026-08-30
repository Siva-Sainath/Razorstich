import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTimeline, sampleCurve } from '@/lib/timelineContext';
import { Panel } from '@/components/theater/Panel';
import { MetricNumber } from '@/components/kit/MetricNumber';
import { friendlyAction } from '@/config/consumerCopy';
import { ScenarioWedgeIntel } from './ScenarioWedgeIntel';

const W = 320;
const H = 56;

function MetricTile({ label, value, sub, testId, accent = 'text-white/90' }) {
  return (
    <div className="rounded-[14px] border border-white/[0.07] bg-white/[0.03] px-3.5 py-3" data-testid={testId}>
      <p className="type-micro text-white/45">{label}</p>
      <p className={`font-mono text-xl font-semibold tabular-nums mt-1 ${accent}`}>{value}</p>
      {sub && <p className="type-micro text-white/40 mt-1">{sub}</p>}
    </div>
  );
}

/** Live RL signals that move with scrubber / replay — belief, Q-margin, expected net. */
export const RlLiveMetricsPanel = ({ scenarioId }) => {
  const {
    caseData,
    t,
    recoveryProb,
    recovered,
    currentRolloutStep,
    livePolicy,
    contactsUsed,
    maxContacts,
    currentStepIndex,
    maxSteps,
    elapsedLabel,
    intervention,
  } = useTimeline();

  const c = caseData?.case;
  const curve = caseData?.recoveryCurve || [];
  const amount = c?.amount || 0;

  const startBelief = useMemo(() => {
    const first = caseData?.rollout?.[0];
    if (first?.belief_p != null) return first.belief_p;
    if (curve.length) return curve[0].p;
    return 0.08;
  }, [caseData, curve]);

  const beliefPct = Math.round(recoveryProb * 100);
  const beliefDelta = Math.round((recoveryProb - startBelief) * 100);
  const deltaLabel = beliefDelta >= 0 ? `+${beliefDelta}pp since failure` : `${beliefDelta}pp since failure`;

  const qMargin = useMemo(() => {
    const entries = Object.entries(livePolicy?.q_values || {}).sort((a, b) => b[1] - a[1]);
    if (entries.length < 2) return null;
    return entries[0][1] - entries[1][1];
  }, [livePolicy]);

  const topQ = useMemo(() => {
    const action = livePolicy?.selected_action || currentRolloutStep?.rl_action;
    if (!action || !livePolicy?.q_values) return null;
    const q = livePolicy.q_values[action];
    return q != null ? q.toFixed(2) : null;
  }, [livePolicy, currentRolloutStep]);

  const expectedNet = Math.round(recoveryProb * amount);
  const capturedNet = recovered ? amount : 0;

  const pts = useMemo(() => {
    if (!curve.length) return '';
    const xs = curve.map((p, i) => (i / Math.max(curve.length - 1, 1)) * W);
    const ys = curve.map((p) => H - p.p * H);
    return xs.map((x, i) => `${x},${ys[i]}`).join(' ');
  }, [curve]);

  const playheadX = t * W;

  return (
    <Panel
      title="RL metrics (live replay)"
      subtitle="Belief and Q-values update each tick as the trained policy replays the validation episode"
      testId="rl-live-metrics"
      variant="standard"
      bodyClassName="pt-3 flex flex-col gap-4"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricTile
          label="P(recover)"
          value={`${beliefPct}%`}
          sub={recovered ? 'Captured in simulator' : deltaLabel}
          testId="metric-belief"
          accent="text-primary"
        />
        <MetricTile
          label="Expected net INR"
          value={`₹${expectedNet.toLocaleString('en-IN')}`}
          sub={recovered ? `₹${capturedNet.toLocaleString('en-IN')} realized` : `on ₹${amount.toLocaleString('en-IN')} at risk`}
          testId="metric-expected-net"
          accent="text-teal-300/95"
        />
        <MetricTile
          label="Q advantage"
          value={qMargin != null ? qMargin.toFixed(2) : '—'}
          sub={topQ ? `Top Q ${topQ} · ${friendlyAction(intervention?.action)}` : 'Policy API loading…'}
          testId="metric-q-margin"
        />
        <MetricTile
          label="Episode progress"
          value={`${currentStepIndex + 1}/${maxSteps}`}
          sub={`${elapsedLabel} · contacts ${contactsUsed}/${maxContacts}`}
          testId="metric-episode-progress"
        />
      </div>

      {pts && (
        <div className="rounded-[14px] border border-white/[0.06] bg-black/20 px-4 py-3">
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <p className="type-micro text-white/50">Recovery belief trajectory</p>
            <MetricNumber size="sm" className="text-primary">
              {beliefPct}%
            </MetricNumber>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }} aria-hidden="true">
            <polyline
              points={pts}
              fill="none"
              stroke="rgba(43,138,247,0.5)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <motion.line
              x1={playheadX}
              x2={playheadX}
              y1={0}
              y2={H}
              stroke="rgba(45,212,191,0.85)"
              strokeWidth="1.5"
              animate={{ x1: playheadX, x2: playheadX }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
            <motion.circle
              cx={playheadX}
              cy={H - recoveryProb * H}
              r={4}
              fill="rgba(45,212,191,0.9)"
              animate={{ cx: playheadX, cy: H - recoveryProb * H }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </svg>
        </div>
      )}

      <ScenarioWedgeIntel scenarioId={scenarioId} />
    </Panel>
  );
};
