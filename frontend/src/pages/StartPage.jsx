import { MarketingPageShell, MarketingFooter } from '@/components/landing/MarketingPageShell';

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

import { LeadCaptureForm } from '@/components/landing/LeadCaptureForm';
import { ShareDemoPanel } from '@/components/landing/ShareDemoPanel';
import { PageHero, PageSection } from '@/components/landing/MarketingLayout';
import { captureAttribution } from '@/lib/gtm';
import { PROOF_METRICS } from '@/config/pricingPlans';

export const StartPage = () => {
  useEffect(() => {
    captureAttribution();
  }, []);

  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const plan = params.get('plan') || 'growth';

  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Go to market"
        title="Plug recovery into your Razorpay stack"
        subtitle="We're onboarding a small pilot cohort. You get Test Mode setup, a proof pack for your store, and pay 2.5% only on recovered payments when you go live."
        centered={false}
        className="!pb-8"
      />

      <PageSection className="!pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 items-start">
          <div>
            <ul className="space-y-3 type-meta text-white/55">
              <li className="flex gap-2">
                <span className="text-success">✓</span> 30-min onboarding call within 48h
              </li>
              <li className="flex gap-2">
                <span className="text-success">✓</span> Checkout agent ~61% better than basic retries in our tests
              </li>
              <li className="flex gap-2">
                <span className="text-success">✓</span> Share demo link → priority queue
              </li>
            </ul>

            <div className="grid grid-cols-2 gap-3 mt-8">
              {PROOF_METRICS.slice(0, 2).map((m) => (
                <div key={m.label} className="rounded-xl border border-white/[0.08] surface-1 p-3">
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
        </div>
      </PageSection>

      <MarketingFooter />
    </MarketingPageShell>
  );
};
