import React from 'react';
import { Panel } from '@/components/theater/Panel';

const inr = (value) => `₹${Math.round(value || 0).toLocaleString('en-IN')}`;

export const BenchmarkProofStrip = ({ benchmark, className }) => (
  <Panel
    title="Benchmark proof"
    subtitle="Ten seeds · 200 episodes · DQN vs failure rules."
    className={className}
    testId="benchmark-proof"
  >
    <div className="space-y-5">
      <div className="rounded-[16px] bg-primary/[0.08] border border-primary/20 p-4">
        <p className="type-body text-white/50">Dueling DDQN</p>
        <p className="font-mono text-2xl text-primary tabular-nums mt-1">{inr(benchmark.policy_mean_net_inr)}</p>
      </div>
      <div className="rounded-[16px] bg-white/[0.03] border border-white/10 p-4">
        <p className="type-body text-white/50">Failure rules baseline</p>
        <p className="font-mono text-2xl text-white/75 tabular-nums mt-1">{inr(benchmark.baseline_mean_net_inr)}</p>
      </div>
      <p className="type-body text-white/65 leading-relaxed border-t border-white/[0.08] pt-4">
        {benchmark.seeds_beaten || '—'} seeds beaten ·{' '}
        <span className="text-primary font-semibold">
          +{benchmark.acceptance?.mean_improvement_pct?.toFixed(1) || '0.0'}%
        </span>{' '}
        mean lift
      </p>
    </div>
  </Panel>
);
