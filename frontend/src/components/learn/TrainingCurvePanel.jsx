import React, { useMemo } from 'react';
import { Panel } from '@/components/theater/Panel';
import { smoothPath } from '@/lib/svg';

const W = 640;
const H = 200;
const PAD = { l: 48, r: 20, t: 24, b: 36 };

export const TrainingCurvePanel = ({ curve, className }) => {
  const maxVal = Math.max(...curve.map((row) => row.val_net_inr), 1);
  const maxEp = Math.max(...curve.map((row) => row.episode), 1);

  const pts = useMemo(
    () =>
      curve.map((row) => ({
        x: PAD.l + (row.episode / maxEp) * (W - PAD.l - PAD.r),
        y: PAD.t + (1 - row.val_net_inr / maxVal) * (H - PAD.t - PAD.b),
      })),
    [curve, maxEp, maxVal]
  );

  const linePath = smoothPath(pts);
  const areaPath = pts.length
    ? `${linePath} L ${pts[pts.length - 1].x} ${H - PAD.b} L ${pts[0].x} ${H - PAD.b} Z`
    : '';

  const latest = curve[curve.length - 1];
  const first = curve[0];

  return (
    <Panel
      title="Validation learning arc"
      subtitle="Net recovered value on the fixed validation set as training progresses."
      className={className}
      testId="training-curve"
      variant="focus"
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto max-h-[220px]" role="img" aria-label="Training validation curve">
        <defs>
          <linearGradient id="trainFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(213 89% 56%)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="hsl(213 89% 56%)" stopOpacity="0" />
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
        <path d={areaPath} fill="url(#trainFill)" />
        <path d={linePath} fill="none" stroke="rgba(43,138,247,0.95)" strokeWidth="2.5" strokeLinecap="round" />
        {pts.map((pt, i) => (
          <circle key={curve[i].episode} cx={pt.x} cy={pt.y} r="4" fill="white" stroke="rgba(43,138,247,0.9)" strokeWidth="2" />
        ))}
        <text x={PAD.l} y={H - 10} fontSize="13" fill="rgba(255,255,255,0.45)" fontFamily="IBM Plex Mono, monospace">ep {first?.episode || 0}</text>
        <text x={W - PAD.r} y={H - 10} textAnchor="end" fontSize="13" fill="rgba(255,255,255,0.45)" fontFamily="IBM Plex Mono, monospace">ep {latest?.episode || 0}</text>
      </svg>
      <div className="mt-4 flex flex-wrap gap-6 type-body">
        <div>
          <p className="text-white/45 type-body">Start</p>
          <p className="font-mono type-metric text-white/75 tabular-nums">₹{Math.round(first?.val_net_inr || 0).toLocaleString('en-IN')}</p>
        </div>
        <div>
          <p className="text-white/45 type-body">Converged</p>
          <p className="font-mono type-metric text-primary tabular-nums">₹{Math.round(latest?.val_net_inr || 0).toLocaleString('en-IN')}</p>
        </div>
        <div>
          <p className="text-white/45 type-body">Exploration</p>
          <p className="font-mono type-metric text-white/75 tabular-nums">ε {Number(latest?.epsilon || 0).toFixed(2)}</p>
        </div>
      </div>
    </Panel>
  );
};
