import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { InstallSnippet } from './InstallSnippet';
import { STACK_LAYERS } from '@/config/pricingPlans';

function ChannelActionsSvg() {
  return (
    <svg viewBox="0 0 280 160" className="w-full h-auto max-h-[160px]" aria-hidden="true">
      {[
        { x: 24, label: 'SMS', icon: '◉' },
        { x: 88, label: 'WhatsApp', icon: '◉' },
        { x: 168, label: 'Link', icon: '↗' },
        { x: 232, label: 'Retry', icon: '↻' },
      ].map((ch) => (
        <g key={ch.label} transform={`translate(${ch.x}, 40)`}>
          <rect width="56" height="72" rx="10" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" />
          <text x="28" y="36" textAnchor="middle" fill="rgba(43,138,247,0.9)" fontSize="18" fontFamily="IBM Plex Mono">
            {ch.icon}
          </text>
          <text x="28" y="58" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9" fontFamily="Inter">
            {ch.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function PricingSparkSvg() {
  return (
    <svg viewBox="0 0 280 160" className="w-full h-auto max-h-[160px]" aria-hidden="true">
      <text x="140" y="48" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="28" fontWeight="600" fontFamily="IBM Plex Mono">
        2.5%
      </text>
      <text x="140" y="72" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="10" fontFamily="Inter">
        per recovered payment
      </text>
      <polyline
        points="40,120 80,100 120,108 160,85 200,92 240,70"
        fill="none"
        stroke="rgba(45,212,191,0.8)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <text x="140" y="140" textAnchor="middle" fill="rgba(45,212,191,0.7)" fontSize="9" fontFamily="IBM Plex Mono">
        ₹0 until money comes back
      </text>
    </svg>
  );
}

function PolicyMiniSvg() {
  return (
    <svg viewBox="0 0 280 160" className="w-full h-auto max-h-[160px]" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={32 + i * 56}
          y={48 + (3 - i) * 8}
          width={48}
          height={12 + i * 10}
          rx="4"
          fill={`rgba(43,138,247,${0.25 + i * 0.15})`}
        />
      ))}
      <text x="140" y="130" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="9" fontFamily="IBM Plex Mono">
        masked argmax · re-eval each tick
      </text>
    </svg>
  );
}

const VISUALS = {
  'FIG.1': () => <InstallSnippet variant="webhook" />,
  'FIG.2': PolicyMiniSvg,
  'FIG.3': ChannelActionsSvg,
  'FIG.4': PricingSparkSvg,
};

/** Prime Intellect-style FIG-numbered product pillars. */
export const ProductPillarsSection = () => (
  <section className="py-16 sm:py-20 border-t border-white/[0.05]" data-testid="product-pillars">
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-12 max-w-2xl">
        <p className="font-mono type-micro tracking-[0.12em] text-primary uppercase mb-3">The stack</p>
        <h2 className="font-display text-3xl font-semibold text-white/92">
          From Razorpay webhook to recovered revenue
        </h2>
        <p className="type-body text-white/50 mt-3">
          Four layers — ingest, decide, act, pay on success. Same loop in the demo and in production.
        </p>
      </div>

      <div className="flex flex-col gap-16">
        {STACK_LAYERS.map((layer, i) => {
          const Visual = VISUALS[layer.fig] || PolicyMiniSvg;
          const flip = i % 2 === 1;
          return (
            <motion.article
              key={layer.fig}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center ${flip ? 'lg:[direction:rtl]' : ''}`}
            >
              <div className={flip ? 'lg:[direction:ltr]' : ''}>
                <p className="font-mono type-micro text-primary/70">{layer.fig}</p>
                <h3 className="font-display text-2xl font-semibold text-white/90 mt-2">{layer.title}</h3>
                <p className="type-body text-white/50 mt-2">{layer.subtitle}</p>
                <ul className="mt-4 space-y-2">
                  {layer.bullets.map((b) => (
                    <li key={b} className="type-meta text-white/55 flex gap-2">
                      <span className="text-primary shrink-0">·</span>
                      {b}
                    </li>
                  ))}
                </ul>
                {layer.href && (
                  <Link to={layer.href} className="inline-block type-meta text-primary hover:text-primary/80 mt-4">
                    {layer.cta} →
                  </Link>
                )}
              </div>
              <div className={`rounded-[20px] border border-white/[0.08] bg-black/25 p-5 ${flip ? 'lg:[direction:ltr]' : ''}`}>
                <Visual />
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  </section>
);
