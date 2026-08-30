/**
 * Training narrative — decisions & pivots across runs.
 * Append new entries when you change architecture, reward, or benchmark protocol.
 */
export const METHODOLOGY_LAYERS = [
  {
    step: '01',
    label: 'Simulator gym',
    detail: 'Recovery simulator + customer response model — reproducible episodes, no live API training.',
    artifact: 'packages/simulator/',
  },
  {
    step: '02',
    label: 'Dueling DDQN',
    detail: '11 masked actions · 37-dim state · ε-decay exploration · replay buffer.',
    artifact: 'packages/policy/dqn.py',
  },
  {
    step: '03',
    label: 'Validation gate',
    detail: 'Fixed val_scenarios.json held-out set · val_net_inr every 500 episodes.',
    artifact: 'packages/simulator/tasks/val_scenarios.json',
  },
  {
    step: '04',
    label: 'Multi-seed benchmark',
    detail: '10 seeds × 200 rollout episodes · Dueling vs failure-rules baseline.',
    artifact: 'eval/results/benchmark_*_stats.json',
  },
  {
    step: '05',
    label: 'Theater replay',
    detail: 'Same checkpoint weights replayed on ranked validation cases for demo.',
    artifact: 'backend/episode_builder.py',
  },
];

export const TRAINING_PIVOTS = [
  {
    id: 'offline-gym',
    when: 'Pre-training',
    kind: 'architecture',
    title: 'Train offline, prove online',
    summary:
      'Razorpay Test Mode validates webhooks — it is not the RL gym. 10k episodes × ~5 steps would mean thousands of API calls with non-reproducible noise.',
    outcome: 'Locked: simulator trains · Razorpay proves · Theater replays checkpoints.',
    scenarios: null,
  },
  {
    id: 'four-scenarios',
    when: 'v0 scenario split',
    kind: 'scope',
    title: 'One policy per failure mode',
    summary:
      'Checkout declines, cart idle, subscription renewal, and invoice dunning have different horizons, tick sizes, and customer dynamics.',
    outcome: 'Four Dueling DDQN agents with separate simulators and exported weights.',
    scenarios: null,
  },
  {
    id: 'dueling-over-dqn',
    when: 'ep ~2000 · checkout',
    kind: 'algorithm',
    title: 'Dueling DDQN beats Standard DQN',
    summary:
      'Multi-seed sweep showed DuelingDoubleDQN ahead of StandardDQN on net recovered INR with lower UPI duplicate exposure.',
    outcome: 'Adopted Dueling architecture for all scenario trainers; Standard DQN retired.',
    scenarios: ['checkout_failed'],
    episode: 2000,
  },
  {
    id: 'net-inr-primary',
    when: 'Benchmark design',
    kind: 'metric',
    title: 'Net INR > gross recovery %',
    summary:
      'Reward subtracts comm cost, friction, and duplicate penalties — gross % alone rewards spammy retries.',
    outcome: 'Acceptance tests use mean net INR with 95% CI vs failure-rules baseline.',
    scenarios: null,
  },
  {
    id: 'action-masks',
    when: 'Inference layer',
    kind: 'constraint',
    title: 'Hard masks before argmax',
    summary:
      'Trust budget (3 contacts), UPI duplicate windows, and unsafe retries are masked — policy never sees illegal actions.',
    outcome: 'Same masks in training env and /api/policy/recommend guardrails.',
    scenarios: null,
  },
  {
    id: 'val-plateau',
    when: 'ep 1500–3000 · checkout',
    kind: 'training',
    title: 'Val net jumps then plateaus',
    summary:
      'Checkout val_net_inr climbs from ~₹7k at ep500 to ~₹12k by ep1500; exploration (ε) still high — policy already near ceiling on the fixed validation set.',
    outcome: 'Kept training to ep10k for milestone checkpoints; best.pt tracks peak val net.',
    scenarios: ['checkout_failed'],
    episode: 3000,
  },
  {
    id: 'cart-rules-gap',
    when: 'Cart benchmark',
    kind: 'finding',
    title: 'Cart agent beats rules on ghost replay',
    summary:
      'VAL-CART-002 shows DQN path materially above failure-rules on the same idle-cart scenario — featured for demo.',
    outcome: 'Cart demo emphasizes counterfactual ghost compare card.',
    scenarios: ['cart_abandon'],
  },
  {
    id: 'milestone-checkpoints',
    when: 'ep 500–10000',
    kind: 'artifact',
    title: 'Milestone .pt + learning manifest',
    summary:
      'Saved checkpoints at 500, 2k, 5k, 7.5k, 10k with val_net and rollout_net logged to learning_manifest_*.json.',
    outcome: 'Research dashboard can scrub maturity on the same anchor val case.',
    scenarios: ['checkout_failed'],
    episode: 10000,
  },
  {
    id: 'per-scenario-hpo',
    when: 'Aug 2026 · v2 prep',
    kind: 'training',
    title: 'Per-scenario HPO mini-runs',
    summary:
      'Six 1,500-episode pilots per failure mode over lr, batch_size, gamma, warmup, and per_alpha. Score = peak val_net_inr minus late-drop overfit penalty.',
    outcome: 'Best config per scenario written to eval/results/hpo_{scenario}_best.json before full train.',
    scenarios: null,
  },
  {
    id: 'v2-20k-scaled-schedules',
    when: 'Aug 2026 · v2 train',
    kind: 'training',
    title: '20k episodes with scaled ε-decay + cosine LR',
    summary:
      'Doubled training horizon from 10k. epsilon_decay_steps, train_steps, and per_beta_frames scale 2× automatically when episodes > 10k.',
    outcome: 'Milestones at 1k, 4k, 10k, 15k, 20k for all four failure modes.',
    scenarios: null,
    episode: 20000,
  },
  {
    id: 'checkout-v2-win',
    when: 'Aug 2026 · v2 deploy',
    kind: 'finding',
    title: 'checkout_failed v2 ships to demo',
    summary:
      '20k-episode HPO-tuned run beat v1 on 10-seed benchmark (+1.7% mean net INR) and crushed failure-rules baseline (+61%). Exported weights live in Operating Theater and /api/policy/recommend.',
    outcome: 'v2 checkpoint kept for checkout_failed; demo shows dueling-ddqn-v2-* policy version.',
    scenarios: ['checkout_failed'],
    episode: 20000,
  },
  {
    id: 'v2-regressions-restored',
    when: 'Aug 2026 · v2 eval',
    kind: 'finding',
    title: 'Regressions auto-restored to v1',
    summary:
      'cart_abandon (557k < 558k) and subscription_failed (402k < 453k) regressed vs v1 baselines after 20k tuned runs. train_all_wedges.py copied v1 checkpoints back automatically.',
    outcome: 'Demo serves v1 weights for cart + subscription until v2 passes benchmark gate.',
    scenarios: ['cart_abandon', 'subscription_failed'],
  },
];

/** Map scenario id → accent key for charts */
export const SCENARIO_CHART_ACCENT = {
  checkout_failed: { stroke: 'rgba(43,138,247,0.95)', fill: 'rgba(43,138,247,0.18)' },
  cart_abandon: { stroke: 'rgba(245,158,11,0.95)', fill: 'rgba(245,158,11,0.18)' },
  subscription_failed: { stroke: 'rgba(167,139,250,0.95)', fill: 'rgba(167,139,250,0.18)' },
  invoice_overdue: { stroke: 'rgba(45,212,191,0.95)', fill: 'rgba(45,212,191,0.18)' },
};
