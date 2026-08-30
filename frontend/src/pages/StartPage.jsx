import { MarketingPageShell, MarketingFooter } from '@/components/landing/MarketingPageShell';

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';


import { LeadCaptureForm } from '@/components/landing/LeadCaptureForm';
import { ShareDemoPanel } from '@/components/landing/ShareDemoPanel';
import { captureAttribution } from '@/lib/gtm';
import { PROOF_METRICS } from '@/config/pricingPlans';

export const StartPage = () => {
  useEffect(() => {
    captureAttribution();
  }, []);

  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const plan = params.get('plan') || 'growth';

  return (
    <MarketingPageShell navTransparent={false}>

      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 items-start">
          <div>
            <p className="font-mono type-micro tracking-[0.12em] text-accent uppercase">Go to market</p>
            <h1 className="font-display text-[clamp(2rem,5vw,2.75rem)] font-semibold mt-3 text-white/95 leading-tight">
              Plug recovery into your Razorpay stack
            </h1>
            <p className="type-body text-white/50 mt-4 leading-relaxed">
              We&apos;re onboarding a small pilot cohort. You get Test Mode setup, a proof pack for your store,
              and pay <strong className="text-white/75">2.5% only on recovered payments</strong> when you go live.
            </p>

            <ul className="mt-6 space-y-3 type-meta text-white/55">
              <li className="flex gap-2"><span className="text-success">✓</span> 30-min onboarding call within 48h</li>
              <li className="flex gap-2"><span className="text-success">✓</span> Checkout agent ~61% better than basic retries in our tests</li>
              <li className="flex gap-2"><span className="text-success">✓</span> Share demo link → priority queue</li>
            </ul>

            <div className="grid grid-cols-2 gap-3 mt-8">
              {PROOF_METRICS.slice(0, 2).map((m) => (
                <div key={m.label} className="rounded-xl border border-white/[0.08] p-3">
                  <p className="type-micro text-white/40">{m.label}</p>
                  <p className="font-mono type-metric text-primary mt-1">{m.value}</p>
                </div>
              ))}
            </div>

            <Link to="/checkout" className="inline-block type-meta text-primary/80 hover:text-primary mt-6">
              Or skip the form and try the demo first →
            </Link>
          </div>

          <div className="space-y-5">
            <LeadCaptureForm plan={plan} variant="hero" />
            <ShareDemoPanel />
          </div>
        </div>s*</div>s*<MarketingFooter />
    </MarketingPageShell>
  );
};
