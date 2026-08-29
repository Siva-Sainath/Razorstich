import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RadioTower } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTimeline, API } from '@/lib/timelineContext';
import { Panel, SEV_STYLES } from './Panel';

const MAX_AMBIENT = 40;

export const LiveEventTicker = ({ className }) => {
  const { events, activeEventIndex, t, clockAt } = useTimeline();
  const [ambient, setAmbient] = useState([]);
  const [connState, setConnState] = useState('connecting');
  const esRef = useRef(null);

  useEffect(() => {
    let es;
    let retryTimer;
    const connect = () => {
      es = new EventSource(`${API}/events/stream`);
      esRef.current = es;
      es.onopen = () => setConnState('live');
      es.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          setAmbient((prev) => [data, ...prev].slice(0, MAX_AMBIENT));
        } catch (err) {
          // ignore malformed frames
        }
      };
      es.onerror = () => {
        setConnState('reconnecting');
        es.close();
        retryTimer = setTimeout(connect, 4000);
      };
    };
    connect();
    return () => {
      if (esRef.current) esRef.current.close();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  const visibleCase = events
    .map((ev, i) => ({ ...ev, idx: i }))
    .filter((ev) => ev.t <= t)
    .reverse();

  return (
    <Panel
      title="Live Event Ticker"
      icon={RadioTower}
      testId="live-event-ticker"
      index="07"
      className={className}
      bodyClassName="flex flex-col"
      right={
        <Badge
          data-testid="sse-connection-status"
          className={
            connState === 'live'
              ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/20 font-mono text-[10px]'
              : 'bg-amber-500/15 text-amber-200 border border-amber-400/20 font-mono text-[10px]'
          }
        >
          <motion.span
            className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${connState === 'live' ? 'bg-emerald-300' : 'bg-amber-300'}`}
            animate={{ opacity: [0.35, 1, 0.35] }}
            transition={{ repeat: Infinity, duration: 2.2 }}
          />
          {connState === 'live' ? 'SSE LIVE' : 'RECONNECTING'}
        </Badge>
      }
    >
      <div className="grid md:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Case timeline events (driven by scrubber) */}
        <div className="min-h-0 flex flex-col">
          <div className="label-caps mb-2">Case timeline · unlocked by playhead</div>
          <ScrollArea className="h-56 pr-3">
            <div className="space-y-1.5">
              <AnimatePresence initial={false}>
                {visibleCase.map((ev) => {
                  const isActive = ev.idx === activeEventIndex;
                  return (
                    <motion.div
                      key={ev.t}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      data-testid="event-row"
                      className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 ${
                        isActive
                          ? 'border-cyan-400/30 bg-cyan-500/[0.07]'
                          : 'border-white/[0.06] bg-white/[0.02]'
                      }`}
                    >
                      <span className="font-mono text-[10px] text-white/40 shrink-0 w-[54px]">{clockAt(ev.t)}</span>
                      <Badge data-testid="event-type" className={`font-mono text-[9px] shrink-0 px-1.5 ${SEV_STYLES[ev.severity] || SEV_STYLES.info}`}>
                        {ev.type.toUpperCase()}
                      </Badge>
                      <span className={`text-[12px] truncate ${isActive ? 'text-white/95' : 'text-white/65'}`}>
                        {ev.label}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {visibleCase.length === 0 && (
                <p className="font-mono text-[11px] text-white/35 py-3 text-center">playhead at t=0 · press play</p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Ambient ops stream */}
        <div className="min-h-0 flex flex-col">
          <div className="label-caps mb-2">Ops telemetry · streaming</div>
          <ScrollArea className="h-56 pr-3">
            <div className="space-y-1.5">
              <AnimatePresence initial={false}>
                {ambient.map((ev) => (
                  <motion.div
                    key={ev.id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    data-testid="ambient-event-row"
                    className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                  >
                    <span className="font-mono text-[10px] text-white/40 shrink-0 w-[54px]">
                      {new Date(ev.ts).toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <Badge className={`font-mono text-[9px] shrink-0 px-1.5 ${SEV_STYLES[ev.severity] || SEV_STYLES.info}`}>
                      {ev.type.toUpperCase()}
                    </Badge>
                    <span className="text-[12px] text-white/65 truncate">{ev.summary}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {ambient.length === 0 && (
                <p className="font-mono text-[11px] text-white/35 py-3 text-center">
                  {connState === 'live' ? 'awaiting telemetry…' : 'connecting to stream…'}
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </Panel>
  );
};
