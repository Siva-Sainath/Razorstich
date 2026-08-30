import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { smoothPath } from '@/lib/svg';
import { SVG } from './svgTokens';

/** Training checkpoint ridge line with milestone nodes. */
export const LearningCheckpointRail = ({
  episodes = [500, 2000, 5000, 7500, 10000],
  selectedEpisode = null,
  curve = [],
  className = '',
  height = 72,
}) => {
  const W = 300;
  const H = 56;
  const maxEp = episodes[episodes.length - 1] || 10000;

  const pts = useMemo(() => {
    if (curve?.length) {
      const maxVal = Math.max(...curve.map((r) => r.val_net_inr || r.p || 0), 1);
      return curve.map((row) => ({
        x: 8 + ((row.episode || 0) / maxEp) * (W - 16),
        y: 8 + (1 - (row.val_net_inr ?? row.p ?? 0) / maxVal) * (H - 16),
      }));
    }
    return episodes.map((ep, i) => ({
      x: 8 + (ep / maxEp) * (W - 16),
      y: 12 + (i % 2) * 8 + (1 - i / episodes.length) * (H - 28),
    }));
  }, [curve, episodes, maxEp]);

  const path = smoothPath(pts);

  return (
    <svg
      viewBox={`0 0 ${W} ${H + 8}`}
      className={className}
      style={{ height, width: '100%' }}
      aria-hidden="true"
      data-testid="learning-checkpoint-rail"
    >
      <path d={path} fill="none" stroke={SVG.hairlineMuted} strokeWidth="1" />
      <path d={path} fill="none" stroke={SVG.primary} strokeWidth="1.75" strokeLinecap="round" opacity="0.85" />
      {episodes.map((ep) => {
        const x = 8 + (ep / maxEp) * (W - 16);
        const sel = selectedEpisode === ep;
        return (
          <g key={ep}>
            <line x1={x} y1={H - 2} x2={x} y2={H + 4} stroke={SVG.hairline} strokeWidth="1" />
            <motion.circle
              cx={x}
              cy={H - 6}
              r={sel ? 5 : 3.5}
              fill={sel ? SVG.primary : SVG.fillSoft}
              stroke={sel ? SVG.teal : SVG.hairline}
              strokeWidth={sel ? 2 : 1}
              animate={sel ? { scale: [1, 1.08, 1] } : {}}
              transition={{ repeat: sel ? Infinity : 0, duration: 2 }}
            />
          </g>
        );
      })}
    </svg>
  );
};
