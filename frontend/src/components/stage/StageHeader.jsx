import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimeline } from '@/lib/timelineContext';
import { LogoMark } from '@/components/brand/LogoMark';
import { inr, STAGE_MODE_LABEL } from './stageUtils';
import { WEDGE_BY_ID, formatWedgeClock } from '@/config/wedges';

export const StageHeader = ({ wedge }) => {
  const {
    caseData,
    displayAmount,
    stageMode,
    elapsedLabel,
    clockAt,
    t,
    activeAgent,
    restart,
    playing,
    wedgeSummary,
    windowHours,
    hoursSince,
  } = useTimeline();
  const c = caseData?.case;
  if (!c) return null;

  const lane = WEDGE_BY_ID[wedge || c.wedge];
  const isRecovered = displayAmount.label === 'recovered';
  const b = wedgeSummary?.benchmark;
  const lift = b?.acceptance?.mean_improvement_pct;

  return (
    <header className="flex items-center gap-4 sm:gap-6 shrink-0" data-testid="stage-header">
      <div className="flex items-center gap-2.5 shrink-0">
        <LogoMark size={28} />
        <span className="type-body font-semibold text-white/90 hidden sm:inline">
          Razor<span className="text-primary">Stitch</span>
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.p
            key={stageMode}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="type-meta text-accent font-medium"
          >
            {STAGE_MODE_LABEL[stageMode] || 'Recovery episode'}
            {lane?.windowLabel && (
              <span className="text-white/35 font-normal"> · {lane.windowLabel} window</span>
            )}
          </motion.p>
        </AnimatePresence>
        <div className="flex items-baseline gap-2 flex-wrap mt-1">
          <AnimatePresence mode="wait">
            <motion.span
              key={isRecovered ? 'captured' : 'risk'}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`font-display text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tabular-nums ${
                isRecovered ? 'text-success' : lane?.amountHero ? 'text-teal-300' : 'text-white/92'
              }`}
              data-testid="case-amount"
            >
              {isRecovered ? inr(displayAmount.captured) : inr(displayAmount.atRisk)}
            </motion.span>
          </AnimatePresence>
          <span className="text-white/35 font-display text-xl">·</span>
          <span className="font-display text-[clamp(1.25rem,2.5vw,1.75rem)] font-semibold text-white/88 truncate font-mono">
            {c.id}
          </span>
        </div>
        <p className="type-meta mt-1 truncate">
          <span className="text-white/65">{c.merchant}</span>
          <span className="text-white/25 mx-2">·</span>
          <span className="text-white/50">{c.failureReason?.replace(/_/g, ' ')}</span>
          <span className="text-white/25 mx-2">·</span>
          <span>{activeAgent?.short_label || c.wedge?.replace(/_/g, ' ')}</span>
        </p>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <Link
          to="/start"
          className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 type-micro text-primary hover:bg-primary/15 transition-colors hidden sm:inline-flex"
        >
          Get pilot access
        </Link>
        {lift != null && (
          <Link
            to="/research"
            className="rounded-full border border-success/30 bg-success/10 px-3 py-1 type-micro text-success hover:bg-success/15 transition-colors"
            data-testid="research-chip"
          >
            +{lift.toFixed(0)}% vs rules
          </Link>
        )}
        <div className="text-right hidden md:block">
          <p className="type-meta font-mono tabular-nums text-white/55">{elapsedLabel}</p>
          <p className="type-micro font-mono text-white/35 mt-0.5">
            {formatWedgeClock(c.wedge, hoursSince)} · {clockAt(t)}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={restart}
        className="btn-quiet shrink-0 h-9 px-3 text-xs"
        data-testid="replay-episode-btn"
      >
        {playing ? 'Playing…' : 'Replay'}
      </button>
    </header>
  );
};
