import React from 'react';
import '@/App.css';
import { motion } from 'framer-motion';
import { Toaster } from '@/components/ui/sonner';
import { TimelineProvider, useTimeline } from '@/lib/timelineContext';
import { containerVariants } from '@/components/theater/Panel';
import { ConsoleHeader } from '@/components/brand/ConsoleHeader';
import { SterilizeIntro } from '@/components/brand/SterilizeIntro';
import { AmbientLightField } from '@/components/brand/AmbientLightField';
import { StitchLine } from '@/components/brand/StitchLine';
import { CaseHeader } from '@/components/theater/CaseHeader';
import { FailureAnatomy } from '@/components/theater/FailureAnatomy';
import { RecoveryWindow } from '@/components/theater/RecoveryWindow';
import { GhostRuns } from '@/components/theater/GhostRuns';
import { PolicyBrainStrip } from '@/components/theater/PolicyBrainStrip';
import { CustomerPlane } from '@/components/theater/CustomerPlane';
import { TrustBudget } from '@/components/theater/TrustBudget';
import { InterventionComposer } from '@/components/theater/InterventionComposer';
import { LiveEventTicker } from '@/components/theater/LiveEventTicker';
import { AuditTrailScrubber } from '@/components/theater/AuditTrailScrubber';
import { RecoverySummary } from '@/components/theater/RecoverySummary';
import { CaseQueue } from '@/components/theater/CaseQueue';

const LoadingTheater = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4" data-testid="theater-loading">
    <motion.div
      className="w-10 h-10 rounded-full border-2 border-primary/25 border-t-primary"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
    />
    <p className="text-sm text-white/50">Preparing your recovery view…</p>
  </div>
);

const Theater = () => {
  const { caseData, togglePlay, setPlaying, setT, t } = useTimeline();

  // Keyboard shortcuts: Space play/pause · arrow keys step 6h ticks
  React.useEffect(() => {
    const onKey = (e) => {
      const target = e.target;
      if (
        target.closest?.('input, textarea, select, [contenteditable="true"], [role="slider"]') ||
        target.tagName === 'BUTTON'
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) togglePlay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setPlaying(false);
        setT(Math.min(1, (Math.floor(t * 12 + 1e-6) + 1) / 12));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setPlaying(false);
        setT(Math.max(0, (Math.ceil(t * 12 - 1e-6) - 1) / 12));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, setPlaying, setT, t]);

  if (!caseData) return <LoadingTheater />;

  return (
    <div className="min-h-screen rs-ambient noise-overlay relative overflow-x-hidden">
      <AmbientLightField />
      <SterilizeIntro />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-6 lg:px-8 pt-7 pb-36 flex flex-col gap-6 lg:gap-8"
      >
        {/* Quiet console header — contextual status, no fixed bar */}
        <ConsoleHeader />

        {/* What's at stake */}
        <CaseHeader />

        {/* Signature stitch line — sutures closed as recovery progresses */}
        <StitchLine />

        {/* Recap — appears when the episode closes recovered */}
        <RecoverySummary />

        {/* HERO ROW: Failure anatomy (left) + Policy Brain (center) */}
        <div className="grid grid-cols-12 gap-6 lg:gap-8">
          <FailureAnatomy className="col-span-12 lg:col-span-4" />
          <PolicyBrainStrip className="col-span-12 lg:col-span-8" />
        </div>

        {/* Recovery window + next step */}
        <div className="grid grid-cols-12 gap-6 lg:gap-8">
          <RecoveryWindow className="col-span-12 lg:col-span-7" />
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-6 lg:gap-8">
            <InterventionComposer />
            <TrustBudget />
          </div>
        </div>

        {/* Proof + customer context */}
        <div className="grid grid-cols-12 gap-6 lg:gap-8">
          <GhostRuns className="col-span-12 lg:col-span-7" />
          <CustomerPlane className="col-span-12 lg:col-span-5" />
        </div>

        <div className="grid grid-cols-12 gap-6 lg:gap-8">
          <LiveEventTicker className="col-span-12 lg:col-span-7" />
          <CaseQueue className="col-span-12 lg:col-span-5" />
        </div>

        <footer className="flex items-center justify-between flex-wrap gap-2 pt-2">
          <p className="text-[13px] text-white/35">RazorStitch · 72h recovery episodes · 6h decision ticks · demo, all data simulated</p>
          <p className="text-[13px] text-white/35 font-mono">Space play/pause · ← → step ticks</p>
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
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          classNames: {
            toast: 'rounded-[16px] border border-white/12 bg-[hsl(218_55%_12%/0.92)] backdrop-blur-xl text-white/90 shadow-[var(--shadow-1)]',
            description: 'text-white/60',
          },
        }}
      />
    </div>
  );
}

export default App;
