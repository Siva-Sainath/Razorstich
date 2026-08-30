import React from 'react';
import { Link } from 'react-router-dom';

const Cell = ({ value }) => {
  if (value === true) {
    return <span className="text-white/70">✓</span>;
  }
  if (value === false || value === '—') {
    return <span className="text-white/25">—</span>;
  }
  return <span className="type-micro text-white/55">{value}</span>;
};

export const FeatureComparisonTable = ({ rows }) => (
  <div className="overflow-x-auto rounded-[20px] border border-white/[0.08] bg-white/[0.02]" data-testid="feature-matrix">
    <table className="w-full min-w-[640px] text-left border-collapse">
      <thead>
        <tr className="border-b border-white/[0.08]">
          <th className="py-4 px-5 type-micro text-white/40 font-medium w-[40%]">Feature</th>
          <th className="py-4 px-4 type-micro text-white/50 font-medium text-center">Sandbox</th>
          <th className="py-4 px-4 type-micro text-primary/80 font-medium text-center">Growth</th>
          <th className="py-4 px-4 type-micro text-white/50 font-medium text-center">Enterprise</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.feature} className="border-b border-white/[0.04] last:border-0">
            <td className="py-3.5 px-5 type-body text-white/65">{row.feature}</td>
            <td className="py-3.5 px-4 text-center"><Cell value={row.sandbox} /></td>
            <td className="py-3.5 px-4 text-center bg-primary/[0.03]"><Cell value={row.growth} /></td>
            <td className="py-3.5 px-4 text-center"><Cell value={row.enterprise} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/** Smallest AI voice add-on */
export const VoiceAddonSection = ({ addon }) => (
  <section
    className="rounded-[24px] surface-1 p-6 sm:p-8"
    data-testid="voice-addon-section"
  >
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-8 items-start">
      <div>
        <p className="type-micro text-white/40 mb-2">Optional add-on · {addon.provider}</p>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white/92">{addon.name}</h2>
        <p className="type-body text-white/55 mt-3 leading-relaxed">{addon.tagline}</p>
        <p className="type-meta text-white/40 mt-4">{addon.pricingNote}</p>
        <p className="type-micro text-success/90 mt-2">{addon.pilotIncluded}</p>
        <div className="flex flex-wrap gap-3 mt-6">
          <a href={addon.providerUrl} target="_blank" rel="noreferrer" className="btn-quiet inline-flex items-center px-4 text-xs">
            Smallest AI pricing
          </a>
          <a href={addon.docsUrl} target="_blank" rel="noreferrer" className="type-micro text-primary/80 hover:text-primary">
            Learn more →
          </a>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <p className="type-section text-white/80 mb-2">How it works</p>
          <ol className="space-y-2">
            {addon.howItWorks.map((step, i) => (
              <li key={step} className="type-meta text-white/50 flex gap-3">
                <span className="font-mono text-white/30 shrink-0">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
        <div>
          <p className="type-section text-white/80 mb-2">Best for</p>
          <ul className="space-y-1.5">
            {addon.useCases.map((u) => (
              <li key={u} className="type-meta text-white/50 flex gap-2">
                <span className="text-teal-400/70">→</span>
                {u}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </section>
);

export const PricingTierCard = ({ plan, annual }) => {
  const price = annual ? plan.price.annual : plan.price.monthly;

  return (
    <article
      className={`relative flex flex-col rounded-[24px] p-6 sm:p-8 min-h-[420px] transition-shadow ${
        plan.highlight
          ? 'bg-white/[0.06] border-2 border-primary/40 shadow-[0_0_80px_rgba(43,138,247,0.08)]'
          : 'bg-white/[0.025] border border-white/[0.08] hover:border-white/[0.12]'
      }`}
    >
      {plan.badge && (
        <span className="absolute -top-3 left-6 type-micro font-medium text-primary bg-[hsl(218_62%_7%)] border border-primary/30 px-3 py-0.5 rounded-full">
          {plan.badge}
        </span>
      )}

      <p className="type-section text-white/90">{plan.name}</p>
      <p className="type-meta text-white/45 mt-1 min-h-[2.5rem]">{plan.tagline}</p>

      <div className="mt-6 mb-6 pb-6 border-b border-white/[0.06]">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-mono text-4xl sm:text-[2.75rem] font-semibold text-white/95 tabular-nums tracking-tight">
            {price}
          </span>
          {plan.period && <span className="type-meta text-white/40">{plan.period}</span>}
        </div>
      </div>

      <ul className="space-y-3 flex-1 mb-8">
        {plan.features.map((f) => (
          <li key={f} className="type-body text-white/60 flex gap-2.5 leading-snug">
            <span className="text-white/35 shrink-0 mt-0.5">✓</span>
            {f}
          </li>
        ))}
      </ul>

      <Link
        to={plan.ctaHref}
        className={`inline-flex items-center justify-center h-11 rounded-xl font-semibold text-sm transition-colors ${
          plan.highlight
            ? 'bg-primary text-[hsl(218_62%_7%)] hover:bg-primary/90'
            : 'bg-white/[0.07] border border-white/10 text-white/85 hover:bg-white/[0.1]'
        }`}
      >
        {plan.cta}
      </Link>
    </article>
  );
};
