import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTimeline } from '@/lib/timelineContext';
import { OddsRing } from '@/components/brand/OddsRing';
import { LogoMark } from '@/components/brand/LogoMark';
import { MetricNumber } from '@/components/kit/MetricNumber';
import { FigureFrame } from '@/components/kit/FigureFrame';
import { RecoveryFlowMap } from '@/components/svg/RecoveryFlowMap';
import { panelVariants } from './Panel';

/** Hero — revenue at stake, recovery story, stitch-path preview. */
export const CaseHeader = () => {
  const {
    caseData,
    recoveryProb,
    recovered,
    clockAt,
    t,
    elapsedLabel,
    restart,
    activeAgent,
    windowHours,
    tickHours,
    replayProgress,
  } = useTimeline();
  const c = caseData.case;
  const amountLabel = `₹${Number(c.amount).toLocaleString('en-IN')}`;

  const statusSentence = recovered
    ? `Recovered — ${amountLabel} captured`
    : `${c.agentName || activeAgent?.name || 'Recovery agent'} is working a ${windowHours}h episode`;

  return (
    <motion.section
      variants={panelVariants}
      data-testid="case-header"
      className="relative grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8 pt-2 pb-1"
    >
      <div className="xl:col-span-8 min-w-0 flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <LogoMark size={24} />
            <span className="type-body font-semibold tracking-tight text-white/90">
              Razor<span className="text-primary">Stitch</span>
            </span>
            <span className="type-micro font-mono text-white/30 ml-1">recovery theater</span>
          </div>
          <p className="type-meta text-accent font-medium">{statusSentence}</p>
          <h1 className="type-hero mt-2">
            <MetricNumber as="span" size="hero" testId="case-amount" className="font-display text-inherit">
              {amountLabel}
            </MetricNumber>
            <span className="text-white/35 font-display font-semibold"> · </span>
            <span className="text-white/88 font-display font-semibold text-[clamp(1.75rem,3.5vw,2.75rem)]">
              {c.customer}
            </span>
          </h1>
          <p className="type-body mt-3 text-white/55">
            <span data-testid="case-merchant" className="text-white/75">{c.merchant}</span>
            <span className="text-white/30 mx-2">·</span>
            <span data-testid="case-id" className="font-mono type-meta tabular-nums">{c.id}</span>
            <span className="text-white/30 mx-2">·</span>
            <span className="text-white/50">{c.failureReason?.replace(/_/g, ' ')}</span>
          </p>
        </div>

        <FigureFrame
          figure="FIG.1"
          caption="Failure → policy → outreach → captured revenue."
          compact
          testId="hero-flow-figure"
        >
          <RecoveryFlowMap progress={replayProgress ?? t} recovered={recovered} height={64} />
        </FigureFrame>

        <div className="flex items-center gap-5 flex-wrap">
          <span data-testid="case-live-status" className="inline-flex items-center gap-2 type-body text-white/75">
            <motion.span
              className={`inline-block w-1.5 h-1.5 rounded-full ${recovered ? 'bg-[rgba(45,212,191,0.85)]' : 'bg-warning/85'}`}
              animate={{ opacity: [0.45, 1, 0.45] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              aria-hidden="true"
            />
            {recovered ? 'Recovered' : 'Recovering'}
          </span>
          <p data-testid="case-clock" className="type-meta font-mono tabular-nums text-white/55">
            {clockAt(t)} · {elapsedLabel} · {tickHours}h ticks
          </p>
        </div>
      </div>

      <div className="xl:col-span-4 gradient-border glint-top backdrop-blur-2xl rounded-[24px] p-6 shrink-0 flex flex-col items-center gap-4 shadow-[var(--shadow-2)]">
        <p className="type-micro self-start w-full">Revenue aperture</p>
        <OddsRing prob={recoveryProb} size={152}>
          <div data-testid="header-recovery-probability">
            <MetricNumber size="lg" className="text-[2.25rem]">
              {Math.round(recoveryProb * 100)}%
            </MetricNumber>
            <p className="type-micro mt-1 text-center">recovery odds</p>
          </div>
        </OddsRing>
        <Button
          data-testid="replay-case-btn"
          onClick={restart}
          className="w-full btn-quiet"
        >
          Replay episode
        </Button>
      </div>
    </motion.section>
  );
};
