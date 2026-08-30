import React, { useMemo } from 'react';
import { smoothPath } from '@/lib/svg';
import { WEDGE_CHART_ACCENT } from '@/config/trainingNarrative';

const W = 720;
const H = 220;
const PAD = { l: 52, r: 24, t: 28, b: 40 };

export const TrainingCurveFigure = ({
  curve = [],
  wedge = 'checkout_failed',
  milestones = [],
  pivotEpisodes = [],
  height = 220,
}) => {
  const accent = WEDGE_CHART_ACCENT[wedge] || WEDGE_CHART_ACCENT.checkout_failed;

  const { maxVal, maxEp, pts, linePath, areaPath, milestonePts } = useMemo(() => {
    if (!curve.length) return { maxVal: 1, maxEp: 1, pts: [], linePath: '', areaPath: '', milestonePts: [] };
    const maxV = Math.max(...curve.map((r) => r.val_net_inr), 1);
    const maxE = Math.max(...curve.map((r) => r.episode), 1);
    const points = curve.map((row) => ({
      x: PAD.l + (row.episode / maxE) * (W - PAD.l - PAD.r),
      y: PAD.t + (1 - row.val_net_inr / maxV) * (H - PAD.t - PAD.b),
      episode: row.episode,
      val: row.val_net_inr,
    }));
    const path = smoothPath(points);
    const area = points.length
      ? `${path} L ${points[points.length - 1].x} ${H - PAD.b} L ${points[0].x} ${H - PAD.b} Z`
      : '';
    const ms = milestones.map((ep) => {
      const row = curve.find((r) => r.episode === ep) || curve.reduce((a, b) =>
        Math.abs(b.episode - ep) < Math.abs(a.episode - ep) ? b : a
      );
      return {
        ep,
        x: PAD.l + (ep / maxE) * (W - PAD.l - PAD.r),
        y: PAD.t + (1 - (row?.val_net_inr || 0) / maxV) * (H - PAD.t - PAD.b),
      };
    });
    return { maxVal: maxV, maxEp: maxE, pts: points, linePath: path, areaPath: area, milestonePts: ms };
  }, [curve, milestones]);

  if (!curve.length) {
    return <p className="type-body text-white/45">No training_curve artifact for this wedge.</p>;
  }

  const first = curve[0];
  const last = curve[curve.length - 1];

  return (
    <div data-testid="training-curve-figure">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: height }} role="img">
        <defs>
          <linearGradient id={`trainGrad-${wedge}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent.stroke} stopOpacity="0.25" />
            <stop offset="100%" stopColor={accent.stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((p) => (
          <line
            key={p}
            x1={PAD.l}
            y1={PAD.t + (1 - p) * (H - PAD.t - PAD.b)}
            x2={W - PAD.r}
            y2={PAD.t + (1 - p) * (H - PAD.t - PAD.b)}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="4 8"
          />
        ))}
        <path d={areaPath} fill={`url(#trainGrad-${wedge})`} />
        <path d={linePath} fill="none" stroke={accent.stroke} strokeWidth="2.5" strokeLinecap="round" />
        {pivotEpisodes.map((ep) => {
          const x = PAD.l + (ep / maxEp) * (W - PAD.l - PAD.r);
          return (
            <line
              key={`pivot-${ep}`}
              x1={x}
              y1={PAD.t}
              x2={x}
              y2={H - PAD.b}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1"
              strokeDasharray="3 5"
            />
          );
        })}
        {milestonePts.map(({ ep, x, y }) => (
          <g key={ep}>
            <circle cx={x} cy={y} r="5" fill="white" stroke={accent.stroke} strokeWidth="2" />
            <text x={x} y={H - 12} textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.4)" fontFamily="IBM Plex Mono">
              {ep >= 1000 ? `${ep / 1000}k` : ep}
            </text>
          </g>
        ))}
        <text x={PAD.l} y={H - 8} fontSize="12" fill="rgba(255,255,255,0.35)" fontFamily="IBM Plex Mono">
          ep 0
        </text>
        <text x={W - PAD.r} y={H - 8} textAnchor="end" fontSize="12" fill="rgba(255,255,255,0.35)" fontFamily="IBM Plex Mono">
          ep {maxEp.toLocaleString()}
        </text>
        <text x={8} y={PAD.t + 8} fontSize="11" fill="rgba(255,255,255,0.35)" fontFamily="IBM Plex Mono">
          val net ₹
        </text>
      </svg>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="type-micro text-white/40">Start val net</p>
          <p className="font-mono type-metric text-white/75 tabular-nums">
            ₹{Math.round(first.val_net_inr).toLocaleString('en-IN')}
          </p>
        </div>
        <div>
          <p className="type-micro text-white/40">Final val net</p>
          <p className="font-mono type-metric text-primary tabular-nums">
            ₹{Math.round(last.val_net_inr).toLocaleString('en-IN')}
          </p>
        </div>
        <div>
          <p className="type-micro text-white/40">Rollout net (last)</p>
          <p className="font-mono type-metric text-white/70 tabular-nums">
            ₹{Math.round(last.rollout_net_inr || 0).toLocaleString('en-IN')}
          </p>
        </div>
        <div>
          <p className="type-micro text-white/40">ε at save</p>
          <p className="font-mono type-metric text-white/70 tabular-nums">{Number(last.epsilon).toFixed(3)}</p>
        </div>
      </div>
    </div>
  );
};
