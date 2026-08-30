import React from 'react';
import { motion } from 'framer-motion';

/** Hero pipeline — Razorpay webhook → encoder → Dueling DDQN → recovery action. */
export const RecoveryStackSvg = () => (
  <svg
    viewBox="0 0 560 280"
    className="w-full h-auto"
    aria-label="RazorStitch recovery stack"
    data-testid="recovery-stack-svg"
  >
    <defs>
      <linearGradient id="rsGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="rgba(43,138,247,0.95)" />
        <stop offset="100%" stopColor="rgba(45,212,191,0.85)" />
      </linearGradient>
      <filter id="rsGlow">
        <feGaussianBlur stdDeviation="3" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <rect x="8" y="8" width="544" height="264" rx="20" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" />

    <motion.path
      d="M 130 140 H 195 M 280 140 H 345 M 425 140 H 490"
      stroke="url(#rsGrad)"
      strokeWidth="2"
      strokeDasharray="6 6"
      fill="none"
      initial={{ pathLength: 0, opacity: 0.2 }}
      animate={{ pathLength: 1, opacity: 0.85 }}
      transition={{ duration: 1.4, ease: 'easeOut' }}
    />

    {[
      { x: 24, fig: 'FIG.1', label: 'Razorpay', sub: 'payment.failed', icon: '₹' },
      { x: 174, fig: 'FIG.2', label: 'State encoder', sub: 'scenario router', icon: 'Σ' },
      { x: 324, fig: 'FIG.3', label: 'Dueling DDQN', sub: 'masked Q-max', icon: 'Q' },
      { x: 474, fig: 'FIG.4', label: 'Recovery', sub: 'link · notify', icon: '✓' },
    ].map((node, i) => (
      <g key={node.label} transform={`translate(${node.x}, 72)`}>
        <text x="52" y="-8" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="9" fontFamily="IBM Plex Mono, monospace">
          {node.fig}
        </text>
        <rect x="0" y="0" width="104" height="112" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" />
        <text x="52" y="48" textAnchor="middle" fill="rgba(43,138,247,0.95)" fontSize="22" fontFamily="IBM Plex Mono, monospace">
          {node.icon}
        </text>
        <text x="52" y="72" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">
          {node.label}
        </text>
        <text x="52" y="90" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="IBM Plex Mono, monospace">
          {node.sub}
        </text>
        {i === 2 && (
          <circle cx="52" cy="48" r="24" fill="none" stroke="rgba(43,138,247,0.3)" strokeWidth="1" filter="url(#rsGlow)">
            <animate attributeName="r" values="22;28;22" dur="3s" repeatCount="indefinite" />
          </circle>
        )}
      </g>
    ))}

    <text x="280" y="248" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="10" fontFamily="IBM Plex Mono, monospace">
      episode in seconds · 2.5% only on recovered INR
    </text>
  </svg>
);
