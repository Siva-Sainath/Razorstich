import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic } from 'lucide-react';
import { useTimeline } from '@/lib/timelineContext';
import { getPitchBeat } from '@/config/pitchNarrative';

/**
 * On-screen script for pitches and demo videos — what to say at each beat.
 */
export const PitchNarrator = ({ wedge }) => {
  const {
    stageMode,
    currentRolloutStep,
    intervention,
    recovered,
    caseData,
    pitchMode,
    playing,
  } = useTimeline();

  const c = caseData?.case;
  if (!c || !pitchMode) return null;

  const beat = getPitchBeat({
    wedge: wedge || c.wedge,
    stageMode,
    currentRolloutStep,
    intervention,
    recovered,
    caseMeta: c,
  });

  return (
    <AnimatePresence mode="wait">
      <motion.section
        key={`${stageMode}-${currentRolloutStep?.step}-${recovered}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="shrink-0 rounded-[20px] border border-primary/20 bg-gradient-to-r from-primary/[0.08] to-transparent px-4 sm:px-5 py-4"
        data-testid="pitch-narrator"
      >
        <div className="flex flex-wrap items-start gap-3 sm:gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 border border-primary/25">
              <Mic className="w-4 h-4 text-primary" aria-hidden />
            </span>
            <div>
              <p className="type-micro text-primary/90 font-medium">Pitch script</p>
              <p className="type-micro text-white/40">{beat.agent}</p>
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h2 className="type-section text-white/90">{beat.title}</h2>
              {beat.stepLabel && (
                <span className="type-micro text-white/40 font-mono">{beat.stepLabel}</span>
              )}
              {!playing && (
                <span className="type-micro text-warning/90 bg-warning/10 border border-warning/20 px-2 py-0.5 rounded-full">
                  Paused — press play when ready
                </span>
              )}
            </div>
            <p className="type-body text-white/75 leading-relaxed">{beat.say}</p>
            <p className="type-meta text-white/45 mt-2 leading-relaxed">{beat.detail}</p>
          </div>
        </div>
      </motion.section>
    </AnimatePresence>
  );
};
