import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MarketingPageShell, MarketingFooter } from '@/components/landing/MarketingPageShell';
import { PageHero, PageSection } from '@/components/landing/MarketingLayout';
import { LeadCaptureForm } from '@/components/landing/LeadCaptureForm';
import {
  PRICING_PLANS,
  FEATURE_MATRIX,
  VOICE_ADDON,
  CONVERSION_STEPS,
} from '@/config/pricingPlans';
import {
  PricingTierCard,
  FeatureComparisonTable,
  VoiceAddonSection,
} from '@/components/pricing/PricingSections';
import { PricingVoiceGuide } from '@/components/pricing/PricingVoiceGuide';

const FAQ = [
  {
    q: 'Do I pay if nothing gets recovered?',
    a: 'On Growth, no. The success fee applies only to payments the agent successfully recovers. Sandbox is free.',
  },
  {
    q: 'What is the annual commit discount?',
    a: 'Annual merchants pay 2.0% per recovered payment instead of 2.5% — same product, lower fee for your commitment.',
  },
  {
    q: 'Can I talk to someone about pricing?',
    a: 'Yes — use the voice guide on this page. It explains every plan in Hindi or English and can point you to the pilot form.',
  },
  {
    q: 'How does phone recovery work?',
    a: 'Optional add-on. When the agent decides a call works better than email or WhatsApp, we place an outbound voice call with a short, tailored script. Billed per minute at pass-through rates.',
  },
  {
    q: 'Can I try before going live?',
    a: 'Yes — try the live demo and connect Razorpay Test Mode first. No card required for Sandbox.',
  },
];

export const PricingPage = () => {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Pricing"
        title="Pay only when money comes back"
        subtitle="Start free in Sandbox. Connect Razorpay for live recovery — or commit annually for a lower success fee."
      >
        <div className="inline-flex items-center gap-1 mt-10 p-1 rounded-full bg-white/[0.05] border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={`rounded-full px-5 py-2 type-meta font-medium transition-all ${
              !annual ? 'bg-white/10 text-white shadow-sm' : 'text-white/45 hover:text-white/65'
            }`}
          >
            Pay per recovery
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={`rounded-full px-5 py-2 type-meta font-medium transition-all flex items-center gap-2 ${
              annual ? 'bg-white/10 text-white shadow-sm' : 'text-white/45 hover:text-white/65'
            }`}
          >
            Annual commit
            <span className="type-micro text-primary/90 bg-primary/10 px-2 py-0.5 rounded-full">−20%</span>
          </button>
        </div>
      </PageHero>

      <PageSection className="!pt-10">
        <PricingVoiceGuide />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 mb-16 lg:mb-20">
          {PRICING_PLANS.map((plan) => (
            <PricingTierCard key={plan.id} plan={plan} annual={annual} />
          ))}
        </div>

        <div className="mb-16 lg:mb-20">
          <VoiceAddonSection addon={VOICE_ADDON} />
        </div>

        <section className="mb-16 lg:mb-20">
          <h2 className="font-display text-2xl font-semibold text-white/92 mb-2">Compare plans</h2>
          <p className="type-meta text-white/45 mb-6">Everything included, at a glance.</p>
          <FeatureComparisonTable rows={FEATURE_MATRIX} />
        </section>

        <section className="mb-16 rounded-[24px] surface-1 p-6 sm:p-10">
          <h2 className="font-display text-xl font-semibold text-white/90 mb-8">Get started in three steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {CONVERSION_STEPS.map((step) => (
              <div key={step.step}>
                <p className="font-mono type-micro text-white/35 mb-2">{step.step}</p>
                <h3 className="type-section text-white/85">{step.title}</h3>
                <p className="type-meta text-white/50 mt-2 leading-relaxed">{step.detail}</p>
                <Link to={step.href} className="type-micro text-primary/75 hover:text-primary mt-3 inline-block">
                  {step.cta} →
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16 max-w-xl mx-auto">
          <LeadCaptureForm plan="growth" headline="Request Growth pilot access" />
        </section>

        <section className="mb-16 max-w-2xl mx-auto">
          <h2 className="font-display text-2xl font-semibold text-white/92 mb-6 text-center">FAQ</h2>
          <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
            {FAQ.map((item, i) => (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  className="w-full flex justify-between items-center py-5 text-left type-body text-white/75 hover:text-white/90 transition-colors"
                >
                  {item.q}
                  <span className="text-white/35 ml-4 text-xl font-light leading-none">
                    {openFaq === i ? '−' : '+'}
                  </span>
                </button>
                {openFaq === i && (
                  <p className="pb-5 type-meta text-white/50 leading-relaxed -mt-1">{item.a}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-primary/25 bg-primary/[0.06] p-8 text-center">
          <h2 className="font-display text-2xl font-semibold text-white/92">Need a custom quote?</h2>
          <p className="type-body text-white/50 mt-3 max-w-md mx-auto">
            Enterprise — custom playbooks, private deployment, volume discounts.
          </p>
          <Link to="/start?plan=enterprise" className="btn-primary inline-flex items-center px-8 mt-6">
            Talk to us
          </Link>
        </section>
      </PageSection>

      <MarketingFooter />
    </MarketingPageShell>
  );
};
