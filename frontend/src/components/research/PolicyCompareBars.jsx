import React from 'react';
import { motion } from 'framer-motion';

const inr = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

/**
 * Policy vs baseline comparison — seed scatter + mean bars.
 * Reused on Research dashboard and stage TrainingBenchmarkCard.
 */
export const PolicyCompareBars = ({
  benchmark,
  compact = false,
  policyLabel = 'Dueling DDQN',
  baselineLabel = 'Failure rules',
  className = '',
}) => {
  if (!benchmark?.policy_mean_net_inr) return null;

  const policy = benchmark.acceptance?.policy || {};
  const baseline = benchmark.acceptance?.baseline || {};
  const maxVal = Math.max(
    policy.best || benchmark.policy_mean_net_inr,
    baseline.best || benchmark.baseline_mean_net_inr,
    1
  );
  const policyPct = (benchmark.policy_mean_net_inr / maxVal) * 100;
  const baselinePct = (benchmark.baseline_mean_net_inr / maxVal) * 100;
  const lift = benchmark.acceptance?.mean_improvement_pct;

  return (
    <div className={className} data-testid="policy-compare-bars">
      <div className={compact ? 'space-y-3' : 'space-y-5'}>
        <div>
          <div className="flex justify-between items-baseline gap-2 mb-2">
            <span className={`type-micro ${compact ? '' : 'type-meta'} text-primary font-medium`}>
              {policyLabel}
            </span>
            <span className="font-mono type-metric text-primary tabular-nums">
              {inr(benchmark.policy_mean_net_inr)}
            </span>
          </div>
          <div className="h-3 rounded-full bg-white/8 overflow-hidden relative">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary/95 to-teal-400/75"
              initial={{ width: 0 }}
              animate={{ width: `${policyPct}%` }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            />
            {!compact && policy.values?.length > 0 && (
              <div className="absolute inset-0 flex items-center px-1">
                {policy.values.map((v, i) => (
                  <span
                    key={i}
                    className="absolute w-1.5 h-1.5 rounded-full bg-white/70 -translate-x-1/2"
                    style={{ left: `${(v / maxVal) * 100}%` }}
                    title={`Seed ${i}: ${inr(v)}`}
                  />
                ))}
              </div>
            )}
          </div>
          {!compact && benchmark.policy_ci95 && (
            <p className="type-micro font-mono text-white/35 mt-1.5">
              95% CI {inr(benchmark.policy_ci95[0])} – {inr(benchmark.policy_ci95[1])}
            </p>
          )}
        </div>

        <div>
          <div className="flex justify-between items-baseline gap-2 mb-2">
            <span className={`type-micro ${compact ? '' : 'type-meta'} text-white/55`}>
              {baselineLabel}
            </span>
            <span className="font-mono type-metric text-white/70 tabular-nums">
              {inr(benchmark.baseline_mean_net_inr)}
            </span>
          </div>
          <div className="h-3 rounded-full bg-white/8 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-white/35"
              initial={{ width: 0 }}
              animate={{ width: `${baselinePct}%` }}
              transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          {!compact && benchmark.baseline_ci95 && (
            <p className="type-micro font-mono text-white/35 mt-1.5">
              95% CI {inr(benchmark.baseline_ci95[0])} – {inr(benchmark.baseline_ci95[1])}
            </p>
          )}
        </div>
      </div>

      {benchmark.seeds_beaten && (
        <p className={`${compact ? 'type-micro mt-2' : 'type-meta mt-4'} text-white/55`}>
          <span className="text-success font-medium">{benchmark.seeds_beaten}</span> seeds beaten
          {lift != null && (
            <>
              {' '}
              · <span className="text-success">+{lift.toFixed(1)}%</span> mean lift
            </>
          )}
        </p>
      )}
    </div>
  );
};
