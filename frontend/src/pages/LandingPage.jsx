import { MarketingPageShell } from '@/components/landing/MarketingPageShell';

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

import { HeroBeams } from '@/components/brand/HeroBeams';
import { RecoveryStackSvg } from '@/components/landing/RecoveryStackSvg';
import { ProductPillarsSection } from '@/components/landing/ProductPillarsSection';
import { LeadCaptureForm } from '@/components/landing/LeadCaptureForm';
import { ShareDemoPanel } from '@/components/landing/ShareDemoPanel';

import { InteractiveTrainingWalkthrough } from '@/components/research/InteractiveTrainingWalkthrough';
import { PROOF_METRICS, CONVERSION_STEPS } from '@/config/pricingPlans';
import { RECOVERY_LANES } from '@/config/recoveryScenarios';
import { API } from '@/lib/timelineContext';

const LANE_LIFT = {
  checkout_failed: '+61%',
  cart_abandon: '+48%',
  subscription_failed: '+35%',
  invoice_overdue: '+52%',
};

export const LandingPage = () => {
  const [catalog, setCatalog] = useState(null);
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    axios
      .get(`${API}/wedges/catalog`, { timeout: 120000 })
      .then((r) => {
        setCatalog(r.data.wedges);
        setMeta(r.data.meta || null);
      })
      .catch(() => {});
  }, []);

  return (
    <MarketingPageShell showStickyLeadBar={true}>

      <section className="relative overflow-hidden pt-10 sm:pt-16 pb-16 sm:pb-24 lg:pb-28">
        <HeroBeams />
        <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="font-mono type-micro tracking-[0.14em] text-accent uppercase mb-4">
                Payment recovery for Razorpay merchants
              </p>
              <h1 className="font-display text-[clamp(2.25rem,6vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-white/95">
                Recover failed payments.
                <span className="block text-white/55 mt-1">Pay only when money comes back.</span>
              </h1>
              <p className="type-body text-white/55 mt-6 max-w-xl leading-relaxed">
                AI agents that learn when to nudge — not blast. Plug into your Razorpay webhooks.
                Pay 2.5% only on payments you actually recover.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-8">
                <Link to="/checkout" className="btn-primary inline-flex items-center px-7 h-11">
                  Try live demo
                </Link>
                <Link to="/pricing?try=sandbox" className="btn-quiet inline-flex items-center px-6 h-11">
                  Pre-book with test card
                </Link>
              </div>
              <p className="type-micro text-white/30 mt-6 font-mono">
                Checkout recovery ~61% better than basic retry rules in our tests
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="rounded-[24px] border border-white/[0.08] bg-black/25 p-4 sm:p-6"
            >
              <RecoveryStackSvg />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-14"
          >
            {PROOF_METRICS.map((m) => (
              <div key={m.label} className="rounded-[16px] surface-1 panel-hover-lift p-4">
                <p className="type-micro text-white/40 mb-1">{m.label}</p>
                <p className={`${m.mono ? 'font-mono type-metric' : 'font-display text-2xl font-semibold'} text-white/90`}>
                  {m.value}
                </p>
                <p className="type-micro text-white/35 mt-1">{m.sub}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <ProductPillarsSection />

      <section className="py-12 border-t border-white/[0.05] bg-black/20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <ShareDemoPanel />
        </div>
      </section>

      <section className="py-16 sm:py-20 border-t border-white/[0.05] bg-black/20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          {catalog ? (
            <InteractiveTrainingWalkthrough catalog={catalog} meta={meta} />
          ) : (
            <div className="rounded-[24px] border border-white/[0.08] p-12 text-center type-body text-white/40">
              Loading training proof…
            </div>
          )}
        </div>
      </section>

      <section className="py-16 border-t border-white/[0.05]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-semibold text-white/92 mb-2">Four failure modes, four agents</h2>
          <p className="type-body text-white/45 mb-6 max-w-xl">
            Each scenario has its own trained policy — open a demo and scrub through a real validation case.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {RECOVERY_LANES.map((lane) => (
              <Link
                key={lane.id}
                to={lane.path}
                className="group rounded-[18px] surface-1 p-5 panel-hover-lift block border border-transparent hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="type-section text-white/88 group-hover:text-white">{lane.short}</h3>
                  <span className="font-mono type-micro text-primary bg-primary/10 border border-primary/25 rounded-full px-2 py-0.5">
                    {LANE_LIFT[lane.id] || 'RL'}
                  </span>
                </div>
                <p className="type-micro text-white/40">{lane.description}</p>
                <p className="type-meta text-primary/80 mt-4 group-hover:text-primary">Open demo →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="waitlist" className="py-16 border-t border-white/[0.05] scroll-mt-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div>
              <p className="font-mono type-micro tracking-[0.12em] text-accent uppercase mb-3">Early access</p>
              <h2 className="font-display text-2xl font-semibold text-white/92">Join the waitlist</h2>
              <p className="type-body text-white/50 mt-3 max-w-md">
                We onboard Razorpay merchants in weekly batches. Try the demo first — then leave your email if you want Test Mode wired up.
              </p>
            </div>
            <LeadCaptureForm
              compact
              plan="pilot"
              headline="Join the waitlist"
              subhead="Tell us your failed-payment volume. We reply within 48h with setup steps."
              showShareOnSuccess={false}
              submitLabel="Join waitlist"
            />
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-white/[0.05]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {CONVERSION_STEPS.map((step) => (
              <div key={step.step} className="rounded-[18px] border border-white/[0.08] p-5">
                <p className="font-mono type-micro text-primary">{step.step}</p>
                <h3 className="type-section text-white/88 mt-2">{step.title}</h3>
                <p className="type-meta text-white/50 mt-2">{step.detail}</p>
              </div>
            ))}
          </div>
          <div className="rounded-[24px] border border-primary/25 bg-primary/[0.06] p-8 text-center">
            <h2 className="font-display text-2xl font-semibold text-white/92">See the agent decide — then go live</h2>
            <p className="type-body text-white/50 mt-2 max-w-md mx-auto">
              Walk the demo, read the training log, pre-book Growth when you are ready.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <Link to="/research" className="btn-quiet inline-flex items-center px-6">
                See how it trains
              </Link>
              <Link to="/pricing" className="btn-primary inline-flex items-center px-7">
                Pre-book Growth
              </Link>
            </div>
          </div>
        </div>
      </section>

    </MarketingPageShell>
  );
};
