import React from 'react';
import { SVG } from './svgTokens';

/** Bracket annotation for compressed active replay window. */
export const ActiveWindowBracket = ({
  startPct = 0,
  endPct = 100,
  label = 'Active window',
  className = '',
  height = 20,
}) => (
  <svg
    viewBox="0 0 200 24"
    className={className}
    style={{ height, width: '100%' }}
    aria-hidden="true"
    data-testid="active-window-bracket"
  >
    <line x1={startPct * 2} y1={12} x2={endPct * 2} y2={12} stroke={SVG.primarySoft} strokeWidth="1" strokeDasharray="3 4" />
    <path
      d={`M ${startPct * 2} 4 L ${startPct * 2} 20 M ${endPct * 2} 4 L ${endPct * 2} 20`}
      stroke={SVG.primary}
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />
    <text x={100} y={8} textAnchor="middle" fill={SVG.inkFaint} fontSize="8" fontFamily="IBM Plex Mono, monospace">
      {label}
    </text>
  </svg>
);
