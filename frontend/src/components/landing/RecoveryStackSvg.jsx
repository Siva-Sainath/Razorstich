import React from 'react';
import { motion } from 'framer-motion';

const NODES = [
  { fig: 'FIG.1', label: 'Razorpay', sub: 'payment.failed', icon: '₹' },
  { fig: 'FIG.2', label: 'State encoder', sub: 'scenario router', icon: 'Σ' },
  { fig: 'FIG.3', label: 'Dueling DDQN', sub: 'masked Q-max', icon: 'Q', pulse: true },
  { fig: 'FIG.4', label: 'Recovery', sub: 'link · notify', icon: '✓' },
];

/** Hero pipeline — Razorpay webhook → encoder → Dueling DDQN → recovery action. */
export const RecoveryStackSvg = () => (
  <div
    className="w-full min-w-0"
    aria-label="RazorStitch recovery stack"
    data-testid="recovery-stack-svg"
  >
    <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.02] px-3 py-4 sm:px-5 sm:py-5">
      <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-2">
        <div
          className="pointer-events-none absolute left-5 right-5 top-[54px] hidden border-t border-dashed border-teal-400/35 sm:block"
          aria-hidden="true"
        />

        {NODES.map((node) => (
          <div
            key={node.label}
            className="relative z-[1] flex min-h-[108px] flex-col items-center rounded-[14px] border border-white/[0.12] bg-white/[0.04] px-2 py-3 sm:min-h-[112px] sm:py-4"
          >
            <span className="mb-1 font-mono text-[9px] uppercase tracking-wide text-white/40">
              {node.fig}
            </span>
            <div className="relative flex h-10 w-10 items-center justify-center sm:h-11 sm:w-11">
              {node.pulse && (
                <motion.span
                  className="absolute inset-0 rounded-full border border-primary/30"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.65, 0.35] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              <span className="font-mono text-xl text-primary/95 sm:text-2xl">{node.icon}</span>
            </div>
            <p className="mt-1 text-center text-[11px] font-semibold leading-tight text-white/90 sm:text-xs">
              {node.label}
            </p>
            <p className="mt-0.5 text-center font-mono text-[9px] leading-snug text-white/50">
              {node.sub}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-4 px-1 text-center font-mono text-[10px] leading-relaxed text-white/45">
        episode in seconds · 2.5% only on recovered INR
      </p>
    </div>
  </div>
);
