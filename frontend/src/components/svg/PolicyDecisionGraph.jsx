import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SVG } from './svgTokens';

const DEFAULT_ACTIONS = [
  { id: 'wait', x: 40, y: 28 },
  { id: 'notify', x: 100, y: 18 },
  { id: 'link', x: 160, y: 32 },
  { id: 'retry', x: 220, y: 22 },
  { id: 'stop', x: 280, y: 36 },
];

/** Decision lattice — signals → DQN → masked actions → selected path. */
export const PolicyDecisionGraph = ({
  selectedAction = '',
  blockedActions = [],
  thinking = false,
  className = '',
  height = 100,
}) => {
  const reduce = useReducedMotion();
  const blocked = useMemo(() => new Set(blockedActions), [blockedActions]);

  return (
    <svg
      viewBox="0 0 320 88"
      className={className}
      style={{ height, width: '100%' }}
      aria-hidden="true"
      data-testid="policy-decision-graph"
    >
      <rect x="8" y="8" width="72" height="72" rx="12" fill={SVG.fillSoft} stroke={SVG.hairline} strokeWidth="1" />
      <text x="44" y="38" textAnchor="middle" fill={SVG.inkMuted} fontSize="9" fontFamily="IBM Plex Mono, monospace">
        signals
      </text>
      <text x="44" y="52" textAnchor="middle" fill={SVG.inkFaint} fontSize="8" fontFamily="IBM Plex Mono, monospace">
        obs
      </text>

      <rect x="118" y="20" width="64" height="48" rx="10" fill={SVG.fillSoft} stroke={SVG.primarySoft} strokeWidth="1.5" />
      <text x="150" y="50" textAnchor="middle" fill={SVG.primary} fontSize="10" fontWeight="600" fontFamily="IBM Plex Mono, monospace">
        DQN
      </text>
      {thinking && !reduce && (
        <motion.circle
          cx={150}
          cy={44}
          r={28}
          fill="none"
          stroke={SVG.primary}
          strokeWidth="1"
          animate={{ opacity: [0.15, 0.45, 0.15] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        />
      )}

      <path d="M 80 44 L 118 44" stroke={SVG.hairline} strokeWidth="1.5" markerEnd="none" />
      <path d="M 182 44 L 210 44" stroke={SVG.hairline} strokeWidth="1.5" />

      {DEFAULT_ACTIONS.map((a) => {
        const isBlocked = blocked.has(a.id) || blocked.has(`${a.id}_sms`) || blocked.has(`${a.id}_whatsapp`);
        const isSelected =
          selectedAction === a.id ||
          selectedAction.startsWith(a.id) ||
          (a.id === 'notify' && selectedAction.includes('notify'));
        const cx = a.x;
        const cy = a.y;
        return (
          <g key={a.id} opacity={isBlocked ? 0.28 : 1}>
            <line x1="210" y1="44" x2={cx - 12} y2={cy} stroke={SVG.hairlineMuted} strokeWidth="1" />
            <circle
              cx={cx}
              cy={cy}
              r={isSelected ? 7 : 5}
              fill={isSelected ? SVG.primary : SVG.fillSoft}
              stroke={isSelected ? SVG.teal : SVG.hairline}
              strokeWidth={isSelected ? 2 : 1}
              style={isSelected ? { filter: SVG.glowPrimary } : undefined}
            />
          </g>
        );
      })}

      {selectedAction && (
        <motion.path
          d={`M 150 68 L 150 78 L ${DEFAULT_ACTIONS.find((a) => selectedAction.includes(a.id) || selectedAction === a.id)?.x || 240} 78`}
          fill="none"
          stroke={SVG.teal}
          strokeWidth="1.5"
          strokeDasharray="4 3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5 }}
        />
      )}
    </svg>
  );
};
