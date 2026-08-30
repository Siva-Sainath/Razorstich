import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RECOVERY_LANES } from '@/config/recoveryScenarios';
import { recoveryScenarioLabel } from '@/config/consumerCopy';
import { ResearchFigure } from './ResearchFigure';
import { AlgorithmExplainer } from './AlgorithmExplainer';
import { MethodPipeline } from './MethodPipeline';
import { HpoSweepPanel } from './HpoSweepPanel';
import { TrainingCurveScrubber } from './TrainingCurveScrubber';
import { RunComparePanel } from './RunComparePanel';
import { PolicyCompareBars } from './PolicyCompareBars';
import { WedgeResearchPanel } from './WedgeResearchPanel';
import { DecisionLedger } from './DecisionLedger';
import { MilestoneExplorer } from './MilestoneExplorer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const SECTIONS = [
  { id: 'section-1', fig: '§1', title: 'The problem' },
  { id: 'section-2', fig: '§2', title: 'The algorithm' },
  { id: 'section-3', fig: '§3', title: 'Build the gym' },
  { id: 'section-4', fig: '§4', title: 'Six pilots, then scale' },
  { id: 'section-5', fig: '§5', title: '20k episodes' },
  { id: 'section-6', fig: '§6', title: 'Prove before ship' },
  { id: 'section-7', fig: '§7', title: 'What each agent learned' },
  { id: 'section-8', fig: '§8', title: 'Reproduce & try demos' },
];

function EssaySection({ id, fig, title, caption, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <ResearchFigure figure={fig} title={title} caption={caption}>
        {children}
      </ResearchFigure>
    </section>
  );
}

/** Eric Jang–style linear research essay — §1–§8 scroll with sticky TOC. */
export const ResearchEssay = ({ catalog, meta }) => {
  const [activeScenario, setActiveScenario] = useState('checkout_failed');
  const [activeHash, setActiveHash] = useState('section-1');

  const activeData = useMemo(
    () => catalog?.find((w) => w.wedge === activeScenario),
    [catalog, activeScenario]
  );

  const hpoData = catalog?.find((w) => w.wedge === 'checkout_failed') || activeData;

  useEffect(() => {
    const onHash = () => setActiveHash(window.location.hash.replace('#', '') || 'section-1');
    onHash();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const scrollTo = (id) => {
    window.history.replaceState(null, '', `#${id}`);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveHash(id);
  };

  const regressions = meta?.train_v2?.regressions_restored_to_v1 || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)] gap-8 lg:gap-10" data-testid="research-essay">
      {/* Sticky TOC */}
      <nav className="lg:sticky lg:top-24 lg:self-start hidden lg:block" aria-label="Research sections">
        <p className="font-mono type-micro text-white/35 uppercase tracking-wider mb-3">Sections</p>
        <ol className="space-y-1">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => scrollTo(s.id)}
                className={`w-full text-left rounded-lg px-2.5 py-2 type-micro transition-colors flex gap-2 ${
                  activeHash === s.id
                    ? 'bg-primary/12 text-primary border border-primary/25'
                    : 'text-white/50 hover:text-white/75 hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <span className="font-mono shrink-0">{s.fig}</span>
                <span className="leading-snug">{s.title}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="mt-6 pt-4 border-t border-white/[0.06] space-y-2">
          {RECOVERY_LANES.map((lane) => (
            <Link
              key={lane.id}
              to={`${lane.path}?case=${lane.defaultCaseId}`}
              className="block type-micro text-white/40 hover:text-primary transition-colors"
            >
              → {lane.short} demo
            </Link>
          ))}
        </div>
      </nav>

      {/* Linear essay body */}
      <div className="space-y-8 min-w-0">
        <EssaySection
          id="section-1"
          fig="§1"
          title="The problem"
          caption="We train offline first — Razorpay Test Mode proves webhooks, not the policy."
        >
          <p className="type-body text-white/70 leading-relaxed mb-4">
            When a Razorpay payment fails, most merchants retry blindly — same channel, same timing, same copy.
            That burns trust and duplicates UPI mandates. We asked: could an agent learn <em>when</em> to wait,{' '}
            <em>which</em> channel to try, and <em>how much</em> incentive to offer — without spamming the customer?
          </p>
          <Link to="/checkout?case=VAL-CHK-004" className="btn-primary inline-flex px-4 py-2 text-sm">
            See a validation replay →
          </Link>
        </EssaySection>

        <EssaySection
          id="section-2"
          fig="§2"
          title="The algorithm (plain English)"
          caption="Dueling Double DQN · 37-dim state · 11 masked actions · net INR reward."
        >
          <AlgorithmExplainer />
        </EssaySection>

        <EssaySection
          id="section-3"
          fig="§3"
          title="Build the gym, not the API loop"
          caption="Four failure modes · separate simulators · same export path to demo."
        >
          <p className="type-body text-white/65 leading-relaxed mb-5">
            Each failure mode — checkout decline, cart idle, subscription renewal, invoice dunning — gets its own
            recovery simulator with realistic time steps and customer response models. Training on live APIs would mean
            100k+ non-reproducible calls. We locked: <strong className="text-white/85">simulator trains · Razorpay proves · Theater replays checkpoints</strong>.
          </p>
          <MethodPipeline />
        </EssaySection>

        <EssaySection
          id="section-4"
          fig="§4"
          title="Six pilots per scenario, then scale"
          caption={
            meta?.hpo_summary
              ? `${meta.hpo_summary.trials_per_wedge} trials × ${meta.hpo_summary.episodes_per_trial} ep × 4 scenarios`
              : 'Score = peak val_net_inr minus late-drop overfit penalty.'
          }
        >
          <p className="type-body text-white/65 leading-relaxed mb-5">
            Before any 20k run, we swept learning rate, batch size, γ, warmup, and PER α across six 1,500-episode
            mini-runs per failure mode. Best configs landed in <code className="text-white/55">eval/results/hpo_*_best.json</code>.
          </p>
          <HpoSweepPanel wedgeData={hpoData} activeScenario="checkout_failed" />
        </EssaySection>

        <EssaySection
          id="section-5"
          fig="§5"
          title="20k episodes — scrub the curve"
          caption="Checkout val_net_inr on fixed scenarios every 500 episodes."
        >
          <p className="type-body text-white/65 leading-relaxed mb-5">
            Drag the slider. Watch val_net_inr climb as ε decays and PER prioritizes high-TD-error transitions.
            Checkout peaks around ep 1.2k–3k on the held-out validation set; we kept training to 20k for milestone artifacts.
          </p>
          <TrainingCurveScrubber catalog={catalog} />
          {activeData?.manifest?.length > 0 && (
            <div className="mt-6">
              <MilestoneExplorer
                scenarioId={activeScenario}
                manifest={activeData.manifest}
                trainingCurve={activeData.training_curve || []}
                anchorCaseId={activeData.featured_case_id}
              />
            </div>
          )}
        </EssaySection>

        <EssaySection
          id="section-6"
          fig="§6"
          title="Prove it before you ship"
          caption="10 seeds × 200 rollout episodes · Dueling DDQN vs failure-rules · 95% CI."
        >
          <p className="type-body text-white/65 leading-relaxed mb-5">
            <strong className="text-white/85">{recoveryScenarioLabel('checkout_failed')} v2</strong> beat v1 (+1.7% mean
            net INR) and crushed the rules baseline (+61%).{' '}
            {regressions.length > 0 && (
              <>
                <strong className="text-warning/90">{regressions.map((w) => recoveryScenarioLabel(w)).join(' and ')}</strong>{' '}
                regressed after 20k tuned runs — we auto-restored v1 weights. Regressions are not silent.
              </>
            )}
          </p>
          <RunComparePanel catalog={catalog} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
            {catalog?.map((w) => {
              const lane = RECOVERY_LANES.find((l) => l.id === w.wedge);
              const b = w.benchmark_full || w.benchmark;
              return (
                <div key={w.wedge} className="rounded-[14px] border border-white/[0.06] p-3">
                  <p className="type-micro font-medium text-white/75 mb-2">{lane?.short || w.wedge}</p>
                  {b?.policy_mean_net_inr ? (
                    <PolicyCompareBars benchmark={b} compact />
                  ) : (
                    <p className="type-micro text-white/40">benchmark pending</p>
                  )}
                </div>
              );
            })}
          </div>
          <Accordion type="single" collapsible className="mt-6">
            <AccordionItem value="ledger" className="border-white/[0.08]">
              <AccordionTrigger className="type-meta text-white/55 hover:text-white/80 py-3 hover:no-underline">
                Training decision ledger (architecture pivots)
              </AccordionTrigger>
              <AccordionContent>
                <DecisionLedger activeScenario={null} className="pt-2" />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </EssaySection>

        <EssaySection
          id="section-7"
          fig="§7"
          title="What each agent learned"
          caption="Pick a scenario — full training curve + multi-seed benchmark for that wedge."
        >
          <div className="flex flex-wrap gap-2 mb-5">
            {RECOVERY_LANES.map((lane) => (
              <button
                key={lane.id}
                type="button"
                onClick={() => setActiveScenario(lane.id)}
                className={`rounded-full px-4 py-2 type-micro font-medium border transition-colors ${
                  activeScenario === lane.id
                    ? 'border-primary/50 bg-primary/15 text-primary'
                    : 'border-white/10 text-white/50 hover:border-white/25'
                }`}
              >
                {lane.label}
              </button>
            ))}
          </div>
          {activeData && <WedgeResearchPanel wedgeData={activeData} />}
        </EssaySection>

        <EssaySection
          id="section-8"
          fig="§8"
          title="Reproduce & try the demos"
          caption="Same weights in demo and /api/policy/recommend — what you see in Q-bars is what the server scored."
        >
          <pre className="type-micro font-mono text-white/55 bg-black/40 rounded-xl p-4 overflow-x-auto mb-5">
            {`python scripts/tune_wedge.py --wedge ${activeScenario} --trials 6 --episodes 1500
EPISODES=20000 python scripts/train_all_wedges.py`}
          </pre>
          <div className="flex flex-wrap gap-2 mb-6">
            {RECOVERY_LANES.map((lane) => (
              <Link
                key={lane.id}
                to={`${lane.path}?record=1`}
                className="rounded-full border border-white/10 px-4 py-2 type-micro text-white/60 hover:border-primary/35 hover:text-primary transition-colors"
              >
                Record {lane.short} demo
              </Link>
            ))}
            <Link
              to="/pricing?plan=growth"
              className="rounded-full border border-white/10 px-4 py-2 type-micro text-white/60 hover:border-primary/35 hover:text-primary transition-colors"
            >
              Pre-book Growth
            </Link>
          </div>
          <p className="type-micro text-white/30">
            Narrative structure inspired by{' '}
            <a href="https://evjang.com" target="_blank" rel="noreferrer" className="text-white/40 hover:text-white/55">
              Eric Jang&apos;s
            </a>{' '}
            interactive ML essays.
          </p>
        </EssaySection>
      </div>
    </div>
  );
};
