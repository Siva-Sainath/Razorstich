import React from 'react';
import { motion } from 'framer-motion';

export const panelVariants = {
  hidden: { opacity: 0, y: 14, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

export const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

export const SEV_STYLES = {
  ok: 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/20',
  info: 'bg-cyan-500/15 text-cyan-200 border border-cyan-400/20',
  warn: 'bg-amber-500/15 text-amber-200 border border-amber-400/20',
  fail: 'bg-rose-500/15 text-rose-200 border border-rose-400/20',
};

export const Panel = ({ title, icon: Icon, right, children, className = '', testId, bodyClassName = '', index }) => (
  <motion.section
    variants={panelVariants}
    data-testid={testId}
    className={`glass-panel corner-notch overflow-hidden flex flex-col ${className}`}
  >
    <div className="panel-ruler" aria-hidden="true" />
    <header className="flex items-center justify-between gap-3 px-5 pt-3.5 shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && <Icon size={14} className="text-cyan-300/80 shrink-0" aria-hidden="true" />}
        <div className="min-w-0">
          {index && <div className="instrument-index mb-[2px]">Instrument {index}</div>}
          <h2 className="label-caps truncate">{title}</h2>
        </div>
      </div>
      {right}
    </header>
    <div className={`px-5 pb-5 pt-3 flex-1 min-h-0 ${bodyClassName}`}>{children}</div>
  </motion.section>
);
