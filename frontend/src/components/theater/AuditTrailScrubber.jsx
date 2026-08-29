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

/** Floating timeline dock — the single instrument that drives the whole page. */
export const AuditTrailScrubber = () => {
  const { t, setT, playing, togglePlay, setPlaying, events, clockAt, elapsedLabel, mode, jumpToEvent, recoveryProb } = useTimeline();
  const markers = events.filter((ev) => DOCK_MARKERS.has(ev.type));

  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[150] w-[min(1120px,calc(100vw-24px))]"
      data-testid="audit-scrubber"
    >
      <div className="gradient-border glint-top backdrop-blur-2xl rounded-[22px] px-4 sm:px-5 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-1px_0_rgba(0,0,0,0.35),0_30px_90px_rgba(0,0,0,0.65)] flex items-center gap-4 sm:gap-6">
        {/* controls */}
        <div className="flex items-center gap-1.5 shrink-0">
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

        {/* scrubber */}
        <div className="relative flex-1 min-w-0 py-2">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0 pointer-events-none" aria-hidden="true">
            {/* 6h tick ruler */}
            {Array.from({ length: 11 }).map((_, i) => (
              <span
                key={`tick-${i}`}
                className="absolute top-1/2 -translate-y-1/2 w-px h-[7px] bg-white/15"
                style={{ left: `${((i + 1) / 12) * 100}%` }}
              />
            ))}
            {markers.map((ev) => (
              <span
                key={ev.t}
                className={`absolute top-1/2 -translate-y-1/2 w-[3px] h-[11px] rounded-full opacity-55 ${MARKER_COLOR[ev.severity] || 'bg-primary/80'}`}
                style={{ left: `${ev.t * 100}%` }}
                title={ev.label}
              />
            ))}
          </div>
          <Slider
            data-testid="audit-scrubber-slider"
            value={[Math.round(t * 1000)]}
            max={1000}
            step={1}
            aria-label="Payment journey timeline"
            onValueChange={(v) => {
              setPlaying(false);
              setT(v[0] / 1000);
            }}
            className="relative z-10
              [&_.relative]:h-1.5 [&_.relative]:bg-white/[0.08]
              [&_[role=slider]]:h-[14px] [&_[role=slider]]:w-[14px] [&_[role=slider]]:rounded-full [&_[role=slider]]:border-0 [&_[role=slider]]:bg-white [&_[role=slider]]:shadow-[0_0_0_1.5px_rgba(43,138,247,0.45),0_6px_20px_rgba(0,0,0,0.4)]"
          />
        </div>

        {/* time + pulse */}
        <div className="hidden sm:flex items-center gap-4 shrink-0">
          <div data-testid="audit-current-timestamp" className="font-mono text-[13px] text-white/90 tabular-nums leading-none">
            {clockAt(t)}
            <span className="text-primary text-[12px] ml-2">{elapsedLabel}</span>
          </div>
          <ECGTrace prob={recoveryProb} playing={playing} height={12} cells={3} stroke="rgba(255,255,255,0.4)" glow={false} className="w-[80px] hidden lg:block" />
          <span data-testid="scrubber-mode" className="text-[11px] text-white/45 font-medium hidden lg:block">{mode}</span>
        </div>
      </div>
    </motion.div>
  );
};
