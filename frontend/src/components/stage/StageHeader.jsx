import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { useTimeline } from '@/lib/timelineContext';
import { inr, STAGE_MODE_LABEL } from './stageUtils';
import { WEDGE_BY_ID, formatWedgeClock } from '@/config/wedges';

/** Episode context only — brand, nav, and RL proof live in SiteNav / BenchmarkStrip. */
export const StageHeader = ({ wedge }) => {
  const {
    caseData,
    displayAmount,
    stageMode,
    elapsedLabel,
    restart,
    playing,
    hoursSince,
  } = useTimeline();
  const c = caseData?.case;
  if (!c) return null;

  const lane = WEDGE_BY_ID[wedge || c.wedge];
  const isRecovered = displayAmount.label === 'recovered';

  return (
    <header
      className="shrink-0 flex flex-wrap items-center gap-x-4 gap-y-2 py-1 border-b border-white/[0.05] pb-2"
      data-testid="stage-header"
    >
      <div className="flex-1 min-w-[200px]">
        <AnimatePresence mode="wait">
          <motion.p
            key={stageMode}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="type-micro text-primary/90 font-medium"
          >
            {STAGE_MODE_LABEL[stageMode] || 'Recovery episode'}
            {lane?.windowLabel && <span className="text-white/35"> · {lane.windowLabel}</span>}
          </motion.p>
        </AnimatePresence>
        <div className="flex items-baseline gap-3 flex-wrap mt-0.5">
          <span
            className="font-mono text-2xl sm:text-3xl font-semibold tabular-nums text-white/92"
            data-testid="case-amount"
          >
            {isRecovered ? inr(displayAmount.captured) : inr(displayAmount.atRisk)}
          </span>
          <span className="type-meta text-white/50 truncate max-w-md">
            {c.merchant}
            <span className="text-white/25 mx-1.5">·</span>
            {(c.declineReason || c.failureReason)?.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right hidden sm:block px-1">
          <p className="type-micro font-mono text-white/55 tabular-nums">{elapsedLabel}</p>
          <p className="type-micro font-mono text-white/30">{formatWedgeClock(c.wedge, hoursSince)}</p>
        </div>
        <button
          type="button"
          onClick={restart}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-white/10 bg-white/[0.04] type-micro text-white/70 hover:bg-white/[0.07]"
          data-testid="replay-episode-btn"
        >
          <RotateCcw size={14} className={playing ? 'animate-spin' : ''} />
          {playing ? 'Playing' : 'Replay'}
        </button>
      </div>
    </header>
  );
};
