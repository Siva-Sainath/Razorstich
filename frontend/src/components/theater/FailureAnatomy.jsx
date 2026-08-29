import React from 'react';
import { motion } from 'framer-motion';
import { HeartPulse, ShieldAlert, Route } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useTimeline } from '@/lib/timelineContext';
import { Panel } from './Panel';

const NodeDot = ({ status }) => (
  <span className="relative flex h-3 w-3 shrink-0">
    {status === 'fail' && (
      <motion.span
        className="absolute inline-flex h-full w-full rounded-full bg-rose-400/60"
        animate={{ scale: [1, 1.9], opacity: [0.6, 0] }}
        transition={{ repeat: Infinity, duration: 1.8 }}
      />
    )}
    <span
      className={`relative inline-flex rounded-full h-3 w-3 border ${
        status === 'fail'
          ? 'bg-rose-500/70 border-rose-300/60'
          : 'bg-emerald-500/50 border-emerald-300/40'
      }`}
    />
  </span>
);

export const FailureAnatomy = ({ className }) => {
  const { caseData } = useTimeline();
  const c = caseData.case;

  return (
    <Panel
      title="Failure Anatomy"
      icon={HeartPulse}
      testId="failure-anatomy-panel"
      index="01"
      className={className}
      right={
        <Badge className="bg-rose-500/15 text-rose-200 border border-rose-400/20 font-mono text-[10px]">
          TERMINAL DECLINE
        </Badge>
      }
    >
      {/* Decline hero */}
      <div className="rounded-xl border border-rose-400/15 bg-rose-500/[0.06] p-4">
        <div className="label-caps text-rose-200/70">Issuer response</div>
        <div data-testid="decline-code" className="font-mono text-2xl font-semibold text-rose-200 mt-1.5">
          {c.declineCode} — {c.declineReason}
        </div>
        <div className="font-mono text-[12px] text-white/60 mt-1">
          {c.issuer} · via {c.network} · auth attempt #1
        </div>
      </div>

      {/* Network path */}
      <div className="mt-5">
        <div className="label-caps mb-3 flex items-center gap-1.5">
          <Route size={11} aria-hidden="true" /> Authorization path
        </div>
        <div className="relative">
          <div className="absolute left-[5px] top-2 bottom-2 w-px bg-gradient-to-b from-emerald-400/40 via-emerald-400/25 to-rose-400/50" aria-hidden="true" />
          <ul className="space-y-3.5">
            {caseData.networkPath.map((n) => (
              <li key={n.node} className="flex items-center gap-3 relative" data-testid="network-path-node">
                <NodeDot status={n.status} />
                <div className="min-w-0 flex-1 flex items-baseline justify-between gap-2">
                  <span className={`text-[13px] ${n.status === 'fail' ? 'text-rose-200' : 'text-white/85'}`}>
                    {n.node}
                  </span>
                  <span className="font-mono text-[11px] text-white/45 truncate">{n.meta}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Risk signals */}
      <div className="mt-5">
        <div className="label-caps mb-2.5 flex items-center gap-1.5">
          <ShieldAlert size={11} aria-hidden="true" /> Signals read by agent
        </div>
        <div className="flex flex-wrap gap-2">
          {caseData.riskSignals.map((s) => (
            <span
              key={s.k}
              data-testid="risk-signal-chip"
              className={`font-mono text-[11px] px-2.5 py-1 rounded-lg border ${
                s.tone === 'warn'
                  ? 'bg-amber-500/10 text-amber-200/90 border-amber-400/20'
                  : 'bg-white/[0.04] text-white/65 border-white/10'
              }`}
            >
              {s.k} <span className="text-white/90">{s.v}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Expandable detail */}
      <Accordion type="single" collapsible className="mt-4">
        <AccordionItem value="trace" className="border-white/10">
          <AccordionTrigger
            data-testid="decline-trace-trigger"
            className="text-[12px] font-mono text-white/60 hover:text-white/85 py-2.5 hover:no-underline"
          >
            Raw issuer trace
          </AccordionTrigger>
          <AccordionContent>
            <pre className="font-mono text-[10.5px] leading-relaxed text-white/50 bg-black/30 rounded-lg p-3 overflow-x-auto">
{`ts        2025-02-11T21:04:32.118+05:30
rrn       503412887might
arn       74332855042118834556201
resp      05 / DO_NOT_HONOR
issuer    HDFC · bin 461786
velocity  issuer_declines_15m: +3.1%
advice    retry_not_recommended_same_rail`}
            </pre>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Panel>
  );
};
