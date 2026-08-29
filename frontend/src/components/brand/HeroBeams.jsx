import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/** Thin engineered light beams behind the hero — bespoke SVG, no raster. */
export const HeroBeams = () => {
  const reduce = useReducedMotion();
  const drift = reduce
    ? {}
    : {
        animate: { x: [0, 18, -14, 0], y: [0, -6, 8, 0] },
        transition: { duration: 70, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
      };

  return (
    <div className="absolute inset-x-0 top-0 h-[420px] overflow-hidden pointer-events-none" aria-hidden="true" style={{ opacity: 0.55 }}>
      <motion.svg
        width="100%"
        height="520"
        viewBox="0 0 1200 520"
        preserveAspectRatio="xMidYMin slice"
        fill="none"
        {...drift}
      >
        <defs>
          <linearGradient id="beam" x1="0" y1="0" x2="1200" y2="0">
            <stop offset="0" stopColor="rgba(43,138,247,0)" />
            <stop offset="0.35" stopColor="rgba(43,138,247,0.22)" />
            <stop offset="0.55" stopColor="rgba(45,212,191,0.16)" />
            <stop offset="1" stopColor="rgba(45,212,191,0)" />
          </linearGradient>
          <filter id="beamBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path d="M-40 120 C 220 40, 520 40, 820 140 S 1240 260, 1320 220" stroke="url(#beam)" strokeWidth="1.25" strokeLinecap="round" filter="url(#beamBlur)" opacity="0.9" />
        <path d="M-60 210 C 260 120, 560 120, 860 220 S 1260 340, 1340 300" stroke="rgba(255,255,255,0.10)" strokeWidth="1" strokeLinecap="round" opacity="0.55" />
        <path d="M-80 70 C 260 10, 560 10, 900 110 S 1280 240, 1380 190" stroke="rgba(43,138,247,0.14)" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
      </motion.svg>
    </div>
  );
};
