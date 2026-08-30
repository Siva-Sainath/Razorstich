import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useTimeline } from '@/lib/timelineContext';
import { ECGTrace } from '@/components/brand/ECGTrace';

const DOCK_MARKERS = new Set(['failure', 'retry_failed', 'intervention', 'customer_drop', 'captured', 'policy_eval']);

const MARKER_COLOR = {
  fail: 'bg-destructive',
  warn: 'bg-warning',
  ok: 'bg-[rgba(45,212,191,0.95)]',
  info: 'bg-primary/80',
};

export const AuditTrailScrubber = () => {
  const {
    replayProgress,
    setReplayProgress,
    replayWindow,
    playing,
    togglePlay,
    setPlaying,
    events,
    clockAt,
    elapsedLabel,
    jumpToEvent,
    recoveryProb,
    t,
    activeEvent,
  } = useTimeline();
  const { start: replayStart, end: replayEnd } = replayWindow;
  const replaySpan = replayEnd - replayStart || 1;
  const toReplayPos = (episodeT) => ((episodeT - replayStart) / replaySpan) * 100;
  const markers = events.filter(
    (ev) => DOCK_MARKERS.has(ev.type) && ev.t >= replayStart - 0.001 && ev.t <= replayEnd + 0.001
  );
  const eventLabel = activeEvent?.label || 'Episode start';

  return (
    <div
      className="dock-hover-zone fixed inset-x-0 bottom-0 z-[150] flex justify-center px-3 sm:px-5 pb-4 pt-10"
      data-testid="audit-scrubber"
    >
      <motion.div
        initial={{ y: 24 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
        className="dock-shell w-full max-w-[1120px]"
      >
        <div className="dock-glass gradient-border glint-top rounded-[24px] px-4 sm:px-5 py-3.5 flex flex-col gap-2 shadow-[var(--shadow-2)]">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="dock-controls flex items-center gap-1.5 shrink-0">
              <Button
                data-testid="prev-event-btn"
                size="icon"
                variant="ghost"
                onClick={() => jumpToEvent(-1)}
                aria-label="Previous moment"
                className="h-10 w-10 rounded-full text-white/60 hover:text-white hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-ring transition-colors duration-150"
              >
                <SkipBack size={16} />
              </Button>
              <Button
                data-testid="play-pause-btn"
                size="icon"
                onClick={togglePlay}
                aria-label={playing ? 'Pause replay' : 'Play replay'}
                className="h-11 w-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_10px_30px_rgba(43,138,247,0.25)] focus-visible:ring-2 focus-visible:ring-ring transition-colors duration-150 active:scale-[0.96]"
              >
                {playing ? <Pause size={17} /> : <Play size={17} className="ml-0.5" />}
              </Button>
              <Button
                data-testid="next-event-btn"
                size="icon"
                variant="ghost"
                onClick={() => jumpToEvent(1)}
                aria-label="Next moment"
                className="h-10 w-10 rounded-full text-white/60 hover:text-white hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-ring transition-colors duration-150"
              >
                <SkipForward size={16} />
              </Button>
            </div>

            <div className="dock-controls relative flex-1 min-w-0 py-2">
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0 pointer-events-none" aria-hidden="true">
                {markers.map((ev) => (
                  <span
                    key={ev.t}
                    className={`absolute top-1/2 -translate-y-1/2 w-[3px] h-[11px] rounded-full opacity-60 ${MARKER_COLOR[ev.severity] || 'bg-primary/80'}`}
                    style={{ left: `${toReplayPos(ev.t)}%` }}
                    title={ev.label}
                  />
                ))}
              </div>
              <Slider
                data-testid="audit-scrubber-slider"
                value={[Math.round(replayProgress * 1000)]}
                max={1000}
                step={1}
                aria-label="Payment journey timeline"
                onValueChange={(v) => {
                  setPlaying(false);
                  setReplayProgress(v[0] / 1000);
                }}
                className="relative z-10 w-full
                  [&_.relative]:h-1.5 [&_.relative]:bg-white/[0.08]
                  [&_[role=slider]]:h-[14px] [&_[role=slider]]:w-[14px] [&_[role=slider]]:rounded-full [&_[role=slider]]:border-0 [&_[role=slider]]:bg-white [&_[role=slider]]:shadow-[0_0_0_1.5px_rgba(43,138,247,0.45),0_6px_20px_rgba(0,0,0,0.4)]"
              />
            </div>

            <div className="dock-controls hidden sm:flex flex-col items-end gap-1 shrink-0 min-w-[140px] max-w-[220px]">
              <div data-testid="audit-current-timestamp" className="font-mono type-body text-white/90 tabular-nums leading-none">
                {clockAt(t)}
                <span className="text-primary type-meta ml-2">{elapsedLabel}</span>
              </div>
              <p data-testid="scrubber-event-label" className="type-meta text-white/65 truncate w-full text-right" title={eventLabel}>
                {eventLabel}
              </p>
              <ECGTrace prob={recoveryProb} playing={playing} height={12} cells={3} stroke="rgba(255,255,255,0.4)" glow={false} className="w-[80px] hidden lg:block mt-1" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
