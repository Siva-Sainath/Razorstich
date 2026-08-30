import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SCENARIO_CHART_ACCENT } from '@/config/trainingNarrative';
import { recoveryScenarioLabel } from '@/config/consumerCopy';

const inr = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

/**
 * Interactive training narrative — numbered beats with milestone scrubbing.
 */
export const InteractiveTrainingWalkthrough = ({ catalog, meta }) => {
  const [activeBeat, setActiveBeat] = useState(0);
  const [scrubEp, setScrubEp] = useState(10000);

  const checkout = catalog?.find((w) => w.wedge === 'checkout_failed');
  const curve = checkout?.training_curve || [];
  const milestones = checkout?.manifest || [];

  const scrubPoint = useMemo(() => {
    if (!curve.length) return null;
    let best = curve[0];
    for (const pt of curve) {
      if (pt.episode <= scrubEp) best = pt;
      else break;
    }
    return best;
  }, [curve, scrubEp]);

  const beats = [
    {
      id: 'problem',
      fig: '§1',
      title: 'We started with a question',
      body: 'When a Razorpay payment fails, most merchants retry blindly — same channel, same timing, same copy. That burns trust and duplicates UPI mandates. Could an agent learn *when* to wait, *which* channel to try, and *how much* discount to offer — without spamming the customer?',
      aside: 'Offline gym first. Razorpay Test Mode proves webhooks; it does not train the policy.',
    },
    {
      id: 'gym',
      fig: '§2',
      title: 'Build the gym, not the API loop',
      body: 'Each failure mode — checkout decline, cart idle, subscription renewal, invoice dunning — gets its own recovery simulator with realistic time steps and customer response models. 20k episodes × ~5 steps would be 100k+ live API calls with non-reproducible noise. We locked: simulator trains, Razorpay proves, Theater replays checkpoints.',
      aside: '37-dim state · 11 masked actions · net INR reward (not gross %).',
    },
    {
      id: 'hpo',
      fig: '§3',
      title: 'Six pilots per scenario, then scale',
      body: 'Before any 20k run, we swept lr, batch_size, γ, warmup_steps, and PER α across six 1,500-episode mini-runs per failure mode. Score = peak val_net_inr minus late-drop overfit penalty. Best configs landed in eval/results/hpo_*_best.json.',
      aside: meta?.hpo_summary?.trials_per_wedge
        ? `${meta.hpo_summary.trials_per_wedge} trials × ${meta.hpo_summary.episodes_per_trial} ep × 4 scenarios`
        : '24 HPO trials total',
    },
    {
      id: 'train',
      fig: '§4',
      title: '20k episodes — scrub the curve yourself',
      body: 'Drag the milestone slider. Watch val_net_inr climb as ε decays and PER prioritizes high-TD-error transitions. Checkout peaks around ep 1.2k–3k on the fixed validation set; we kept training to 20k for milestone artifacts anyway.',
      aside: 'Scaled ε-decay_steps and cosine LR schedule when episodes > 10k.',
      interactive: true,
    },
    {
      id: 'prove',
      fig: '§5',
      title: 'Prove it before you ship',
      body: '10 seeds × 200 rollout episodes. Dueling DDQN vs failure-rules baseline. Acceptance = mean net INR lift with non-overlapping 95% CI. checkout_failed v2 beat v1 (+1.7%) and crushed the rules baseline (+61%). cart_abandon and subscription_failed regressed — we auto-restored v1 weights.',
      aside: 'Regressions are not silent. train_all_wedges.py restores baselines automatically.',
    },
    {
      id: 'deploy',
      fig: '§6',
      title: 'Same weights in demo and production',
      body: 'Exported JSON → zero-dependency TypeScript matmul in /api/policy/recommend. Operating Theater replays the same checkpoint on ranked validation cases. What you see in the Q-value bars is exactly what the server scored.',
      aside: `${recoveryScenarioLabel('checkout_failed')} v2 is live in the demo. Other scenarios serve v1 until v2 passes parity.`,
    },
  ];

  const beat = beats[activeBeat];
  const accent = SCENARIO_CHART_ACCENT.checkout_failed;

  return (
    <section className="rounded-[24px] border border-white/[0.08] bg-black/25 overflow-hidden" data-testid="interactive-training-walkthrough">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* Beat navigator */}
        <div className="border-b lg:border-b-0 lg:border-r border-white/[0.06] p-5 sm:p-6">
          <p className="font-mono type-micro tracking-[0.12em] text-accent uppercase mb-2">
            Interactive training log
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white/92 leading-tight mb-6">
            How we taught four agents to recover revenue
          </h2>

          <ol className="space-y-1">
            {beats.map((b, i) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => setActiveBeat(i)}
                  className={`w-full text-left rounded-xl px-3 py-2.5 transition-colors flex gap-3 items-start ${
                    activeBeat === i ? 'bg-primary/12 border border-primary/25' : 'hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <span className={`font-mono type-micro shrink-0 mt-0.5 ${activeBeat === i ? 'text-primary' : 'text-white/35'}`}>
                    {b.fig}
                  </span>
                  <span className={`type-body ${activeBeat === i ? 'text-white/90' : 'text-white/55'}`}>{b.title}</span>
                </button>
              </li>
            ))}
          </ol>

          <div className="mt-6 pt-5 border-t border-white/[0.06]">
            <p className="type-meta text-white/45 mb-2">What we achieved (v2 run)</p>
            <ul className="space-y-2 type-micro text-white/60">
              <li className="flex justify-between gap-2">
                <span>{recoveryScenarioLabel('checkout_failed')} benchmark</span>
                <span className="font-mono text-success tabular-nums">+61% vs rules</span>
              </li>
              <li className="flex justify-between gap-2">
                <span>v2 vs v1 (checkout)</span>
                <span className="font-mono text-success tabular-nums">+1.7%</span>
              </li>
              <li className="flex justify-between gap-2">
                <span>Seeds beaten</span>
                <span className="font-mono tabular-nums text-white/75">10/10</span>
              </li>
              <li className="flex justify-between gap-2">
                <span>Episodes trained</span>
                <span className="font-mono tabular-nums text-white/75">20,000</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Active beat content */}
        <div className="p-5 sm:p-6 lg:p-8 min-h-[320px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={beat.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="font-mono type-micro text-primary/80 mb-3">{beat.fig}</p>
              <h3 className="font-display text-xl sm:text-2xl font-semibold text-white/90 mb-4">{beat.title}</h3>
              <p className="type-body text-white/65 leading-relaxed mb-4">{beat.body}</p>
              <p className="type-meta text-white/40 border-l-2 border-accent/40 pl-3 mb-6">{beat.aside}</p>

              {beat.interactive && curve.length > 0 && (
                <div className="rounded-[16px] border border-white/[0.08] bg-black/30 p-4">
                  <div className="flex justify-between items-baseline mb-3">
                    <span className="type-micro text-white/45">{recoveryScenarioLabel('checkout_failed')} · val_net_inr</span>
                    <span className="font-mono type-metric text-accent tabular-nums">
                      {scrubPoint ? inr(scrubPoint.val_net_inr) : '—'}
                    </span>
                  </div>
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
                  {/* Mini sparkline */}
                  <svg viewBox="0 0 280 48" className="w-full h-12 mt-3" preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke={accent.stroke}
                      strokeWidth="1.5"
                      points={curve
                        .map((pt, i) => {
                          const maxV = Math.max(...curve.map((p) => p.val_net_inr || 0), 1);
                          const x = (i / (curve.length - 1)) * 280;
                          const y = 44 - ((pt.val_net_inr || 0) / maxV) * 40;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />
                    {scrubPoint && (
                      <circle
                        cx={
                          (curve.findIndex((p) => p.episode === scrubPoint.episode) / Math.max(curve.length - 1, 1)) * 280
                        }
                        cy={
                          44 -
                          ((scrubPoint.val_net_inr || 0) / Math.max(...curve.map((p) => p.val_net_inr || 0), 1)) * 40
                        }
                        r="4"
                        fill={accent.stroke}
                      />
                    )}
                  </svg>
                  {milestones.length > 0 && (
                    <p className="type-micro text-white/35 mt-2">
                      Milestone checkpoints: {milestones.map((m) => `ep ${m.episode}`).join(' · ')}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-3 mt-6">
                <Link to="/research" className="btn-quiet inline-flex items-center px-4">
                  Full research dashboard
                </Link>
                <Link to="/checkout" className="btn-primary inline-flex items-center px-4">
                  See v2 in demo
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
