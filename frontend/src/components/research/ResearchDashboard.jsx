import { MarketingPageShell } from '@/components/landing/MarketingPageShell';

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { API } from '@/lib/timelineContext';
import { WEDGE_LANES } from '@/config/wedges';
import { ResearchFigure } from './ResearchFigure';
import { MethodPipeline } from './MethodPipeline';
import { DecisionLedger } from './DecisionLedger';
import { PolicyCompareBars } from './PolicyCompareBars';
import { WedgeResearchPanel } from './WedgeResearchPanel';
import { MilestoneExplorer } from './MilestoneExplorer';
import { HpoSweepPanel } from './HpoSweepPanel';
import { RunComparePanel } from './RunComparePanel';
import { InteractiveTrainingWalkthrough } from './InteractiveTrainingWalkthrough';

export const ResearchDashboard = () => {
  const [catalog, setCatalog] = useState(null);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);
  const [activeWedge, setActiveWedge] = useState('checkout_failed');

  useEffect(() => {
    axios
      .get(`${API}/wedges/catalog`, { timeout: 120000 })
      .then((r) => {
        setCatalog(r.data.wedges);
        setMeta(r.data.meta || null);
        if (r.data.wedges?.[0]?.wedge) setActiveWedge(r.data.wedges[0].wedge);
      })
      .catch((e) => setError(e.message));
  }, []);

  const activeData = useMemo(
    () => catalog?.find((w) => w.wedge === activeWedge),
    [catalog, activeWedge]
  );

  const anchorCaseId = activeData?.featured_case_id;

  return (
    <MarketingPageShell>

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Cover — AutoGo-style hero */}
        <header className="mb-12 sm:mb-16" data-testid="research-cover">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="font-mono type-micro tracking-[0.14em] text-accent uppercase">
              Policy research · training log
            </p>
            <h1 className="font-display text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.1] mt-3 max-w-3xl">
              How four Dueling DDQN agents learned to recover revenue
            </h1>
            <p className="type-body text-white/55 mt-5 max-w-2xl leading-relaxed">
              An interactive walkthrough in the spirit of{' '}
              <a
                href="https://evjang.com/2026/04/28/autogo.html#cover"
                className="text-primary/80 hover:text-primary underline-offset-2 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Eric Jang&apos;s AutoGo tutorial
              </a>
              — numbered sections, checkpoint scrubbing, decision ledger, and honest v1→v2 benchmark deltas
              from <code className="text-white/65">eval/results/</code>.
            </p>
            {meta?.train_v2?.episodes && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 type-micro font-mono text-primary">
                  v2 · {meta.train_v2.episodes.toLocaleString()} episodes · seed {meta.train_v2.seed ?? 42}
                </span>
                {meta.train_v2.v2_kept?.includes('checkout_failed') && (
                  <span className="rounded-full border border-success/30 bg-success/10 px-3 py-1 type-micro text-success">
                    checkout_failed v2 shipped to demo
                  </span>
                )}
                {meta.train_v2.regressions_restored_to_v1?.length > 0 && (
                  <span className="rounded-full border border-warning/30 bg-warning/10 px-3 py-1 type-micro text-warning">
                    {meta.train_v2.regressions_restored_to_v1.length} wedges restored to v1
                  </span>
                )}
              </div>
            )}
            <p className="type-micro text-white/35 mt-4">
              Scroll §1–§6 in the interactive panel below · scrub training episodes · read the decision ledger.
            </p>
          </motion.div>
        </header>

        {error && <p className="type-body text-warning/90 mb-8">{error}</p>}
        {!catalog && !error && (
          <p className="type-body text-white/45 mb-8">Loading training artifacts…</p>
        )}

        {catalog && (
          <div className="space-y-10 sm:space-y-14">
            <InteractiveTrainingWalkthrough catalog={catalog} meta={meta} />

            <ResearchFigure
              figure="FIG.1"
              title="Training pipeline"
              subtitle="Five layers from simulator episode to demo replay — same path every wedge run follows."
              caption="Each wedge repeats this pipeline with its own env horizon, tick size, and exported weights JSON."
              wide
            >
              <MethodPipeline />
            </ResearchFigure>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-6 lg:gap-8">
              <ResearchFigure
                figure="FIG.2"
                title="Hyperparameter sweep"
                subtitle="Six mini-runs per wedge · 1,500 ep pilots · peak val net INR selection."
                caption="Circle size = batch size. Ring = best trial selected for the 20k full run."
              >
                <HpoSweepPanel wedgeData={activeData} activeWedge={activeWedge} />
              </ResearchFigure>

              <ResearchFigure
                figure="FIG.3"
                title="v1 → v2 benchmark delta"
                subtitle="10k baseline vs 20k tuned run · mean net INR across 10 seeds."
                caption="Snapshots v1 from eval/baselines/v1/ — regressions auto-restored to v1 weights."
              >
                <RunComparePanel catalog={catalog} />
              </ResearchFigure>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-6 lg:gap-8">
              <ResearchFigure
                figure="FIG.4"
                title="Decision ledger"
                subtitle="Architecture pivots and findings — append rows in config/trainingNarrative.js for future runs."
                caption="Filter follows selected wedge; global decisions apply to all agents."
              >
                <DecisionLedger activeWedge={activeWedge} />
              </ResearchFigure>

              <ResearchFigure
                figure="FIG.5"
                title="Four wedges at a glance"
                subtitle="Mean net INR · Dueling DDQN vs failure-rules · 10-seed acceptance."
                caption="Compact compare bars — open a wedge below for full CI bands and seed scatter."
              >
                <div className="space-y-6">
                  {catalog.map((w) => {
                    const lane = WEDGE_LANES.find((l) => l.wedge === w.wedge);
                    const b = w.benchmark_full || w.benchmark;
                    return (
                      <div key={w.wedge} className="rounded-[16px] border border-white/[0.06] p-4">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <p className="type-section text-white/85">{lane?.short || w.wedge}</p>
                          <button
                            type="button"
                            onClick={() => setActiveWedge(w.wedge)}
                            className={`type-micro rounded-full px-2.5 py-1 border transition-colors ${
                              activeWedge === w.wedge
                                ? 'border-primary/40 text-primary bg-primary/10'
                                : 'border-white/10 text-white/45 hover:text-white/70'
                            }`}
                          >
                            focus
                          </button>
                        </div>
                        {b?.policy_mean_net_inr ? (
                          <PolicyCompareBars benchmark={b} compact />
                        ) : (
                          <p className="type-micro text-white/40">benchmark pending</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ResearchFigure>
            </div>

            {/* Wedge focus tabs */}
            <div>
              <div className="flex flex-wrap gap-2 mb-5" data-testid="research-wedge-tabs">
                {WEDGE_LANES.map((lane) => (
                  <button
                    key={lane.wedge}
                    type="button"
                    onClick={() => setActiveWedge(lane.wedge)}
                    className={`rounded-full px-4 py-2 type-micro font-medium border transition-colors ${
                      activeWedge === lane.wedge
                        ? 'border-primary/50 bg-primary/15 text-primary'
                        : 'border-white/10 text-white/50 hover:border-white/25'
                    }`}
                  >
                    {lane.label}
                  </button>
                ))}
              </div>
              <WedgeResearchPanel wedgeData={activeData} />
            </div>

            <MilestoneExplorer
              wedge={activeWedge}
              manifest={activeData?.manifest || []}
              trainingCurve={activeData?.training_curve || []}
              anchorCaseId={anchorCaseId}
            />

            <footer className="rounded-[20px] border border-white/[0.06] bg-black/30 px-5 py-6">
              <p className="type-section text-white/80">Reproduce a training run</p>
              <pre className="mt-3 type-micro font-mono text-white/55 bg-black/40 rounded-xl p-4 overflow-x-auto">
                {`python scripts/tune_wedge.py --wedge ${activeWedge} --trials 6 --episodes 1500
EPISODES=20000 python scripts/train_all_wedges.py`}
              </pre>
              <p className="type-meta mt-4 text-white/40">
                Docs ·{' '}
                <Link to="/checkout" className="text-primary/80 hover:text-primary">checkout demo</Link>
                {' · '}
                <a href="https://evjang.com/2026/04/28/autogo.html#cover" target="_blank" rel="noreferrer" className="text-primary/80 hover:text-primary">
                  AutoGo tutorial reference
                </a>
              </p>
            </footer>
          </div>
        )}
      </div>
    </MarketingPageShell>
  );
};
