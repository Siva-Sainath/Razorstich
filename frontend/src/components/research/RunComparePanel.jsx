import React from 'react';
import { motion } from 'framer-motion';

const inr = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

/**
 * v1 vs v2 benchmark comparison bars per wedge.
 */
export const RunComparePanel = ({ catalog }) => {
  if (!catalog?.length) return null;

  const rows = catalog
    .map((w) => {
      const v2 = w.benchmark_full || w.benchmark;
      const v1 = w.baseline_benchmark;
      if (!v2?.policy_mean_net_inr || !v1?.policy_mean_net_inr) return null;
      const delta = v2.policy_mean_net_inr - v1.policy_mean_net_inr;
      const deltaPct = v1.policy_mean_net_inr ? (delta / v1.policy_mean_net_inr) * 100 : 0;
      return {
        wedge: w.wedge,
        label: w.short_label || w.name || w.wedge,
        v1: v1.policy_mean_net_inr,
        v2: v2.policy_mean_net_inr,
        delta,
        deltaPct,
        improved: delta >= 0,
      };
    })
    .filter(Boolean);

  if (!rows.length) {
    return (
      <p className="type-micro text-white/40">
        v1 baseline snapshot required at eval/baselines/v1/ for before/after compare.
      </p>
    );
  }

  const maxVal = Math.max(...rows.flatMap((r) => [r.v1, r.v2]), 1);

  return (
    <div className="space-y-5" data-testid="run-compare-panel">
      {rows.map((row, i) => (
        <div key={row.wedge} className="rounded-[14px] border border-white/[0.06] p-4">
          <div className="flex justify-between items-baseline mb-3">
            <p className="type-section text-white/85">{row.label}</p>
            <span
              className={`type-micro font-mono tabular-nums ${
                row.improved ? 'text-success' : 'text-warning'
              }`}
            >
              {row.improved ? '+' : ''}
              {row.deltaPct.toFixed(1)}%
            </span>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex justify-between type-micro text-white/45 mb-1">
                <span>v1 · 10k ep</span>
                <span className="font-mono tabular-nums">{inr(row.v1)}</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/8 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-white/30"
                  initial={{ width: 0 }}
                  animate={{ width: `${(row.v1 / maxVal) * 100}%` }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between type-micro text-primary/80 mb-1">
                <span>v2 · 20k ep tuned</span>
                <span className="font-mono tabular-nums text-primary">{inr(row.v2)}</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/8 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary/90 to-teal-400/70"
                  initial={{ width: 0 }}
                  animate={{ width: `${(row.v2 / maxVal) * 100}%` }}
                  transition={{ duration: 0.5, delay: i * 0.06 + 0.05 }}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
