import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { recoveryScenarioLabel } from '@/config/consumerCopy';
import { RECOVERY_BY_ID } from '@/config/recoveryScenarios';
import { TRAINING_PIVOTS } from '@/config/trainingNarrative';
import { ResearchFigure } from './ResearchFigure';
import { TrainingCurveFigure } from './TrainingCurveFigure';
import { PolicyCompareBars } from './PolicyCompareBars';

const fmt = (n) => (n ? `₹${Math.round(n).toLocaleString('en-IN')}` : '—');

export const WedgeResearchPanel = ({ wedgeData }) => {
  const wedge = wedgeData?.wedge;
  const lane = RECOVERY_BY_ID[wedge];
  const curve = wedgeData?.training_curve || [];
  const benchmark = wedgeData?.benchmark_full || wedgeData?.benchmark || {};
  const manifest = wedgeData?.manifest || [];

  const milestoneEps = manifest.map((m) => m.episode);
  const pivotEps = useMemo(
    () =>
      TRAINING_PIVOTS
        .filter((p) => p.episode && (!p.scenarios || p.scenarios.includes(wedge)))
        .map((p) => p.episode),
    [wedge]
  );

  if (wedgeData?.error) {
    return (
      <ResearchFigure title={recoveryScenarioLabel(wedge)} subtitle="Artifacts missing">
        <p className="type-body text-warning/90">{wedgeData.error}</p>
      </ResearchFigure>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" data-testid={`wedge-research-${wedge}`}>
      <ResearchFigure
        figure="FIG.4"
        title={lane?.label || wedgeData?.name}
        subtitle={`${wedgeData?.window_hours}h window · ${wedgeData?.tick_hours}h ticks · featured ${wedgeData?.featured_case_id}`}
        caption="Validation net INR on fixed scenarios every 500 episodes — vertical markers = documented training pivots."
      >
        <TrainingCurveFigure
          curve={curve}
          wedge={wedge}
          milestones={milestoneEps}
          pivotEpisodes={pivotEps}
        />
      </ResearchFigure>

      <ResearchFigure
        figure="FIG.4b"
        title="Multi-seed benchmark proof"
        subtitle={`${benchmark.episodes_per_seed || 200} episodes × ${benchmark.seeds?.length || 10} seeds`}
        caption="Each dot is one seed rollout — mean bars from eval/results/benchmark_*_stats.json acceptance block."
      >
        <PolicyCompareBars benchmark={benchmark} />
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="surface-inset rounded-xl px-3 py-2.5">
            <p className="type-micro">Worst seed</p>
            <p className="type-metric mt-1">{fmt(benchmark.policy_worst_seed_inr)}</p>
          </div>
          <div className="surface-inset rounded-xl px-3 py-2.5">
            <p className="type-micro">Best seed</p>
            <p className="type-metric mt-1">{fmt(benchmark.acceptance?.policy?.best)}</p>
          </div>
        </div>
        {benchmark.checkpoint && (
          <p className="type-micro font-mono text-white/35 mt-4 truncate">checkpoint · {benchmark.checkpoint}</p>
        )}
        {lane && (
          <Link
            to={`${lane.path}?record=1`}
            className="btn-primary inline-flex mt-5 px-4 py-2 text-xs"
          >
            Open {lane.short} demo (record mode)
          </Link>
        )}
      </ResearchFigure>
    </div>
  );
};
