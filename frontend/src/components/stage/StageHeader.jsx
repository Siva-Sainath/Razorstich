import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { useTimeline } from '@/lib/timelineContext';
import { inr, STAGE_MODE_LABEL } from './stageUtils';
import { WEDGE_BY_ID, formatWedgeClock } from '@/config/wedges';

/** Episode context only — logo & pilot CTA live in SiteNav. */
export const StageHeader = ({ wedge }) => {
  const {
    caseData,
    displayAmount,
    stageMode,
    elapsedLabel,
    clockAt,
    t,
    restart,
    playing,
    wedgeSummary,
    hoursSince,
  } = useTimeline();
  const c = caseData?.case;
  if (!c) return null;

  const lane = WEDGE_BY_ID[wedge || c.wedge];
  const isRecovered = displayAmount.label === 'recovered';
  const lift = wedgeSummary?.benchmark?.acceptance?.mean_improvement_pct;

  return (
    <header
      className="shrink-0 flex flex-wrap items-center gap-x-4 gap-y-2 py-1"
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
            className={`font-display text-2xl sm:text-3xl font-semibold tabular-nums ${
              isRecovered ? 'text-success' : 'text-white/92'
            }`}
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
        {lift != null && (
          <Link
            to="/research"
            className="rounded-lg border border-success/25 bg-success/10 px-2.5 py-1 type-micro text-success hover:bg-success/15"
            data-testid="research-chip"
          >
            +{lift.toFixed(0)}% vs rules
          </Link>
        )}
        <div className="text-right hidden sm:block px-2">
          <p className="type-micro font-mono text-white/55 tabular-nums">{elapsedLabel}</p>
          <p className="type-micro font-mono text-white/30">
            {formatWedgeClock(c.wedge, hoursSince)}
          </p>
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
