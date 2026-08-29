import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const R = 74;
const CIRC = 2 * Math.PI * R;

/** Recovery odds ring — azure→aqua gradient arc with spring motion and a rotating specular highlight. */
export const OddsRing = ({ prob = 0.5, size = 190, children }) => {
  const reduce = useReducedMotion();
  return (
    <div className="relative" style={{ width: size, height: size }} data-testid="odds-ring">
      <svg width={size} height={size} viewBox="0 0 180 180" className="block -rotate-90">
        <defs>
          <linearGradient id="oddsGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(213 89% 58%)" />
            <stop offset="100%" stopColor="rgba(45,212,191,0.95)" />
          </linearGradient>
        </defs>
        <circle cx="90" cy="90" r={R} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="10" />
        <motion.circle
          cx="90"
          cy="90"
          r={R}
          fill="none"
          stroke="url(#oddsGradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          animate={{ strokeDashoffset: CIRC * (1 - prob) }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          style={{ filter: 'drop-shadow(0 0 14px rgba(43,138,247,0.35))' }}
        />
        {/* rotating specular highlight */}
        {!reduce && (
          <motion.circle
            cx="90"
            cy="90"
            r={R}
            fill="none"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`8 ${CIRC - 8}`}
            opacity="0.15"
            animate={{ rotate: 360 }}
            transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '90px 90px' }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
};
