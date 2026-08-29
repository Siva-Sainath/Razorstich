import React from 'react';
import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useTimeline } from '@/lib/timelineContext';
import { Panel } from './Panel';

const NodeDot = ({ status }) => (
  <span className="relative flex h-2.5 w-2.5 shrink-0">
    {status === 'fail' && (
      <motion.span
        className="absolute inline-flex h-full w-full rounded-full bg-destructive/50"
        animate={{ scale: [1, 2], opacity: [0.55, 0] }}
        transition={{ repeat: Infinity, duration: 2.2 }}
      />
    )}
    <span
      className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
        status === 'fail' ? 'bg-destructive' : 'bg-[rgba(45,212,191,0.8)]'
      }`}
    />
  </span>
);

const Stat = ({ label, value, testId, tone = 'text-white/90' }) => (
  <div className="rounded-[16px] bg-white/[0.03] border border-white/[0.07] px-3.5 py-2.5">
    <div className="text-[12px] leading-4 text-white/55">{label}</div>
    <div data-testid={testId} title={String(value)} className={`font-mono text-[13px] font-medium mt-1 tabular-nums truncate ${tone}`}>{value}</div>
  </div>
);

export const FailureAnatomy = ({ className }) => {
  const { caseData, hoursSince, contactsUsed, maxContacts, recovered } = useTimeline();
  const c = caseData.case;
  const hrs = Math.floor(hoursSince);
  const hoursLeft = Math.max(0, c.windowHours - hrs);

  return (
    <Panel
      title="Failure anatomy"
      subtitle="What broke, and what it puts at risk."
      testId="failure-anatomy-panel"
      className={className}
    >
      {/* Case vitals */}
      <div className="grid grid-cols-2 gap-2.5">
        <Stat label="Case" value={c.id} />
        <Stat label="Amount · method" value={`₹2,499 · ${c.method}`} />
        <Stat label="failure_reason" value={c.failureReason} tone="text-destructive" testId="decline-code" />
        <Stat label="error_source" value={c.errorSource} testId="error-source" />
        <Stat label="Hours since failure" value={`${hrs}h of 72h`} testId="hours-since-failure" />
        <Stat label="Contacts used" value={`${contactsUsed} of ${maxContacts}`} testId="contacts-used" tone={contactsUsed >= maxContacts ? 'text-warning' : 'text-white/90'} />
      </div>

      {/* Why revenue is at risk — informative, not alarming */}
      <div data-testid="risk-explainer" className="mt-4 rounded-[16px] border border-white/10 bg-white/[0.03] px-5 py-4 relative overflow-hidden">
        <span className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full bg-destructive/50" aria-hidden="true" />
        <p className="text-[12px] leading-4 font-medium text-white/55 mb-1.5">Why revenue is at risk</p>
        <p className="text-[14px] leading-relaxed text-white/85">
          {recovered
            ? 'This ₹2,499 was recovered before the window closed — the episode ended with a paid order.'
            : `${c.issuer} refused this card (“do not honor”) — usually suspected risk or a low balance. If nothing lands in the next ${hoursLeft}h, the order auto-expires and ₹2,499 is gone.`}
        </p>
      </div>

      {/* Journey stops */}
      <div className="mt-6">
        <p className="text-sm font-medium text-white/60 mb-3.5">Where it stopped</p>
        <div className="relative">
          <div className="absolute left-[4px] top-2 bottom-2 w-px bg-gradient-to-b from-[rgba(45,212,191,0.4)] via-white/10 to-destructive/50" aria-hidden="true" />
          <ul className="space-y-4">
            {caseData.networkPath.map((n) => (
              <li key={n.node} className="flex items-center gap-3.5 relative" data-testid="network-path-node">
                <NodeDot status={n.status} />
                <div className="min-w-0 flex-1 flex items-baseline justify-between gap-3">
                  <span className={`text-[15px] ${n.status === 'fail' ? 'text-destructive' : 'text-white/85'}`}>
                    {n.node}
                  </span>
                  <span className="text-[13px] text-white/40 truncate">{n.meta}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Depth, tucked away */}
      <Accordion type="single" collapsible className="mt-5">
        <AccordionItem value="signals" className="border-white/[0.08]">
          <AccordionTrigger className="text-sm text-white/55 hover:text-white/85 py-3 hover:no-underline font-medium">
            Signals the agent read
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap gap-2 pb-1">
              {caseData.riskSignals.map((s) => (
                <span
                  key={s.k}
                  data-testid="risk-signal-chip"
                  className={`font-mono text-[12px] px-2.5 py-1.5 rounded-lg ${
                    s.tone === 'warn' ? 'bg-warning/10 text-warning' : 'bg-white/[0.05] text-white/60'
                  }`}
                >
                  {s.k} <span className="text-white/90">{s.v}</span>
                </span>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="trace" className="border-white/[0.08]">
          <AccordionTrigger
            data-testid="decline-trace-trigger"
            className="text-sm text-white/55 hover:text-white/85 py-3 hover:no-underline font-medium"
          >
            Technical details
          </AccordionTrigger>
          <AccordionContent>
            <pre className="font-mono text-[11px] leading-relaxed text-white/50 bg-black/25 rounded-xl p-4 overflow-x-auto">
{`event     payment.failed
ts        2025-02-11T21:04:32.118+05:30
resp      05 / DO_NOT_HONOR
source    customer
issuer    HDFC · bin 461786
velocity  issuer_declines_15m: +3.1%
episode   72h · 6h ticks · ≤12 steps`}
            </pre>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Panel>
  );
};
