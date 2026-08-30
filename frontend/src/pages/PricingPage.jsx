import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MarketingPageShell } from '@/components/landing/MarketingPageShell';
import { PageHero, PageSection } from '@/components/landing/MarketingLayout';
import { PricingCheckoutPanel } from '@/components/pricing/PricingCheckoutPanel';
import {
  PRICING_PLANS,
  FEATURE_MATRIX,
  VOICE_ADDON,
  CONVERSION_STEPS,
  PROOF_METRICS,
} from '@/config/pricingPlans';
import {
  PricingTierCard,
  FeatureComparisonTable,
  VoiceAddonSection,
} from '@/components/pricing/PricingSections';

const FAQ = [
  {
    q: 'Do I pay if nothing gets recovered?',
    a: 'On Growth, no. The success fee applies only to payments the agent successfully recovers. Sandbox and pre-book use Razorpay Test Mode only.',
  },
  {
    q: 'What is the annual commit discount?',
    a: 'Annual merchants pay 2.0% per recovered payment instead of 2.5% — same product, lower fee for your commitment.',
  },
  {
    q: 'How does the test checkout work?',
    a: 'Enter your email and company, pick Sandbox or Pre-book Growth, then pay with a Razorpay test card on this page. No real money moves — it proves the full payment + recovery flow.',
  },
  {
    q: 'How does phone recovery work?',
    a: 'Optional add-on. When the agent decides a call works better than email or WhatsApp, we place an outbound voice call with a short, tailored script. Billed per minute at pass-through rates.',
  },
  {
    q: 'What happens after I pre-book Growth?',
    a: 'We email Razorpay Test Mode setup steps within 48 hours. Your ₹499 test deposit is recorded in Test Mode — we credit it when you go live.',
  },
];

export const PricingPage = () => {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [checkoutPlan, setCheckoutPlan] = useState('sandbox');
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const tryParam = searchParams.get('try');
    const planParam = searchParams.get('plan');
    if (tryParam === 'sandbox') {
      setCheckoutPlan('sandbox');
      setTimeout(() => {
        document.getElementById('pricing-checkout')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      setSearchParams({}, { replace: true });
    } else if (planParam === 'growth') {
      setCheckoutPlan('growth');
      setTimeout(() => {
        document.getElementById('pricing-checkout')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleCheckoutClick = (planId) => {
    setCheckoutPlan(planId);
    setTimeout(() => {
      document.getElementById('pricing-checkout')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return (
    <MarketingPageShell>
      <PageHero
        compact
        centered
        title="Pay only when money comes back"
        subtitle="Sign up on this page and complete a Razorpay Test checkout — Sandbox ₹1,499 or pre-book Growth for ₹499. No live charges."
      >
        <div className="inline-flex items-center gap-1 mt-6 p-1 rounded-full bg-white/[0.05] border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={`rounded-full px-4 py-1.5 type-micro font-medium transition-all ${
              !annual ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white/65'
            }`}
          >
            Pay per recovery
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={`rounded-full px-4 py-1.5 type-micro font-medium transition-all flex items-center gap-2 ${
              annual ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white/65'
            }`}
          >
            Annual commit
            <span className="type-micro text-primary/90 bg-primary/10 px-1.5 py-0.5 rounded-full">−20%</span>
          </button>
        </div>
        <p className="type-micro text-white/35 mt-4">
          <button
            type="button"
            onClick={() => handleCheckoutClick('sandbox')}
            className="text-primary/80 hover:text-primary"
          >
            Jump to test checkout ↓
          </button>
        </p>
      </PageHero>

      <PageSection className="!pt-8">
        <PricingCheckoutPanel initialPlan={checkoutPlan} />

        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          {PROOF_METRICS.slice(0, 2).map((m) => (
            <div
              key={m.label}
              className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-center min-w-[140px]"
            >
              <p className={`font-mono text-lg font-semibold text-white/90 ${m.mono ? 'tabular-nums' : ''}`}>
                {m.value}
              </p>
              <p className="type-micro text-white/40 mt-0.5">{m.label}</p>
            </div>
          ))}
          <Link
            to="/research"
            className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 type-micro text-primary/80 hover:text-primary flex items-center"
          >
            Full training log →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 mb-14">
          {PRICING_PLANS.map((plan) => (
            <PricingTierCard
              key={plan.id}
              plan={plan}
              annual={annual}
              onCheckoutClick={handleCheckoutClick}
            />
          ))}
        </div>

        <div className="mb-14">
          <VoiceAddonSection addon={VOICE_ADDON} />
        </div>

        <section className="mb-14">
          <h2 className="type-section text-white/90 mb-2">Compare plans</h2>
          <p className="type-meta text-white/45 mb-6">Everything included, at a glance.</p>
          <FeatureComparisonTable rows={FEATURE_MATRIX} />
        </section>

        <section className="mb-14 rounded-[20px] surface-1 p-6 sm:p-8">
          <h2 className="type-section text-white/90 mb-6">Get started in three steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CONVERSION_STEPS.map((step) => (
              <div key={step.step}>
                <p className="font-mono type-micro text-white/35 mb-1">{step.step}</p>
                <h3 className="type-meta font-medium text-white/85">{step.title}</h3>
                <p className="type-micro text-white/50 mt-2 leading-relaxed">{step.detail}</p>
                {step.action === 'sandbox' || step.action === 'growth' ? (
                  <button
                    type="button"
                    onClick={() => handleCheckoutClick(step.action)}
                    className="type-micro text-primary/75 hover:text-primary mt-2"
                  >
                    {step.cta} →
                  </button>
                ) : (
                  <Link to={step.href} className="type-micro text-primary/75 hover:text-primary mt-2 inline-block">
                    {step.cta} →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mb-14 max-w-2xl mx-auto">
          <h2 className="type-section text-white/90 mb-4 text-center">FAQ</h2>
          <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
            {FAQ.map((item, i) => (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  className="w-full flex justify-between items-center py-4 text-left type-body text-white/75 hover:text-white/90"
                >
                  {item.q}
                  <span className="text-white/35 ml-4">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <p className="pb-4 type-meta text-white/50 leading-relaxed">{item.a}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[20px] border border-primary/25 bg-primary/[0.06] p-6 text-center">
          <h2 className="type-section text-white/92">Need a custom quote?</h2>
          <p className="type-meta text-white/50 mt-2 max-w-md mx-auto">
            Enterprise — custom playbooks, private deployment, volume discounts.
          </p>
          <a href="mailto:hello@razorstitch.dev?subject=Enterprise%20pricing" className="btn-primary inline-flex items-center px-6 mt-4">
            Contact sales
          </a>
        </section>
      </PageSection>
    </MarketingPageShell>
  );
};
