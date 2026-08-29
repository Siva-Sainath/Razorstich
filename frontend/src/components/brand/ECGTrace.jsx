import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * Live ECG trace — the brand's signature device.
 * Amplitude + heart rate map to recovery probability:
 * near-flatline when the payment is dying, strong confident beats as it recovers.
 * Transform-only scroll animation (two tiled copies translated left).
 */
const CELL = 96;

const beatPath = (cellW, midY, amp) => {
  const a = amp;
  return [
    `M 0 ${midY}`,
    `L ${cellW * 0.18} ${midY}`,
    `L ${cellW * 0.23} ${midY - a * 0.14}`, // P wave
    `L ${cellW * 0.28} ${midY}`,
    `L ${cellW * 0.35} ${midY}`,
    `L ${cellW * 0.38} ${midY + a * 0.18}`, // Q
    `L ${cellW * 0.42} ${midY - a}`, // R spike
    `L ${cellW * 0.46} ${midY + a * 0.42}`, // S
    `L ${cellW * 0.5} ${midY}`,
    `L ${cellW * 0.62} ${midY}`,
    `L ${cellW * 0.67} ${midY - a * 0.26}`, // T wave
    `L ${cellW * 0.72} ${midY}`,
    `L ${cellW} ${midY}`,
  ].join(' ');
};

export const ECGTrace = ({ prob = 0.5, height = 34, cells = 8, className = '' }) => {
  // bucket prob so the path/duration only change on meaningful moves
  const bucket = Math.round(prob * 12);
  const { path, color, duration } = useMemo(() => {
    const p = bucket / 12;
    const amp = 2.5 + p * 12.5;
    const midY = height / 2;
    // tile beat cells with x offsets, joined into one continuous stroke
    const segs = [];
    for (let i = 0; i < cells * 2; i += 1) {
      const base = beatPath(CELL, midY, amp);
      const shifted = base.replace(/([ML]) ([\d.]+) /g, (m, cmd, x) => `${cmd} ${(parseFloat(x) + i * CELL).toFixed(1)} `);
      segs.push(i === 0 ? shifted : shifted.replace(/^M [\d.]+ [\d.]+/, (mm) => `L${mm.slice(1)}`));
    }
    const c = p >= 0.65 ? '#34d399' : p >= 0.4 ? '#fbbf24' : '#fb7185';
    const dur = 3.4 - p * 1.8; // faster heartbeat as recovery approaches
    return { path: segs.join(' '), color: c, duration: dur };
  }, [bucket, height, cells]);

  const width = cells * CELL;

  return (
    <div
      className={`relative overflow-hidden pointer-events-none ${className}`}
      style={{ height }}
      aria-label="Recovery trace"
      role="img"
      data-testid="ecg-trace"
    >
      <motion.div
        key={`${bucket}`}
        className="absolute inset-y-0 left-0"
        style={{ width: width * 2 }}
        animate={{ x: [0, -CELL] }}
        transition={{ duration, repeat: Infinity, ease: 'linear' }}
      >
        <svg width={width * 2} height={height} className="block">
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth="1.6"
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 7px ${color}55)`, opacity: 0.9 }}
          />
        </svg>
      </motion.div>
      {/* phosphor fade at edges */}
      <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[hsl(210_25%_4%)] to-transparent" />
      <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[hsl(210_25%_4%)] to-transparent" />
    </div>
  );
};
