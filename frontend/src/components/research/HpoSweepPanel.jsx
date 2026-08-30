import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { WEDGE_CHART_ACCENT } from '@/config/trainingNarrative';

const inr = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

/**
 * Interactive HPO sweep scatter — lr vs peak val net, sized by batch_size.
 */
export const HpoSweepPanel = ({ wedgeData, activeWedge }) => {
  const [selectedTrial, setSelectedTrial] = useState(null);
  const hpo = wedgeData?.hpo;
  const trials = hpo?.trials || [];
  const accent = WEDGE_CHART_ACCENT[activeWedge] || WEDGE_CHART_ACCENT.checkout_failed;

  const plot = useMemo(() => {
    if (!trials.length) return null;
    const width = 520;
    const height = 260;
    const pad = { top: 20, right: 24, bottom: 36, left: 52 };
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;

    const lrs = trials.map((t) => t.params?.lr ?? t.config?.lr ?? 0);
    const vals = trials.map((t) => t.metrics?.peak_val_net_inr ?? 0);
    const batches = trials.map((t) => t.params?.batch_size ?? t.config?.batch_size ?? 128);

    const minLr = Math.min(...lrs);
    const maxLr = Math.max(...lrs);
    const minVal = Math.min(...vals);
    const maxVal = Math.max(...vals);
    const lrSpan = maxLr - minLr || 1;
    const valSpan = maxVal - minVal || 1;

    const points = trials.map((trial, i) => {
      const lr = lrs[i];
      const val = vals[i];
      const batch = batches[i];
      const x = pad.left + ((Math.log10(lr) - Math.log10(minLr)) / (Math.log10(maxLr) - Math.log10(minLr) || 1)) * innerW;
      const y = pad.top + innerH - ((val - minVal) / valSpan) * innerH;
      const r = batch === 256 ? 9 : batch === 128 ? 7 : 5;
      const isBest = trial.trial_id === hpo.best_trial_id;
      return { trial, x, y, r, isBest, batch, val, lr };
    });

    return { width, height, pad, innerH, points, minVal, maxVal };
  }, [trials, hpo?.best_trial_id]);

  if (!trials.length) {
    return (
      <p className="type-micro text-white/40">
        HPO results pending — run <code className="text-white/55">scripts/tune_wedge.py</code> for this wedge.
      </p>
    );
  }

  const active = selectedTrial ?? trials.find((t) => t.trial_id === hpo.best_trial_id) ?? trials[0];

  return (
    <div className="space-y-4" data-testid="hpo-sweep-panel">
      <svg viewBox={`0 0 ${plot.width} ${plot.height}`} className="w-full h-auto">
        <line
          x1={plot.pad.left}
          y1={plot.pad.top + plot.innerH}
          x2={plot.width - plot.pad.right}
          y2={plot.pad.top + plot.innerH}
          stroke="rgba(255,255,255,0.12)"
        />
        <line
          x1={plot.pad.left}
          y1={plot.pad.top}
          x2={plot.pad.left}
          y2={plot.pad.top + plot.innerH}
          stroke="rgba(255,255,255,0.12)"
        />
        <text x={plot.pad.left} y={plot.height - 8} className="fill-white/35 text-[10px] font-mono">
          learning rate →
        </text>
        <text
          x={12}
          y={plot.pad.top + plot.innerH / 2}
          transform={`rotate(-90 12 ${plot.pad.top + plot.innerH / 2})`}
          className="fill-white/35 text-[10px] font-mono"
        >
          peak val net INR
        </text>
        {plot.points.map(({ trial, x, y, r, isBest, batch }) => (
          <g key={trial.trial_id}>
            <motion.circle
              cx={x}
              cy={y}
              r={r}
              fill={isBest ? accent.stroke : accent.fill}
              stroke={isBest ? '#fff' : accent.stroke}
              strokeWidth={isBest ? 2 : 1}
              className="cursor-pointer"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: trial.trial_id * 0.05 }}
              onClick={() => setSelectedTrial(trial)}
            />
            <title>
              trial {trial.trial_id} · lr={trial.params?.lr} · batch={batch} · peak={inr(trial.metrics?.peak_val_net_inr)}
            </title>
          </g>
        ))}
      </svg>

      <div className="rounded-xl border border-white/[0.08] bg-black/25 p-4">
        <p className="type-micro text-white/40 uppercase tracking-wider mb-2">
          Trial {active.trial_id}
          {active.trial_id === hpo.best_trial_id && (
            <span className="ml-2 text-success">· best</span>
          )}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 type-micro font-mono text-white/65">
          <span>lr: {active.params?.lr ?? active.config?.lr}</span>
          <span>batch: {active.params?.batch_size ?? active.config?.batch_size}</span>
          <span>γ: {active.params?.gamma ?? active.config?.gamma}</span>
          <span>warmup: {active.params?.warmup_steps ?? active.config?.warmup_steps}</span>
          <span>per_α: {active.params?.per_alpha ?? active.config?.per_alpha}</span>
          <span>peak: {inr(active.metrics?.peak_val_net_inr)}</span>
        </div>
        {active.metrics?.overfit_penalty > 0 && (
          <p className="type-micro text-warning/80 mt-2">
            Overfit penalty −{inr(active.metrics.overfit_penalty)} applied to score
          </p>
        )}
      </div>

      <p className="type-micro text-white/35">
        {trials.length} trials · {hpo.episodes_per_trial} ep each · click a point to inspect config
      </p>
    </div>
  );
};
