import { MarketingPageShell } from '@/components/landing/MarketingPageShell';

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

import { HeroBeams } from '@/components/brand/HeroBeams';


import { InstallSnippet } from '@/components/landing/InstallSnippet';
import { PipelineFlowSvg } from '@/components/landing/PipelineFlowSvg';
import { LeadCaptureForm } from '@/components/landing/LeadCaptureForm';
import { ShareDemoPanel } from '@/components/landing/ShareDemoPanel';

import { InteractiveTrainingWalkthrough } from '@/components/research/InteractiveTrainingWalkthrough';
import { STACK_LAYERS, PROOF_METRICS, CONVERSION_STEPS } from '@/config/pricingPlans';
import { WEDGE_LANES } from '@/config/wedges';
import { API } from '@/lib/timelineContext';

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

      {/* Hero — conversion-first */}
      <section className="relative overflow-hidden pt-10 sm:pt-16 pb-16 sm:pb-24 lg:pb-32">
        <HeroBeams />
        <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,400px)] gap-10 items-start">
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
        <div className="flex flex-wrap gap-3 mt-8">
                <Link to="/start" className="btn-primary inline-flex items-center px-6">
                  Request pilot access
                </Link>
                <Link to="/pricing?try=sandbox" className="btn-quiet inline-flex items-center px-6">
                  Razorpay test checkout
                </Link>
                <Link to="/checkout" className="btn-quiet inline-flex items-center px-6">
                  Try live demo
                </Link>
              </div>
              <p className="type-micro text-white/30 mt-4 font-mono">
                Checkout recovery ~61% better than basic retry rules in our tests
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <LeadCaptureForm compact plan="pilot" showShareOnSuccess={false} />
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

      {/* Viral loop */}
      <section className="py-12 border-t border-white/[0.05] bg-black/20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <ShareDemoPanel />
        </div>
      </section>

      {/* Stack — shortened for GTM */}
      <section className="py-16 sm:py-20 border-t border-white/[0.05]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <h2 className="font-display text-3xl font-semibold text-white/92">
              What you get in the pilot
            </h2>
            <p className="type-body text-white/50 mt-3">
              Not a slide deck — a working agent on your Razorpay Test Mode webhooks.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {STACK_LAYERS.map((layer, i) => (
              <article key={layer.num} className="rounded-[20px] surface-1 p-6">
                <span className="font-mono type-micro text-primary/70">{layer.fig}</span>
                <h3 className="font-display text-lg font-semibold text-white/90 mt-2">{layer.title}</h3>
                <p className="type-meta text-white/45 mt-1">{layer.subtitle}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Training proof — credibility for technical buyers */}
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

      {/* Wedges */}
      <section className="py-16 border-t border-white/[0.05]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-semibold text-white/92 mb-6">Four failure modes, four agents</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {WEDGE_LANES.map((lane) => (
              <Link key={lane.wedge} to={lane.path} className="rounded-[16px] surface-1 p-4 panel-hover-lift block">
                <h3 className="type-section text-white/85">{lane.short}</h3>
                <p className="type-micro text-white/40 mt-1">{lane.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* GTM funnel */}
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
            <h2 className="font-display text-2xl font-semibold text-white/92">Ready to recover revenue?</h2>
            <p className="type-body text-white/50 mt-2 max-w-md mx-auto">
              Join the pilot. Share the demo. Pay 2.5% only when we recover.
            </p>
            <Link to="/start" className="btn-primary inline-flex items-center px-8 mt-6">
              Request pilot access
            </Link>
          </div>
        </div>
      </section>

    </MarketingPageShell>
  );
};
