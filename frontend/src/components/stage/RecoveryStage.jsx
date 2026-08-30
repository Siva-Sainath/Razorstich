import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { StageHeader } from './StageHeader';
import { WedgeLeftPanel } from './WedgeLeftPanel';
import { StageMetricsStack } from './StageMetricsStack';
import { StageRail } from './StageRail';
import { DemoScenarioBar } from './DemoScenarioBar';
import { PitchNarrator } from './PitchNarrator';
import { useTimeline } from '@/lib/timelineContext';

export const RecoveryStage = ({ wedge }) => {
  const { ghostOverlay, pitchMode } = useTimeline();

  return (
    <div className="recovery-stage flex-1 min-h-0 flex flex-col relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="relative flex flex-col flex-1 min-h-0 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 gap-3"
      >
        <StageHeader wedge={wedge} />
        <DemoScenarioBar wedge={wedge} />
        <PitchNarrator wedge={wedge} />

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4">
          <div className="lg:col-span-7 min-h-[320px] lg:min-h-0 flex flex-col">
            <WedgeLeftPanel wedge={wedge} ghostOverlay={ghostOverlay} />
          </div>
          <div className="lg:col-span-5 min-h-[200px] lg:min-h-0 flex flex-col">
            <p className="type-micro text-white/35 mb-1.5 shrink-0">Agent metrics</p>
            <StageMetricsStack wedge={wedge} />
          </div>
        </div>

        <StageRail wedge={wedge} />
      </motion.div>
    </div>
  );
};
