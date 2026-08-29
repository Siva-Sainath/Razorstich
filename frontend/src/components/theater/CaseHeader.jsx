import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTimeline } from '@/lib/timelineContext';
import { OddsRing } from '@/components/brand/OddsRing';
import { panelVariants } from './Panel';

/** Hero — what's at stake, in one confident glance. */
export const CaseHeader = () => {
  const { caseData, recoveryProb, recovered, clockAt, t, elapsedLabel, restart, dataSource } = useTimeline();
  const c = caseData.case;

  const statusSentence = recovered
    ? 'Recovered — captured via UPI at T+60h with a ₹40 nudge.'
    : 'The DQN agent is working a 72-hour recovery episode — live.';

  return (
    <motion.section
      variants={panelVariants}
      data-testid="case-header"
      className="relative flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-14 pt-6 pb-2"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[rgba(45,212,191,0.9)]">{statusSentence}</p>

        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-white mt-4 leading-[1.05]">
          <span data-testid="case-amount" className="tabular-nums">₹2,499</span>
          <span className="text-white/40"> from </span>
          <span className="text-white/85">{c.customer}</span>
        </h1>

        <p className="text-base text-white/55 mt-4 leading-relaxed max-w-xl">
          <span data-testid="case-merchant" className="text-white/80">{c.merchant}</span>
          <span className="text-white/35"> · </span>
          <span data-testid="case-id">{c.id}</span>
          <span className="text-white/35"> · </span>
          <span className="font-mono text-[13px]">{c.paymentId}</span>
          {dataSource === 'fallback' && <span className="text-warning"> · offline data</span>}
        </p>

        <div className="flex items-center gap-5 mt-5 flex-wrap">
          <span
            data-testid="case-live-status"
            className="inline-flex items-center gap-2 text-[13px] font-medium text-white/70"
          >
            <motion.span
              className={`inline-block w-1.5 h-1.5 rounded-full ${recovered ? 'bg-[rgba(45,212,191,0.85)]' : 'bg-warning/85'}`}
              animate={{ opacity: [0.45, 1, 0.45] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              aria-hidden="true"
            />
            <span className={recovered ? 'text-[rgba(45,212,191,0.9)]' : 'text-white/80'}>
              {recovered ? 'Recovered' : 'Recovering'}
            </span>
          </span>
          <p data-testid="case-clock" className="text-[13px] text-white/55 tabular-nums">
            Case time <span className="font-mono text-white/85">{clockAt(t)}</span>
            <span className="font-mono text-primary ml-2">{elapsedLabel}</span>
          </p>
          <p className="text-[13px] text-white/40">
            Bank declined · code {c.declineCode}
          </p>
        </div>
      </div>

      {/* Odds card — the reference visual */}
      <div className="gradient-border glint-top backdrop-blur-2xl rounded-[24px] p-8 shrink-0 flex flex-col items-center gap-5 shadow-[var(--shadow-2)]">
        <OddsRing prob={recoveryProb} size={190}>
          <div
            data-testid="header-recovery-probability"
            className="text-[44px] font-semibold tracking-[-0.04em] tabular-nums text-white leading-none"
          >
            {Math.round(recoveryProb * 100)}%
          </div>
          <div className="text-[13px] text-white/50 mt-1.5">recovery odds</div>
        </OddsRing>
        <Button
          data-testid="replay-case-btn"
          onClick={restart}
          className="w-full h-9 rounded-[12px] bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white/85 text-[13px] font-medium backdrop-blur-2xl transition-colors duration-150 active:scale-[0.98]"
        >
          Watch the replay
        </Button>
      </div>
    </motion.section>
  );
};
