import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTimeline } from '@/lib/timelineContext';

const MARKER_COLOR = {
  fail: 'bg-rose-400',
  warn: 'bg-amber-400',
  ok: 'bg-emerald-400',
  info: 'bg-cyan-400',
};

export const AuditTrailScrubber = () => {
  const { t, setT, playing, togglePlay, setPlaying, events, clockAt, elapsedLabel, mode, jumpToEvent } = useTimeline();

  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
      className="fixed bottom-0 inset-x-0 z-[150] px-3 md:px-6 pb-3"
      data-testid="audit-scrubber"
    >
      <div className="max-w-[1600px] mx-auto rounded-2xl border border-white/12 bg-black/60 backdrop-blur-2xl shadow-[0_-8px_50px_rgba(0,0,0,0.5),0_0_0_1px_rgba(0,255,200,0.06)] px-4 md:px-5 py-3 flex items-center gap-3 md:gap-5">
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            data-testid="prev-event-btn"
            size="icon"
            variant="ghost"
            onClick={() => jumpToEvent(-1)}
            aria-label="Previous event"
            className="h-9 w-9 rounded-xl text-white/70 hover:text-white hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <SkipBack size={15} />
          </Button>
          <Button
            data-testid="play-pause-btn"
            size="icon"
            onClick={togglePlay}
            aria-label={playing ? 'Pause' : 'Play'}
            className="h-10 w-10 rounded-xl bg-cyan-400/15 hover:bg-cyan-400/25 border border-cyan-400/25 text-cyan-100 focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </Button>
          <Button
            data-testid="next-event-btn"
            size="icon"
            variant="ghost"
            onClick={() => jumpToEvent(1)}
            aria-label="Next event"
            className="h-9 w-9 rounded-xl text-white/70 hover:text-white hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <SkipForward size={15} />
          </Button>
        </div>

        <div className="relative flex-1 min-w-0 py-2">
          {/* event markers */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0 pointer-events-none" aria-hidden="true">
            {events.map((ev) => (
              <span
                key={ev.t}
                className={`absolute top-1/2 -translate-y-1/2 w-[3px] h-3 rounded-full opacity-70 ${MARKER_COLOR[ev.severity] || 'bg-cyan-400'}`}
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
            aria-label="Case timeline scrubber"
            onValueChange={(v) => {
              setPlaying(false);
              setT(v[0] / 1000);
            }}
            className="relative z-10 [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-cyan-300/60 [&_[role=slider]]:bg-[#0a1016] [&_[role=slider]]:shadow-[0_0_10px_rgba(34,211,238,0.5)]"
          />
        </div>

        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <div data-testid="audit-current-timestamp" className="font-mono text-[13px] text-white/85">
            {clockAt(t)}
            <span className="text-cyan-300/80 text-[11px] ml-2">{elapsedLabel}</span>
          </div>
          <Badge className="bg-white/[0.06] text-white/65 border border-white/10 font-mono text-[10px]" data-testid="scrubber-mode">
            {mode}
          </Badge>
        </div>
      </div>
    </motion.div>
  );
};
