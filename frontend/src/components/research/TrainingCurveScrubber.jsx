import React, { useMemo, useState } from 'react';
import { SCENARIO_CHART_ACCENT } from '@/config/trainingNarrative';
import { recoveryScenarioLabel } from '@/config/consumerCopy';

const inr = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

/** Training curve scrubber — episode slider + sparkline for §5. */
export const TrainingCurveScrubber = ({ catalog }) => {
  const checkout = catalog?.find((w) => w.wedge === 'checkout_failed');
  const curve = checkout?.training_curve || [];
  const milestones = checkout?.manifest || [];
  const [scrubEp, setScrubEp] = useState(10000);

  const scrubPoint = useMemo(() => {
    if (!curve.length) return null;
    let best = curve[0];
    for (const pt of curve) {
      if (pt.episode <= scrubEp) best = pt;
      else break;
    }
    return best;
  }, [curve, scrubEp]);

  if (!curve.length) {
    return <p className="type-micro text-white/40">Training curve loading from eval/results/…</p>;
  }

  const accent = SCENARIO_CHART_ACCENT.checkout_failed;
  const maxV = Math.max(...curve.map((p) => p.val_net_inr || 0), 1);
  const scrubIdx = curve.findIndex((p) => p.episode === scrubPoint?.episode);

  return (
    <div className="rounded-[16px] border border-white/[0.08] bg-black/30 p-4" data-testid="training-curve-scrubber">
      <div className="flex justify-between items-baseline mb-3 flex-wrap gap-2">
        <span className="type-micro text-white/45">{recoveryScenarioLabel('checkout_failed')} · val_net_inr</span>
        <span className="font-mono type-metric text-accent tabular-nums">
          {scrubPoint ? inr(scrubPoint.val_net_inr) : '—'}
        </span>
      </div>
      <p className="type-meta text-white/50 mb-4">
        {scrubPoint
          ? `At episode ${scrubEp}, validation net INR is ${inr(scrubPoint.val_net_inr)}. Peak usually lands around ep 1.2k–3k; we trained to 20k for milestone artifacts.`
          : 'Drag the slider to scrub training episodes.'}
      </p>
      <input
        type="range"
        min={curve[0]?.episode || 500}
        max={curve[curve.length - 1]?.episode || 20000}
        step={500}
        value={scrubEp}
        onChange={(e) => setScrubEp(Number(e.target.value))}
        className="w-full accent-primary h-1.5 rounded-full"
        aria-label="Training episode scrubber"
      />
      <div className="flex justify-between type-micro text-white/35 mt-2 font-mono tabular-nums">
        <span>ep {curve[0]?.episode}</span>
        <span>ep {scrubEp}</span>
        <span>ep {curve[curve.length - 1]?.episode}</span>
      </div>
      <svg viewBox="0 0 280 48" className="w-full h-12 mt-3" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke={accent.stroke}
          strokeWidth="1.5"
          points={curve
            .map((pt, i) => {
              const x = (i / (curve.length - 1)) * 280;
              const y = 44 - ((pt.val_net_inr || 0) / maxV) * 40;
              return `${x},${y}`;
            })
            .join(' ')}
        />
        {scrubPoint && scrubIdx >= 0 && (
          <circle
            cx={(scrubIdx / Math.max(curve.length - 1, 1)) * 280}
            cy={44 - ((scrubPoint.val_net_inr || 0) / maxV) * 40}
            r="4"
            fill={accent.stroke}
          />
        )}
      </svg>
      {milestones.length > 0 && (
        <p className="type-micro text-white/35 mt-2">
          Checkpoints: {milestones.map((m) => `ep ${m.episode}`).join(' · ')}
        </p>
      )}
    </div>
  );
};
