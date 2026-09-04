/**
 * Frozen copy of the shipped 10-seed simulator benchmark.
 * Source of truth on disk: eval/results + eval/baselines/v1 (cart/sub restored).
 * Prefer live /api/wedges/catalog when the backend is up.
 *
 * Metric: mean net recovered INR vs FailureRulesPolicy.
 * Protocol: 10 seeds (42–51) × 200 rollout episodes. Simulator, not live merchant uplift.
 */

export const RL_RUN_PROTOCOL = {
  seeds: 10,
  seedList: [42, 43, 44, 45, 46, 47, 48, 49, 50, 51],
  episodesPerSeed: 200,
  metric: 'mean net recovered INR vs failure-rules',
  disclaimer: 'Simulator benchmark — not live merchant uplift.',
  hpoTrialsPerWedge: 6,
  hpoEpisodesPerTrial: 1500,
  hpoTrialsTotal: 24,
};

export const RL_RUN_STATS = {
  checkout_failed: {
    gen: 'v2',
    shipped: true,
    label: 'v2 HPO-tuned · 20k episodes',
    episodesTrained: 20000,
    liftPct: 61.17380092963457,
    policyMeanNetInr: 516614.05237028544,
    baselineMeanNetInr: 320532.2759595583,
    seedsBeaten: '10/10',
    policyCi95: [515368.69103173853, 517938.5513838616],
    baselineCi95: [319362.9630700176, 321455.68047868554],
  },
  cart_abandon: {
    gen: 'v1',
    shipped: true,
    label: 'v1 restored after v2 regression',
    episodesTrained: 10000,
    liftPct: 210.57764594910515,
    policyMeanNetInr: 558302.2499195928,
    baselineMeanNetInr: 179762.53513463834,
    seedsBeaten: '10/10',
    policyCi95: [556399.2454416764, 559894.321743009],
    baselineCi95: [176142.8502833874, 183938.1558911296],
  },
  subscription_failed: {
    gen: 'v1',
    shipped: true,
    label: 'v1 restored after v2 regression',
    episodesTrained: 10000,
    liftPct: 72.57638764280591,
    policyMeanNetInr: 453353.3830102615,
    baselineMeanNetInr: 262697.225966162,
    seedsBeaten: '10/10',
    policyCi95: [451614.5274125436, 454978.0568700508],
    baselineCi95: [260189.85465313715, 265707.4247780124],
  },
  invoice_overdue: {
    gen: 'v2',
    shipped: false,
    label: 'v2 trained · inference parity review',
    episodesTrained: 20000,
    liftPct: 127.44836752944278,
    policyMeanNetInr: 497262.6038612242,
    baselineMeanNetInr: 218626.58732727746,
    seedsBeaten: '10/10',
    policyCi95: [495352.0264206403, 498858.8583346074],
    baselineCi95: [214694.16049664034, 223062.56715215612],
  },
};

export function formatLiftPct(pct) {
  if (pct == null || Number.isNaN(Number(pct))) return null;
  return `+${Number(pct).toFixed(1)}%`;
}

export function formatInr(value) {
  return `₹${Math.round(value || 0).toLocaleString('en-IN')}`;
}

export function statsForWedge(wedgeId) {
  return RL_RUN_STATS[wedgeId] || RL_RUN_STATS.checkout_failed;
}

/** Prefer live catalog/case payload; fall back to committed eval JSON. */
export function resolveBenchmark(live, wedgeId) {
  const frozen = statsForWedge(wedgeId);
  const b = live?.benchmark || live;
  const model = live?.model || b?.model;
  const liftPct = b?.improvement_pct ?? b?.acceptance?.mean_improvement_pct ?? frozen.liftPct;
  return {
    wedgeId,
    gen: model?.gen || frozen.gen,
    shipped: model?.shipped ?? frozen.shipped,
    label: model?.label || frozen.label,
    liftPct,
    liftLabel: formatLiftPct(liftPct),
    policyMeanNetInr: b?.policy_mean_net_inr ?? frozen.policyMeanNetInr,
    baselineMeanNetInr: b?.baseline_mean_net_inr ?? frozen.baselineMeanNetInr,
    seedsBeaten: b?.seeds_beaten || b?.acceptance?.seeds_beaten_report || frozen.seedsBeaten,
    episodesPerSeed: b?.episodes_per_seed || RL_RUN_PROTOCOL.episodesPerSeed,
    seeds: b?.seeds || RL_RUN_PROTOCOL.seedList,
    acceptance: b?.acceptance,
    disclaimer: RL_RUN_PROTOCOL.disclaimer,
  };
}

export function proofMetricsFromCatalog(catalog) {
  const checkout = catalog?.find((w) => w.wedge === 'checkout_failed');
  const resolved = resolveBenchmark(checkout, 'checkout_failed');
  return [
    {
      label: 'Checkout net lift',
      value: resolved.liftLabel,
      sub: 'vs failure-rules · 10 seeds × 200 ep',
      mono: true,
    },
    {
      label: 'Seeds beaten',
      value: resolved.seedsBeaten,
      sub: 'checkout_failed simulator gate',
      mono: true,
    },
    {
      label: 'Checkout mean net',
      value: formatInr(resolved.policyMeanNetInr),
      sub: `vs ${formatInr(resolved.baselineMeanNetInr)} rules`,
      mono: true,
    },
    {
      label: 'HPO trials',
      value: String(RL_RUN_PROTOCOL.hpoTrialsTotal),
      sub: `${RL_RUN_PROTOCOL.hpoTrialsPerWedge} × 4 wedges · 1.5k ep`,
      mono: true,
    },
  ];
}
