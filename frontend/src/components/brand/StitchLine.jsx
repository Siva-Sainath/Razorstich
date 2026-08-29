import React from 'react';
import { motion } from 'framer-motion';
import { useTimeline } from '@/lib/timelineContext';

/**
 * Signature stitch-line — the payment journey being sutured back together.
 * The glowing reveal follows the global timeline; the red node marks failure,
 * a green node appears once the payment is recovered.
 */
export const StitchLine = () => {
  const { t, recovered } = useTimeline();

  return (
    <div className="relative w-full overflow-hidden" aria-hidden="true" data-testid="stitch-line">
      <svg width="100%" height="84" viewBox="0 0 1200 84" preserveAspectRatio="none" fill="none">
        <defs>
          <linearGradient id="stitchGlow" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="rgba(255,255,255,0.10)" />
            <stop offset="0.45" stopColor="rgba(43,138,247,0.55)" />
            <stop offset="0.62" stopColor="rgba(45,212,191,0.45)" />
            <stop offset="1" stopColor="rgba(45,212,191,0.6)" />
          </linearGradient>
          <filter id="stitchSoft" x="-20%" y="-200%" width="140%" height="500%">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* base journey line */}
        <path d="M 40 42 C 220 18, 360 18, 520 42 S 820 66, 980 42 S 1120 18, 1160 42" stroke="rgba(255,255,255,0.14)" strokeWidth="2" strokeLinecap="round" />

        {/* dashed stitches, faint */}
        <path d="M 40 42 C 220 18, 360 18, 520 42 S 820 66, 980 42 S 1120 18, 1160 42" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeLinecap="round" strokeDasharray="10 14" opacity="0.6" />

        {/* glowing reveal driven by timeline */}
        <motion.path
          d="M 40 42 C 220 18, 360 18, 520 42 S 820 66, 980 42 S 1120 18, 1160 42"
          stroke="url(#stitchGlow)"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#stitchSoft)"
          pathLength="100"
          strokeDasharray="100"
          animate={{ strokeDashoffset: 100 - t * 100 }}
          transition={{ duration: 0.2, ease: 'linear' }}
        />

        {/* perpendicular stitch ticks */}
        <g stroke="rgba(43,138,247,0.42)" strokeWidth="1" strokeLinecap="round" opacity="0.9">
          <path d="M 180 34 L 180 50" />
          <path d="M 300 30 L 300 54" />
          <path d="M 420 32 L 420 52" />
          <path d="M 660 54 L 660 30" />
          <path d="M 780 50 L 780 34" />
          <path d="M 900 46 L 900 38" />
        </g>

        {/* failure node */}
        <circle cx="520" cy="42" r="3.5" fill="rgba(239,68,68,0.75)" />
        {/* recovery node */}
        <motion.circle
          cx="1160"
          cy="42"
          r="4.5"
          fill="rgba(45,212,191,0.9)"
          animate={{ opacity: recovered ? 1 : 0.15, scale: recovered ? 1 : 0.7 }}
          transition={{ duration: 0.4 }}
          style={{ transformOrigin: '1160px 42px', filter: 'drop-shadow(0 0 8px rgba(45,212,191,0.6))' }}
        />
      </svg>
    </div>
  );
};
