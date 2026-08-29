import React from 'react';
import { motion } from 'framer-motion';

/**
 * M.O.T. logo mark — a notched monitor frame containing an ECG spike
 * that doubles as an upward recovery arrow. Stroke-only, instrument-etched.
 */
export const LogoMark = ({ size = 26, className = '', animate = true }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    className={className}
    role="img"
    aria-label="Midnight Operating Theater logo"
    data-testid="brand-logo-mark"
  >
    {/* monitor frame with 24° notched corner (top-right) */}
    <path
      d="M14 6 H41 L58 20 V50 Q58 58 50 58 H14 Q6 58 6 50 V14 Q6 6 14 6 Z"
      stroke="rgba(255,255,255,0.28)"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    {/* ECG trace: flatline -> spike (recovery arrow) -> uptick */}
    <motion.path
      d="M12 38 H24 L29 42 L36 16 L41 46 L46 34 H52"
      stroke="#22d3ee"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ filter: 'drop-shadow(0 0 5px rgba(34,211,238,0.5))' }}
      initial={animate ? { pathLength: 0, opacity: 0 } : false}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 1.1, ease: 'easeInOut', delay: 0.2 }}
    />
  </svg>
);
