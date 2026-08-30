import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StageHeader } from './StageHeader';
import { WedgeLeftPanel } from './WedgeLeftPanel';
import { StageMetricsStack } from './StageMetricsStack';
import { StageCasePicker, StageRail } from './StageRail';
import { WedgeNav } from './WedgeNav';
import { WedgeIntroStrip } from './WedgeIntroStrip';
import { PitchNarrator } from './PitchNarrator';
import { useTimeline } from '@/lib/timelineContext';

export const RecoveryStage = ({ wedge }) => {
  const { caseData, ghostOverlay, pitchMode } = useTimeline();
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    setShowIntro(true);
    const ms = pitchMode ? 5000 : 2500;
    const id = setTimeout(() => setShowIntro(false), ms);
    return () => clearTimeout(id);
  }, [caseData?.case?.id, pitchMode]);

  return (
    <div className="recovery-stage flex-1 min-h-0 flex flex-col relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative flex flex-col flex-1 min-h-0 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 gap-2 sm:gap-3"
      >
        <StageHeader wedge={wedge} />
        <WedgeNav />
        <AnimatePresence>
          {showIntro && <WedgeIntroStrip wedge={wedge} visible={showIntro} />}
        </AnimatePresence>
        <StageCasePicker wedge={wedge} />
        <PitchNarrator wedge={wedge} />

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4">
          <div className="lg:col-span-7 min-h-0 flex flex-col">
            <WedgeLeftPanel wedge={wedge} ghostOverlay={ghostOverlay} />
          </div>
          <div className="lg:col-span-5 min-h-0 flex flex-col max-h-[42vh] lg:max-h-none">
            <StageMetricsStack wedge={wedge} />
          </div>
        </div>

        <StageRail wedge={wedge} />
        {pitchMode ? (
          <p className="type-micro text-center text-white/25 shrink-0 hidden sm:block">
            Space play/pause · ← → steps · Pitch mode auto-pauses · G toggle brain view
          </p>
        ) : (
          <p className="type-micro text-center text-white/25 shrink-0 hidden sm:block">
            Space play/pause · ← → steps · G toggle brain view
          </p>
        )}
      </motion.div>
    </div>
  );
};
