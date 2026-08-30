import React from 'react';
import { motion } from 'framer-motion';

/** SVG pipeline: Razorpay webhook → policy → recovery action */
export const PipelineFlowSvg = () => (
  <svg
    viewBox="0 0 520 200"
    className="w-full h-auto max-h-[200px]"
    aria-label="Payment recovery pipeline"
    data-testid="pipeline-flow-svg"
  >
    <defs>
      <linearGradient id="pipeGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="rgba(43,138,247,0.9)" />
        <stop offset="100%" stopColor="rgba(45,212,191,0.8)" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* Connection lines */}
    <motion.path
      d="M 108 100 H 168 M 252 100 H 312 M 396 100 H 456"
      stroke="url(#pipeGrad)"
      strokeWidth="1.5"
      strokeDasharray="4 4"
      initial={{ pathLength: 0, opacity: 0.3 }}
      animate={{ pathLength: 1, opacity: 0.8 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
    />

    {[
      { x: 24, label: 'Razorpay', sub: 'payment.failed', icon: '₹' },
      { x: 168, label: 'Wedge router', sub: 'encode state', icon: '→' },
      { x: 312, label: 'Dueling DDQN', sub: 'masked Q-max', icon: 'Q' },
      { x: 456, label: 'Recovery', sub: 'link · notify', icon: '✓' },
    ].map((node, i) => (
      <g key={node.label} transform={`translate(${node.x - 44}, 52)`}>
        <rect
          x="0"
          y="0"
          width="88"
          height="96"
          rx="12"
          fill="rgba(255,255,255,0.04)"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />
        <text x="44" y="38" textAnchor="middle" fill="rgba(43,138,247,0.95)" fontSize="18" fontFamily="IBM Plex Mono, monospace">
          {node.icon}
        </text>
        <text x="44" y="58" textAnchor="middle" fill="rgba(255,255,255,0.88)" fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif">
          {node.label}
        </text>
        <text x="44" y="74" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="IBM Plex Mono, monospace">
          {node.sub}
        </text>
        {i === 2 && (
          <circle cx="44" cy="38" r="20" fill="none" stroke="rgba(43,138,247,0.25)" strokeWidth="1" filter="url(#glow)">
            <animate attributeName="r" values="18;22;18" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3s" repeatCount="indefinite" />
          </circle>
        )}
      </g>
    ))}
  </svg>
);
