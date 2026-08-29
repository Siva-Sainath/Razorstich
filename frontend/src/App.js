import React from 'react';
import '@/App.css';
import { motion } from 'framer-motion';
import { Toaster } from '@/components/ui/sonner';
import { TimelineProvider, useTimeline } from '@/lib/timelineContext';
import { containerVariants } from '@/components/theater/Panel';
import { VitalTopBar } from '@/components/brand/VitalTopBar';
import { SterilizeIntro } from '@/components/brand/SterilizeIntro';
import { CaseHeader } from '@/components/theater/CaseHeader';
import { FailureAnatomy } from '@/components/theater/FailureAnatomy';
import { RecoveryWindow } from '@/components/theater/RecoveryWindow';
import { GhostRuns } from '@/components/theater/GhostRuns';
import { CustomerPlane } from '@/components/theater/CustomerPlane';
import { TrustBudget } from '@/components/theater/TrustBudget';
import { PolicyBrainStrip } from '@/components/theater/PolicyBrainStrip';
import { InterventionComposer } from '@/components/theater/InterventionComposer';
import { LiveEventTicker } from '@/components/theater/LiveEventTicker';
import { AuditTrailScrubber } from '@/components/theater/AuditTrailScrubber';

const LoadingTheater = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4" data-testid="theater-loading">
    <motion.div
      className="w-10 h-10 rounded-full border-2 border-cyan-400/20 border-t-cyan-300"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
    />
    <p className="font-mono text-[12px] text-white/50 tracking-[0.2em] uppercase">Preparing operating theater…</p>
  </div>
);

const Theater = () => {
  const { caseData } = useTimeline();
  if (!caseData) return <LoadingTheater />;

  return (
    <div className="min-h-screen theater-wash noise-overlay scanlines phosphor-sweep relative">
      <SterilizeIntro />
      <VitalTopBar />

      {/* giant watermark type — background layer only */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <span className="bg-watermark absolute -right-8 bottom-28 text-[132px] leading-[0.92] text-right block">
          Resuscitation
        </span>
        <span className="bg-watermark absolute right-10 bottom-16 text-[36px] tracking-[0.3em]">
          Protocol 7F3A
        </span>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 max-w-[1600px] mx-auto px-4 md:px-6 xl:px-8 pt-[72px] md:pt-[76px] pb-32 flex flex-col gap-4 xl:gap-5"
      >
        <CaseHeader />

        <div className="grid grid-cols-12 gap-4 xl:gap-5">
          <FailureAnatomy className="col-span-12 lg:col-span-4" />
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-4 xl:gap-5">
            <RecoveryWindow />
            <GhostRuns />
          </div>
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 xl:gap-5">
            <CustomerPlane />
            <TrustBudget className="flex-1" />
          </div>
        </div>

        <PolicyBrainStrip />

        <div className="grid grid-cols-12 gap-4 xl:gap-5">
          <LiveEventTicker className="col-span-12 lg:col-span-8" />
          <InterventionComposer className="col-span-12 lg:col-span-4" />
        </div>

        <footer className="flex items-center justify-between flex-wrap gap-2 pt-1 pb-2">
          <p className="font-mono text-[10px] text-white/30">
            M.O.T. · MIDNIGHT OPERATING THEATER · RL POLICY v0.9.3 · ALL DATA SIMULATED
          </p>
          <p className="font-mono text-[10px] text-white/30">scrub the timeline — every panel follows</p>
        </footer>
      </motion.div>

      <AuditTrailScrubber />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <TimelineProvider>
        <Theater />
      </TimelineProvider>
      <Toaster position="top-right" theme="dark" />
    </div>
  );
}

export default App;
