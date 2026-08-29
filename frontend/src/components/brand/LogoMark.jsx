import React from 'react';
import { motion } from 'framer-motion';

/**
 * RazorStitch mark — a continuous stitch line that sutures a broken payment
 * back together: dashed segments closing into a smooth azure rise, passing
 * through a Razorpay-style chamfered needle-eye node.
 */
export const LogoMark = ({ size = 26, className = '', animate = true }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    className={className}
    role="img"
    aria-label="RazorStitch logo"
    data-testid="brand-logo-mark"
  >
    {/* rounded container tile */}
    <rect x="4" y="4" width="56" height="56" rx="14" fill="hsl(218 55% 12%)" stroke="hsl(218 28% 22%)" strokeWidth="1.5" />
    {/* broken stitch (the failure) */}
    <path
      d="M12 42 H22"
      stroke="hsl(215 18% 55%)"
      strokeWidth="3"
      strokeLinecap="round"
      strokeDasharray="4 5"
    />
    {/* needle-eye chamfer node */}
    <rect x="26.2" y="36.2" width="9.6" height="9.6" rx="2" transform="rotate(45 31 41)" fill="hsl(218 55% 12%)" stroke="hsl(213 89% 62%)" strokeWidth="2" />
    {/* suture rising into recovery */}
    <motion.path
      d="M36 40 C 42 38, 44 30, 47 24 L 52 15"
      stroke="hsl(213 89% 60%)"
      strokeWidth="3.2"
      strokeLinecap="round"
      style={{ filter: 'drop-shadow(0 0 5px hsl(213 89% 56% / 0.55))' }}
      initial={animate ? { pathLength: 0, opacity: 0 } : false}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.15 }}
    />
    {/* stitch ticks along the rise */}
    <path d="M40.5 33.5 L 44.5 36" stroke="hsl(199 92% 64%)" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
    <path d="M45.5 25.5 L 49.5 28" stroke="hsl(199 92% 64%)" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
  </svg>
);
