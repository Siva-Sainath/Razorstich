import { MarketingPageShell, MarketingFooter } from '@/components/landing/MarketingPageShell';

import React from 'react';
import { Link } from 'react-router-dom';



import { InstallSnippet } from '@/components/landing/InstallSnippet';
import { PipelineFlowSvg } from '@/components/landing/PipelineFlowSvg';
import { VoiceAddonSection } from '@/components/pricing/PricingSections';
import { VOICE_ADDON } from '@/config/pricingPlans';

const STEPS = [
  {
    step: '1',
    title: 'Add your Razorpay webhook',
    detail: 'Point payment.failed, subscription.charged, and invoice.paid events to our ingress. Test Mode first — no live money.',
    code: `https://your-app.com/api/webhooks/razorpay
# or use RazorStitch hosted:
https://api.razorstitch.dev/hooks/razorpay`,
  },
  {
    step: '2',
    title: 'Policy recommend on every failure',
    detail: 'We analyze the failure context, run our recovery agent to determine the optimal next step, and return the recommended action.',
    code: `POST /api/policy/recommend
{ "wedge": "checkout_failed", "amount_inr": 1499, ... }`,
  },
  {
    step: '3',
    title: 'Execute recovery action',
    detail: 'Map agent action to Razorpay payment link, partial offer, method update, or notify — with audit trail.',
    code: `POST /api/recovery/execute
{ "case_id": "...", "action": "create_payment_link" }`,
  },
];

export const IntegrationsPage = () => (
  <MarketingPageShell>

    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <header className="mb-12">
        <p className="font-mono type-micro tracking-[0.12em] text-accent uppercase">Integrations</p>
        <h1 className="font-display text-[clamp(2rem,5vw,3rem)] font-semibold mt-3 text-white/95 leading-tight">
          Drop the recovery agent into your payment pipeline
        </h1>
        <p className="type-body text-white/50 mt-4 max-w-xl leading-relaxed">
          Same stack that trains in the simulator serves through Razorpay webhooks. Zero PyTorch at runtime —
          exported JSON weights, TypeScript inference, Python or Node ingress.
        </p>
      </header>

      <div className="rounded-[24px] border border-white/[0.08] bg-black/25 p-6 sm:p-8 mb-12">
        <p className="font-mono type-micro text-white/40 mb-4">FIG.1 — Request flow</p>
        <PipelineFlowSvg />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div>
          <h2 className="type-section text-white/88 mb-3">Quick start</h2>
          <p className="type-meta text-white/45 mb-4">
            Prime Intellect-style one-liner — install CLI, connect keys, first recommend call.
          </p>
          <InstallSnippet variant="install" />
          <div className="mt-4">
            <InstallSnippet variant="policy" />
          </div>
        </div>
        <div className="space-y-5">
          {STEPS.map((s) => (
            <div key={s.step} className="rounded-[16px] border border-white/[0.08] p-5">
              <p className="font-mono type-micro text-primary mb-1">{s.step}</p>
              <h3 className="type-section text-white/85">{s.title}</h3>
              <p className="type-meta text-white/50 mt-2 leading-relaxed">{s.detail}</p>
              <pre className="mt-3 type-micro font-mono text-white/45 bg-black/40 rounded-lg p-3 overflow-x-auto">
                {s.code}
              </pre>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-12">
        <VoiceAddonSection addon={VOICE_ADDON} />
      </div>

      <section className="rounded-[20px] border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold text-white/90">Validation before deploy</h2>
        <p className="type-body text-white/50 mt-3 leading-relaxed">
          Every wedge run passes a 10-seed benchmark gate. If v2 regresses vs v1, weights auto-restore.
          checkout_failed v2 shipped (+61% vs rules, 10/10 seeds). Demo shows the same acceptance card live.
        </p>
        <ul className="mt-4 space-y-2 type-meta text-white/55">
          <li>→ 10 seeds × 200 rollout episodes per wedge</li>
          <li>→ Mean net INR vs failure-rules + 95% CI</li>
          <li>→ Inference parity check (JSON ↔ TypeScript mirror)</li>
          <li>→ Regression auto-restore to eval/baselines/v1/</li>
        </ul>
        <div className="flex flex-wrap gap-3 mt-6">
          <Link to="/checkout" className="btn-primary inline-flex items-center px-6">
            Try live demo
          </Link>
          <Link to="/research" className="btn-quiet inline-flex items-center px-6">
            Training proof
          </Link>
          <Link to="/pricing" className="btn-quiet inline-flex items-center px-6">
            Pricing
          </Link>
        </div>
      </section>
    </div>

    <MarketingFooter />
  </MarketingPageShell>
);
