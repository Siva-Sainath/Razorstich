import React from 'react';
import { motion } from 'framer-motion';

const label = (action) => (action || '…').replace(/_/g, ' ');

export const MilestoneReplayPanel = ({ milestone, compact = false }) => {
  if (!milestone) return <p className="type-body text-white/45 py-2">Loading replay…</p>;

  if (compact) {
    return (
      <div className="rounded-[16px] border border-white/10 surface-inset p-4">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <p className={`type-section ${milestone.recovered ? 'text-success' : 'text-warning'}`}>
            ep {milestone.episode?.toLocaleString()} · {milestone.recovered ? 'Recovered' : 'Open'}
          </p>
          <p className="font-mono type-body text-white/75 tabular-nums">{`₹${Math.round(milestone.net_inr).toLocaleString('en-IN')}`}</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {milestone.steps.slice(0, 6).map((step) => (
            <span key={step.tick} className="rounded-full surface-1 px-3 py-1 type-meta text-white/70">
              {label(step.action)}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_220px] gap-6 items-start">
      <div className="relative pl-6 border-l border-white/10 space-y-0">
        {milestone.steps.map((step, index) => (
          <motion.div
            key={step.tick}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
            className="relative pb-5 last:pb-0"
          >
            <span
              className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 ${
                step.recovered ? 'bg-success border-success/40' : 'bg-primary border-primary/40'
              }`}
              aria-hidden="true"
            />
            <p className="type-section text-white/90">{label(step.action)}</p>
            <p className="type-meta text-white/50 mt-1">Tick {step.tick} · T+{Math.round(step.hours)}h</p>
          </motion.div>
        ))}
      </div>
      <div className="rounded-[16px] border border-white/10 surface-inset p-5">
        <p className="type-meta text-white/45">Checkpoint ep {milestone.episode?.toLocaleString()}</p>
        <p className={`font-display text-3xl mt-2 ${milestone.recovered ? 'text-success' : 'text-warning'}`}>
          {milestone.recovered ? 'Recovered' : 'Open'}
        </p>
        <p className="font-mono type-metric text-white/80 mt-4 tabular-nums">
          ₹{Math.round(milestone.net_inr).toLocaleString('en-IN')} net
        </p>
      </div>
    </div>
  );
};
