import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTimeline, API } from '@/lib/timelineContext';
import { Panel, SEV_STYLES } from './Panel';

const MAX_AMBIENT = 40;

const Row = ({ time, severity, text, active = false, testId, typeId, typeLabel }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: -6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
    data-testid={testId}
    className={`flex items-center gap-3 px-2 py-2.5 border-b border-white/[0.06] last:border-b-0 rounded-[6px] ${
      active ? 'bg-white/[0.05]' : ''
    }`}
  >
    <span data-testid={typeId} title={typeLabel} className={`h-1.5 w-1.5 rounded-full shrink-0 ${SEV_STYLES[severity] || SEV_STYLES.info}`} />
    <span className={`text-[13px] leading-relaxed truncate flex-1 ${active ? 'text-white/90' : 'text-white/70'}`}>{text}</span>
    <span className="font-mono text-[11px] text-white/40 shrink-0 tabular-nums">{time}</span>
  </motion.div>
);

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
      title="Live updates"
      subtitle="The payment journey and system activity, as it happens."
      testId="live-event-ticker"
      className={className}
      bodyClassName="flex flex-col"
      right={
        <span
          data-testid="sse-connection-status"
          className="inline-flex items-center gap-2 text-[12px] leading-4 shrink-0 text-white/70"
        >
          <motion.span
            className={`inline-block w-1.5 h-1.5 rounded-full ${connState === 'live' ? 'bg-[rgba(45,212,191,0.85)]' : 'bg-warning/85'}`}
            animate={{ opacity: [0.45, 1, 0.45] }}
            transition={{ repeat: Infinity, duration: 3 }}
            aria-hidden="true"
          />
          {connState === 'live' ? 'Live' : 'Reconnecting'}
        </span>
      }
    >
      <div className="grid md:grid-cols-2 gap-6 flex-1 min-h-0">
          <div className="min-h-0 flex flex-col">
          <p className="text-[12px] leading-4 font-medium text-white/55 mb-2">Payment journey</p>
          <ScrollArea className="h-60 -mx-1 px-1">
            <div>
              <AnimatePresence initial={false}>
                {visibleCase.map((ev) => (
                  <Row
                    key={ev.t}
                    testId="event-row"
                    typeId="event-type"
                    typeLabel={ev.type}
                    time={clockAt(ev.t)}
                    severity={ev.severity}
                    text={ev.label}
                    active={ev.idx === activeEventIndex}
                  />
                ))}
              </AnimatePresence>
              {visibleCase.length === 0 && (
                <p className="text-sm text-white/40 py-4 text-center">Press play to replay the journey.</p>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="min-h-0 flex flex-col md:border-l md:border-white/[0.07] md:pl-6">
          <p className="text-[12px] leading-4 font-medium text-white/55 mb-2">System activity</p>
          <ScrollArea className="h-60 -mx-1 px-1">
            <div>
              <AnimatePresence initial={false}>
                {ambient.map((ev) => (
                  <Row
                    key={ev.id}
                    testId="ambient-event-row"
                    typeLabel={ev.type}
                    time={new Date(ev.ts).toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    severity={ev.severity}
                    text={ev.summary}
                  />
                ))}
              </AnimatePresence>
              {ambient.length === 0 && (
                <p className="text-sm text-white/40 py-4 text-center">
                  {connState === 'live' ? 'Waiting for activity…' : 'Connecting…'}
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </Panel>
  );
};
