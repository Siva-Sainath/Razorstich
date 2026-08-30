import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { containerVariants } from '@/components/theater/Panel';
import { StitchLine } from '@/components/brand/StitchLine';
import { CaseHeader } from '@/components/theater/CaseHeader';
import { FailureAnatomy } from '@/components/theater/FailureAnatomy';
import { PolicyBrainStrip } from '@/components/theater/PolicyBrainStrip';
import { InterventionComposer } from '@/components/theater/InterventionComposer';
import { AuditTrailScrubber } from '@/components/theater/AuditTrailScrubber';
import { RecoveryPathsPanel } from '@/components/theater/RecoveryPathsPanel';
import { ConsoleHeader } from '@/components/brand/ConsoleHeader';
import { DemoScenarioBar } from './DemoScenarioBar';
import { CustomerScreenPanel } from './CustomerScreenPanel';
import { RlLiveMetricsPanel } from './RlLiveMetricsPanel';
import { DemoProofStrip } from './DemoProofStrip';
import { SandboxEvalBanner } from './SandboxEvalBanner';
import { useTimeline } from '@/lib/timelineContext';
import { useRecordMode } from '@/lib/recordMode';

export const TheaterStage = ({ scenarioId }) => {
  const recordMode = useRecordMode();
  const {
    togglePlay,
    setPlaying,
    jumpToEvent,
    toggleGhostOverlay,
  } = useTimeline();

  useEffect(() => {
    const onKey = (e) => {
      const target = e.target;
      if (target.closest?.('input, textarea, select, [contenteditable="true"]') || target.tagName === 'BUTTON') return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) togglePlay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setPlaying(false);
        jumpToEvent(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setPlaying(false);
        jumpToEvent(-1);
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        toggleGhostOverlay();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, setPlaying, jumpToEvent, toggleGhostOverlay]);

  return (
    <div className="theater-stage relative" data-testid="theater-stage">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-6 lg:px-8 pt-7 pb-36 flex flex-col gap-6 lg:gap-8"
      >
        {!recordMode && <ConsoleHeader />}
        <DemoScenarioBar scenarioId={scenarioId} compact={recordMode} />
        <SandboxEvalBanner />
        <CaseHeader />
        <StitchLine />

        <div className="grid grid-cols-12 gap-6 lg:gap-8">
          <FailureAnatomy className="col-span-12 lg:col-span-4" />
          <PolicyBrainStrip className="col-span-12 lg:col-span-8" />
        </div>

        <DemoProofStrip />

        <div className="grid grid-cols-12 gap-6 lg:gap-8 items-stretch">
          <RecoveryPathsPanel className="col-span-12 lg:col-span-7" />
          <CustomerScreenPanel scenarioId={scenarioId} className="col-span-12 lg:col-span-5" />
        </div>

        <RlLiveMetricsPanel scenarioId={scenarioId} />

        <InterventionComposer className="col-span-12" />

        <footer className="flex items-center justify-between flex-wrap gap-2 pt-2">
          <p className="text-[13px] text-white/35">
            RazorStitch · RL agent evaluation on held-out validation cases · /research for training log
          </p>
          {!recordMode && (
            <p className="text-[13px] text-white/35 hidden sm:block">
              Space play/pause · ← → moments · G toggle ghost paths
            </p>
          )}
        </footer>
      </motion.div>

      <AuditTrailScrubber />
    </div>
  );
};
