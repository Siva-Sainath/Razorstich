import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * RazorStitch pulse — the live recovery signal (aqua-teal, RazorSense-calm).
 * Amplitude and pace follow recovery odds. Freezes to a shimmer when paused.
 */
const CELL = 96;

const beatPath = (cellW, midY, amp) => {
  const a = amp;
  return [
    `M 0 ${midY}`,
    `L ${cellW * 0.18} ${midY}`,
    `L ${cellW * 0.23} ${midY - a * 0.14}`,
    `L ${cellW * 0.28} ${midY}`,
    `L ${cellW * 0.35} ${midY}`,
    `L ${cellW * 0.38} ${midY + a * 0.18}`,
    `L ${cellW * 0.42} ${midY - a}`,
    `L ${cellW * 0.46} ${midY + a * 0.42}`,
    `L ${cellW * 0.5} ${midY}`,
    `L ${cellW * 0.62} ${midY}`,
    `L ${cellW * 0.67} ${midY - a * 0.26}`,
    `L ${cellW * 0.72} ${midY}`,
    `L ${cellW} ${midY}`,
  ].join(' ');
};

export const ECGTrace = ({ prob = 0.5, height = 34, cells = 8, className = '', playing = true, stroke = 'rgba(45,212,191,0.65)', glow = true }) => {
  const reduce = useReducedMotion();
  const bucket = Math.round(prob * 12);
  const { path, duration } = useMemo(() => {
    const p = bucket / 12;
    const amp = 2.5 + p * 12.5;
    const midY = height / 2;
    const segs = [];
    for (let i = 0; i < cells * 2; i += 1) {
      const base = beatPath(CELL, midY, amp);
      const shifted = base.replace(/([ML]) ([\d.]+) /g, (m, cmd, x) => `${cmd} ${(parseFloat(x) + i * CELL).toFixed(1)} `);
      segs.push(i === 0 ? shifted : shifted.replace(/^M [\d.]+ [\d.]+/, (mm) => `L${mm.slice(1)}`));
    }
    return { path: segs.join(' '), duration: 3.4 - p * 1.8 };
  }, [bucket, height, cells]);

  const width = cells * CELL;
  const animating = playing && !reduce;

  return (
    <div
      className={`relative overflow-hidden pointer-events-none ${className}`}
      style={{
        height,
        WebkitMaskImage: 'linear-gradient(90deg, transparent, black 12%, black 88%, transparent)',
        maskImage: 'linear-gradient(90deg, transparent, black 12%, black 88%, transparent)',
      }}
      aria-label="Live recovery signal"
      role="img"
      data-testid="ecg-trace"
    >
      <motion.div
        key={`${bucket}-${animating}`}
        className="absolute inset-y-0 left-0"
        style={{ width: width * 2 }}
        animate={animating ? { x: [0, -CELL] } : { opacity: [0.5, 0.8, 0.5] }}
        transition={
          animating
            ? { duration, repeat: Infinity, ease: 'linear' }
            : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        <svg width={width * 2} height={height} className="block">
          <path
            d={path}
            fill="none"
            stroke={stroke}
            strokeWidth="1.6"
            strokeLinejoin="round"
            strokeLinecap="round"
            style={glow ? { filter: 'drop-shadow(0 0 10px rgba(45,212,191,0.25))' } : undefined}
          />
        </svg>
      </motion.div>
    </div>
  );
};
