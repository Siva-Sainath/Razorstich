import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { smoothPath } from '@/lib/svg';
import { SVG } from './svgTokens';

/** Compact revenue/recovery spark for queue rows and cards. */
export const RevenueRecoverySpark = ({
  values = [0.2, 0.35, 0.32, 0.55, 0.72, 0.88],
  className = '',
  width = 80,
  height = 28,
  animate = false,
}) => {
  const W = 80;
  const H = 28;
  const pts = useMemo(() => {
    const max = Math.max(...values, 0.01);
    return values.map((v, i) => ({
      x: 2 + (i / Math.max(values.length - 1, 1)) * (W - 4),
      y: 2 + (1 - v / max) * (H - 4),
    }));
  }, [values]);
  const path = smoothPath(pts);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={width}
      height={height}
      className={className}
      aria-hidden="true"
      data-testid="revenue-recovery-spark"
    >
      <defs>
        <linearGradient id="rsSparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={SVG.primarySoft} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path
        d={`${path} L ${pts[pts.length - 1]?.x || 0} ${H} L 2 ${H} Z`}
        fill="url(#rsSparkFill)"
      />
      <motion.path
        d={path}
        fill="none"
        stroke={SVG.teal}
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={animate ? { pathLength: 0 } : false}
        animate={animate ? { pathLength: 1 } : false}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </svg>
  );
};
