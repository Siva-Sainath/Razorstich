import React from 'react';
import '@/App.css';
import { motion } from 'framer-motion';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { TimelineProvider, useTimeline } from '@/lib/timelineContext';
import { SterilizeIntro } from '@/components/brand/SterilizeIntro';
import { AppShell } from '@/components/landing/MarketingPageShell';
import { WedgeStageLoader } from '@/components/stage/WedgeStageLoader';
import { ResearchDashboard } from '@/components/research/ResearchDashboard';
import { LandingPage } from '@/pages/LandingPage';
import { PricingPage } from '@/pages/PricingPage';
import { IntegrationsPage } from '@/pages/IntegrationsPage';
import { StartPage } from '@/pages/StartPage';
import { captureAttribution } from '@/lib/gtm';
import { ErrorBoundary } from '@/components/kit/ErrorBoundary';

const DemoChrome = ({ children }) => (
  <AppShell variant="demo" showFooter={false}>
    {children}
  </AppShell>
);

const LoadingTheater = ({ label }) => (
  <div className="h-[100dvh] flex flex-col items-center justify-center gap-4 px-6 text-center" data-testid="theater-loading">
    <motion.div className="w-10 h-10 rounded-full border-2 border-primary/25 border-t-primary animate-spin" />
    <p className="type-body text-white/55">{label || 'Loading recovery episode…'}</p>
  </div>
);

const ErrorTheater = ({ message, onRetry, apiBase }) => (
  <DemoChrome>
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center" data-testid="theater-error">
      <p className="type-section text-white/80">Cannot reach backend.</p>
      <p className="type-body text-warning/90">{message}</p>
      <button type="button" onClick={onRetry} className="btn-primary px-5">
        Retry
      </button>
      <p className="type-micro font-mono">{apiBase}</p>
    </div>
  </DemoChrome>
);

const WedgeShell = ({ wedge }) => {
  const {
    loadError,
    loadInitial,
    apiBase,
    togglePlay,
    setPlaying,
    goToStep,
    currentStepIndex,
    toggleGhostOverlay,
  } = useTimeline();

  React.useEffect(() => {
    const onKey = (e) => {
      const target = e.target;
      if (target.closest?.('input, textarea, select, [contenteditable="true"]') || target.tagName === 'BUTTON') return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) togglePlay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setPlaying(false);
        goToStep(currentStepIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setPlaying(false);
        goToStep(currentStepIndex - 1);
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        toggleGhostOverlay();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, setPlaying, goToStep, currentStepIndex, toggleGhostOverlay]);

  if (loadError) return <ErrorTheater message={loadError} onRetry={loadInitial} apiBase={apiBase} />;

  return <WedgeStageLoader wedge={wedge} />;
};

const WedgeRoute = ({ wedge }) => (
  <TimelineProvider>
    <SterilizeIntro />
    <ErrorBoundary message="Recovery stage crashed. Reload to continue.">
      <DemoChrome>
        <WedgeShell wedge={wedge} />
      </DemoChrome>
    </ErrorBoundary>
  </TimelineProvider>
);

function App() {
  React.useEffect(() => {
    captureAttribution();
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/start" element={<StartPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/checkout" element={<WedgeRoute wedge="checkout_failed" />} />
          <Route path="/cart" element={<WedgeRoute wedge="cart_abandon" />} />
          <Route path="/subscription" element={<WedgeRoute wedge="subscription_failed" />} />
          <Route path="/invoice" element={<WedgeRoute wedge="invoice_overdue" />} />
          <Route path="/research" element={<ResearchDashboard />} />
          <Route path="/learn" element={<Navigate to="/research" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" theme="dark" />
    </div>
  );
}

export default App;
