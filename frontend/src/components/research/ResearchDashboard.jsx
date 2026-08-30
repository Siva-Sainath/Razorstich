import { MarketingPageShell } from '@/components/landing/MarketingPageShell';

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { API } from '@/lib/timelineContext';
import { RECOVERY_LANES } from '@/config/recoveryScenarios';
import { ResearchEssay } from './ResearchEssay';

export const ResearchDashboard = () => {
  const [catalog, setCatalog] = useState(null);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get(`${API}/wedges/catalog`, { timeout: 120000 })
      .then((r) => {
        setCatalog(r.data.wedges);
        setMeta(r.data.meta || null);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <MarketingPageShell>
      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <header className="mb-10 sm:mb-12" data-testid="research-cover">
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
              One scrollable essay — problem, algorithm, training runs, honest benchmark deltas, and links to live
              validation replays. All numbers from <code className="text-white/65">eval/results/</code>.
            </p>
            {meta?.train_v2?.episodes && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 type-micro font-mono text-primary">
                  v2 · {meta.train_v2.episodes.toLocaleString()} episodes · seed {meta.train_v2.seed ?? 42}
                </span>
                {meta.train_v2.v2_kept?.includes('checkout_failed') && (
                  <span className="rounded-full border border-success/30 bg-success/10 px-3 py-1 type-micro text-success">
                    Checkout v2 shipped to demo
                  </span>
                )}
                {meta.train_v2.regressions_restored_to_v1?.length > 0 && (
                  <span className="rounded-full border border-warning/30 bg-warning/10 px-3 py-1 type-micro text-warning">
                    {meta.train_v2.regressions_restored_to_v1.length} scenarios restored to v1
                  </span>
                )}
              </div>
            )}
            <p className="type-micro text-white/35 mt-4">
              <a href="#section-1" className="text-primary/70 hover:text-primary">
                Start at §1
              </a>
              {' · '}
              <a href="#section-6" className="text-primary/70 hover:text-primary">
                Jump to benchmarks
              </a>
            </p>
            <div className="flex flex-wrap gap-2 mt-5 lg:hidden">
              {RECOVERY_LANES.map((lane) => (
                <Link
                  key={lane.id}
                  to={`${lane.path}?case=${lane.defaultCaseId}`}
                  className="rounded-full border border-white/10 px-3 py-1.5 type-micro text-white/55 hover:border-primary/35 hover:text-primary"
                >
                  {lane.short} demo
                </Link>
              ))}
            </div>
          </motion.div>
        </header>

        {error && <p className="type-body text-warning/90 mb-8">{error}</p>}
        {!catalog && !error && (
          <p className="type-body text-white/45 mb-8">Loading training artifacts…</p>
        )}

        {catalog && <ResearchEssay catalog={catalog} meta={meta} />}
      </div>
    </MarketingPageShell>
  );
};
