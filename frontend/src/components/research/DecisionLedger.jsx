import React from 'react';
import { motion } from 'framer-motion';
import { TRAINING_PIVOTS } from '@/config/trainingNarrative';

const KIND_STYLES = {
  architecture: 'border-primary/40 bg-primary/10 text-primary',
  algorithm: 'border-violet-400/40 bg-violet-400/10 text-violet-300',
  metric: 'border-teal-400/40 bg-teal-400/10 text-teal-300',
  constraint: 'border-warning/40 bg-warning/10 text-warning',
  training: 'border-white/20 bg-white/5 text-white/70',
  finding: 'border-success/40 bg-success/10 text-success',
  artifact: 'border-white/15 bg-white/[0.04] text-white/60',
  scope: 'border-primary/30 bg-primary/5 text-primary/90',
  planned: 'border-dashed border-white/20 bg-transparent text-white/45',
};

export const DecisionLedger = ({ activeWedge = null, className = '' }) => {
  const rows = TRAINING_PIVOTS.filter(
    (p) => !p.wedges || !activeWedge || p.wedges.includes(activeWedge)
  );

  return (
    <div className={`relative ${className}`} data-testid="decision-ledger">
      <div className="absolute left-[11px] top-3 bottom-3 w-px bg-white/10" aria-hidden="true" />
      <ul className="space-y-0">
        {rows.map((pivot, index) => {
          const style = KIND_STYLES[pivot.kind] || KIND_STYLES.training;
          return (
            <motion.li
              key={pivot.id}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: index * 0.04, duration: 0.35 }}
              className="relative pl-8 pb-8 last:pb-0"
            >
              <span
                className={`absolute left-0 top-1.5 h-[22px] w-[22px] rounded-full border-2 flex items-center justify-center ${
                  pivot.planned ? 'border-dashed border-white/25 bg-transparent' : 'border-primary/50 bg-[hsl(218,62%,7%)]'
                }`}
                aria-hidden="true"
              >
                {!pivot.planned && <span className="h-2 w-2 rounded-full bg-primary/90" />}
              </span>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className={`rounded-full border px-2 py-0.5 type-micro font-mono ${style}`}>
                  {pivot.kind}
                </span>
                <span className="type-micro font-mono text-white/35">{pivot.when}</span>
                {pivot.episode && (
                  <span className="type-micro font-mono text-white/30">ep {pivot.episode.toLocaleString()}</span>
                )}
              </div>
              <h4 className="type-section text-white/90">{pivot.title}</h4>
              <p className="type-body text-white/55 mt-2 leading-relaxed">{pivot.summary}</p>
              <p className="type-meta mt-2 text-white/45 border-l-2 border-white/10 pl-3">
                <span className="text-white/55 font-medium">Outcome · </span>
                {pivot.outcome}
              </p>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
};
