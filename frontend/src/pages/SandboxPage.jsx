import React from 'react';
import { Link } from 'react-router-dom';
import { MarketingPageShell, MarketingFooter } from '@/components/landing/MarketingPageShell';
import { PageHero, PageSection } from '@/components/landing/MarketingLayout';
import { RazorpayTestCheckout } from '@/components/razorpay/RazorpayTestCheckout';
import { InstallSnippet } from '@/components/landing/InstallSnippet';

export const SandboxPage = () => (
  <MarketingPageShell>
    <PageHero
      eyebrow="Razorpay Test Mode"
      title="Try payments without live compliance"
      subtitle="Use official Razorpay test cards. Failed payments route to our recovery agent — same flow as production webhooks, zero live money."
    />

    <PageSection className="!pt-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">
        <RazorpayTestCheckout defaultAmount={1499} />

        <aside className="space-y-6">
          <div className="rounded-[20px] surface-1 p-5">
            <h2 className="type-section text-white/90 mb-3">How it works</h2>
            <ol className="space-y-3 type-meta text-white/55 list-decimal list-inside">
              <li>Pick a test card (success or failure)</li>
              <li>Backend simulates <code className="text-white/70">payment.failed</code> or <code className="text-white/70">payment.captured</code></li>
              <li>On failure, DQN policy returns the next recovery action</li>
              <li>Open the wedge demo for the full replay theater</li>
            </ol>
          </div>

          <div className="rounded-[20px] surface-1 p-5">
            <h2 className="type-section text-white/90 mb-2">Production path</h2>
            <p className="type-meta text-white/50 mb-4">
              When you have Razorpay Test Mode keys, point webhooks to your deployed API.
            </p>
            <InstallSnippet variant="webhook" />
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/checkout" className="btn-primary inline-flex h-10 items-center px-5 text-sm">
              Open recovery demo
            </Link>
            <Link to="/integrations" className="btn-quiet inline-flex h-10 items-center px-5 text-sm">
              Integrations
            </Link>
          </div>
        </aside>
      </div>
    </PageSection>

    <MarketingFooter />
  </MarketingPageShell>
);
