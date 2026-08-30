import React, { useId, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SVG } from './svgTokens';

const W = 400;
const H = 64;
const Y = 28;
const LABEL_Y = 48;

/** Fixed ladder — even spacing, no time-clustered overlap. */
const STAGES = [
  { id: 'failure', label: 'Failure', tone: 'fail', threshold: 0 },
  { id: 'policy', label: 'Policy', tone: 'info', threshold: 0.28 },
  { id: 'outreach', label: 'Outreach', tone: 'ok', threshold: 0.58 },
  { id: 'captured', label: 'Captured', tone: 'ok', threshold: 0.92 },
];

const TONE = {
  fail: { dot: 'rgba(239,68,68,0.9)', ring: 'rgba(239,68,68,0.35)' },
  info: { dot: SVG.primary, ring: SVG.primarySoft },
  ok: { dot: SVG.teal, ring: 'rgba(45,212,191,0.35)' },
  idle: { dot: 'rgba(255,255,255,0.18)', ring: SVG.hairline },
};

function slotX(i, n) {
  const pad = 44;
  return pad + (i / Math.max(n - 1, 1)) * (W - pad * 2);
}

/**
 * Clean stitch-path rail — 4 evenly spaced stages, single label each,
 * progress reveal left → right. Same data, zero clutter.
 */
export const RecoveryFlowMap = ({
  progress = 0,
  recovered = false,
  className = '',
  height = 64,
}) => {
  const uid = useId().replace(/:/g, '');
  const reduce = useReducedMotion();
  const p = recovered ? 1 : Math.max(0, Math.min(1, progress));
  const pathLen = 100;

  const nodes = useMemo(
    () => STAGES.map((stage, i) => ({ ...stage, x: slotX(i, STAGES.length), lit: p >= stage.threshold - 0.04 })),
    [p]
  );

  const threadD = `M ${nodes[0].x} ${Y} L ${nodes[nodes.length - 1].x} ${Y}`;
  const gradId = `rsFlowGrad-${uid}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      style={{ height, width: '100%' }}
      role="img"
      aria-label="Recovery path from failure to captured revenue"
      data-testid="recovery-flow-map"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(239,68,68,0.5)" />
          <stop offset="35%" stopColor={SVG.primary} />
          <stop offset="100%" stopColor={SVG.teal} />
        </linearGradient>
      </defs>

      {/* ghost thread */}
      <path
        d={threadD}
        fill="none"
        stroke={SVG.hairlineMuted}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="5 7"
        opacity="0.55"
      />

      {/* healed segment */}
      <motion.path
        d={threadD}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="2"
        strokeLinecap="round"
        pathLength={pathLen}
        strokeDasharray={pathLen}
        animate={{ strokeDashoffset: pathLen * (1 - p) }}
        transition={reduce ? { duration: 0 } : { duration: 0.35, ease: 'easeOut' }}
      />

      {nodes.map((node, i) => {
        const tone = node.lit ? TONE[node.tone] : TONE.idle;
        const isLast = i === nodes.length - 1;
        const showRing = recovered && isLast;

        return (
          <g key={node.id}>
            {showRing && (
              <circle cx={node.x} cy={Y} r={9} fill="none" stroke={SVG.teal} strokeWidth="1" opacity="0.4" />
            )}
            <circle cx={node.x} cy={Y} r={node.lit ? 4 : 3} fill={tone.dot} />
            <text
              x={node.x}
              y={LABEL_Y}
              textAnchor="middle"
              fill={node.lit ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.28)'}
              fontSize="9"
              fontFamily="IBM Plex Mono, monospace"
              letterSpacing="0.04em"
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export { STAGES as RECOVERY_FLOW_STAGES };
