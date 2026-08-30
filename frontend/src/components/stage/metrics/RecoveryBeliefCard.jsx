import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTimeline, sampleCurve } from '@/lib/timelineContext';
import { GlassCard } from '../GlassCard';
import { WEDGE_BY_ID } from '@/config/wedges';

const W = 280;
const H = 72;

export const RecoveryBeliefCard = ({ delay = 0, wedge }) => {
  const { caseData, t, currentRolloutStep, recovered } = useTimeline();
  const curve = caseData?.recoveryCurve || [];
  const c = caseData?.case;
  const lane = WEDGE_BY_ID[wedge || c?.wedge];
  const showSpontaneous =
    lane?.showSpontaneousBand && c?.failureReason === 'insufficient_funds';

  const prob = useMemo(() => {
    if (recovered) return 1;
    if (currentRolloutStep?.belief_p != null) return currentRolloutStep.belief_p;
    return sampleCurve(curve, t);
  }, [currentRolloutStep, curve, t, recovered]);

  const pts = useMemo(() => {
    if (!curve.length) return '';
    const xs = curve.map((p, i) => (i / Math.max(curve.length - 1, 1)) * W);
    const ys = curve.map((p) => H - p.p * H);
    return xs.map((x, i) => `${x},${ys[i]}`).join(' ');
  }, [curve]);

  const playheadX = useMemo(() => {
    if (!curve.length) return 0;
    return t * W;
  }, [curve, t]);

  const spontStart = (24 / (c?.windowHours || 72)) * W;
  const spontEnd = W;

  const title =
    wedge === 'subscription_failed' ? 'Chance customer stays' : 'Chance of recovery';
  const subtitle = 'How likely we recover this payment right now';

  return (
    <GlassCard testId="metric-recovery-belief" title={title} subtitle={subtitle} delay={delay}>
      <div className="flex items-end justify-between gap-4">
        <motion.p
          key={prob}
          initial={{ scale: 0.98 }}
          animate={{ scale: 1 }}
          className="font-mono text-3xl font-semibold text-white/90 tabular-nums"
        >
          {Math.round(prob * 100)}%
        </motion.p>
        <p className="type-micro text-white/55 text-right max-w-[140px]">
          Updates as the agent watches the situation
        </p>
      </div>
      {pts && (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full mt-3" style={{ height: H }} aria-hidden="true">
          {showSpontaneous && (
            <rect
              x={spontStart}
              y={0}
              width={spontEnd - spontStart}
              height={H}
              fill="rgba(45,212,191,0.08)"
            />
          )}
          <polyline
            points={pts}
            fill="none"
            stroke="rgba(43,138,247,0.55)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <motion.line
            x1={playheadX}
            x2={playheadX}
            y1={0}
            y2={H}
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        </svg>
      )}
      {showSpontaneous && (
        <p className="type-micro text-teal-300/80 mt-2">
          Shaded area · customer may pay on their own after 24–72h
        </p>
      )}
    </GlassCard>
  );
};
