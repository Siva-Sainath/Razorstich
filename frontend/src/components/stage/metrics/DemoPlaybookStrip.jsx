import React from 'react';
import { motion } from 'framer-motion';
import { useTimeline } from '@/lib/timelineContext';
import { RECOVERY_BY_ID } from '@/config/recoveryScenarios';
import { WEDGE_PITCH } from '@/config/pitchNarrative';

const STAGE_BEATS = [
  { id: 'failure', label: 'Decline' },
  { id: 'observe', label: 'Observe' },
  { id: 'policy', label: 'Policy' },
  { id: 'intervene', label: 'Nudge' },
  { id: 'outcome', label: 'Captured' },
];

/** Glass playbook loop — scenario mission + current recovery beat. */
export const DemoPlaybookStrip = ({ wedge }) => {
  const { stageMode } = useTimeline();
  const lane = RECOVERY_BY_ID[wedge];
  const pitch = WEDGE_PITCH[wedge];

  if (!pitch) return null;

  return (
    <div
      className="rounded-[20px] border border-white/[0.1] bg-white/[0.04] backdrop-blur-xl p-4 shrink-0"
      data-testid="demo-playbook-strip"
    >
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="type-micro text-primary/80 uppercase tracking-wider">{pitch.agent}</p>
          <p className="type-meta text-white/75 mt-0.5 leading-snug">{pitch.mission}</p>
        </div>
        <span className="type-micro text-white/35 shrink-0">{lane?.windowLabel || pitch.window}</span>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
        {STAGE_BEATS.map((beat) => {
          const active = stageMode === beat.id;
          return (
            <motion.span
              key={beat.id}
              layout
              className={`rounded-full px-2.5 py-1 type-micro whitespace-nowrap border transition-colors ${
                active
                  ? 'border-primary/40 bg-primary/15 text-primary'
                  : 'border-white/10 bg-white/[0.03] text-white/40'
              }`}
            >
              {beat.label}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
};
