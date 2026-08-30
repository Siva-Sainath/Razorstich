import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AmbientLightField } from '@/components/brand/AmbientLightField';
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
    const ms = pitchMode ? 6000 : 3200;
    const id = setTimeout(() => setShowIntro(false), ms);
    return () => clearTimeout(id);
  }, [caseData?.case?.id, pitchMode]);

  return (
    <div className="recovery-stage h-[100dvh] min-h-[600px] flex flex-col relative overflow-hidden rs-ambient noise-overlay">
      <AmbientLightField />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex flex-col h-full max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 gap-4"
      >
        <StageHeader wedge={wedge} />
        <WedgeNav />
        <AnimatePresence>
          {showIntro && <WedgeIntroStrip wedge={wedge} visible={showIntro} />}
        </AnimatePresence>
        <StageCasePicker wedge={wedge} />
        <PitchNarrator wedge={wedge} />

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          <div className="lg:col-span-7 min-h-0 flex flex-col">
            <WedgeLeftPanel wedge={wedge} ghostOverlay={ghostOverlay} />
          </div>
          <div className="lg:col-span-5 min-h-0 flex flex-col max-h-[48vh] lg:max-h-none">
            <StageMetricsStack wedge={wedge} />
          </div>
        </div>

        <StageRail wedge={wedge} />
        <p className="type-micro text-center text-white/25 shrink-0 hidden sm:block">
          Space play/pause · ← → steps · Pitch mode auto-pauses · G toggle brain view
        </p>
      </motion.div>
    </div>
  );
};
