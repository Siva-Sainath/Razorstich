import React, { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SVG } from './svgTokens';

const CHANNELS = ['SMS', 'WA', 'Email'];

/** Trust budget as suture eyelets — each outreach consumes a stitch slot. */
export const TrustBudgetGauge = ({
  used = 0,
  max = 3,
  className = '',
  height = 56,
}) => {
  const uid = useId().replace(/:/g, '');
  const reduce = useReducedMotion();
  const W = 220;
  const threadY = 22;

  return (
    <svg
      viewBox={`0 0 ${W} 48`}
      className={className}
      style={{ height, width: '100%', maxWidth: W }}
      aria-label={`Contacts used ${used} of ${max}`}
      data-testid="trust-budget-gauge"
    >
      <defs>
        <linearGradient id={`trustThread-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={SVG.primarySoft} />
          <stop offset="100%" stopColor={SVG.teal} />
        </linearGradient>
      </defs>

      {/* baseline thread */}
      <path
        d={`M 8 ${threadY} Q ${W / 2} ${threadY - 4}, ${W - 28} ${threadY}`}
        fill="none"
        stroke={SVG.hairlineMuted}
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d={`M 8 ${threadY} Q ${W / 2} ${threadY - 4}, ${W - 28} ${threadY}`}
        fill="none"
        stroke={`url(#trustThread-${uid})`}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeDasharray={`${((W - 36) * used) / max} ${W}`}
        opacity={used > 0 ? 0.9 : 0}
      />

      {Array.from({ length: max }).map((_, i) => {
        const x = 24 + i * 58;
        const consumed = i < used;
        const next = i === used && used < max;
        const tone = consumed ? SVG.teal : next ? SVG.primary : SVG.hairline;

        return (
          <g key={i}>
            {/* eyelet */}
            <ellipse
              cx={x}
              cy={threadY}
              rx={14}
              ry={10}
              fill={consumed ? 'rgba(45,212,191,0.08)' : SVG.fillSoft}
              stroke={tone}
              strokeWidth="1.25"
            />
            {/* cross-stitch through eyelet */}
            <line x1={x - 6} y1={threadY - 4} x2={x + 6} y2={threadY + 4} stroke={consumed ? SVG.teal : SVG.hairline} strokeWidth="0.75" opacity={0.7} />
            <line x1={x - 6} y1={threadY + 4} x2={x + 6} y2={threadY - 4} stroke={consumed ? SVG.teal : SVG.hairline} strokeWidth="0.75" opacity={0.7} />
            <text
              x={x}
              y={threadY + 22}
              textAnchor="middle"
              fill={consumed ? SVG.inkMuted : SVG.inkFaint}
              fontSize="8"
              fontFamily="IBM Plex Mono, monospace"
            >
              {CHANNELS[i] || i + 1}
            </text>
            {next && !reduce && (
              <motion.circle
                cx={x}
                cy={threadY}
                r={16}
                fill="none"
                stroke={SVG.primary}
                strokeWidth="1"
                animate={{ opacity: [0.25, 0.7, 0.25] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
          </g>
        );
      })}

      <text x={W - 8} y={threadY + 4} textAnchor="end" fill={SVG.inkMuted} fontSize="11" fontFamily="IBM Plex Mono, monospace">
        {used}/{max}
      </text>
    </svg>
  );
};
