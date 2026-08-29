import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Handshake } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTimeline } from '@/lib/timelineContext';
import { Panel } from './Panel';

const toneFor = (v) => {
  if (v >= 70) return { stroke: '#34d399', text: 'text-emerald-300' };
  if (v >= 40) return { stroke: '#fbbf24', text: 'text-amber-300' };
  return { stroke: '#fb7185', text: 'text-rose-300' };
};

export const TrustBudget = ({ className }) => {
  const { caseData, trustRemaining, t } = useTimeline();
  const tone = toneFor(trustRemaining);
  const visibleLedger = caseData.trustLedger.filter((e) => e.t <= t);

  return (
    <Panel
      title="Trust Budget"
      icon={Handshake}
      testId="trust-budget"
      index="05"
      className={className}
      right={
        <Badge className="bg-white/[0.06] text-white/60 border border-white/10 font-mono text-[10px]">
          CONTACT GOVERNOR
        </Badge>
      }
    >
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 200 112" className="w-full max-w-[220px]" role="img" aria-label="Remaining customer contact budget">
          <path d="M 26 100 A 74 74 0 0 1 174 100" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" strokeLinecap="round" />
          <motion.path
            d="M 26 100 A 74 74 0 0 1 174 100"
            fill="none"
            stroke={tone.stroke}
            strokeWidth="10"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="100"
            animate={{ strokeDashoffset: 100 - trustRemaining }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ filter: 'drop-shadow(0 0 6px rgba(52,211,153,0.35))' }}
          />
          <text x="100" y="78" textAnchor="middle" fontSize="30" fontFamily="IBM Plex Mono, monospace" fontWeight="600" fill="currentColor" className={tone.text} data-testid="trust-budget-remaining">
            {trustRemaining}
          </text>
          <text x="100" y="96" textAnchor="middle" fontSize="9" fontFamily="IBM Plex Mono, monospace" fill="rgba(255,255,255,0.4)">
            / 100 UNITS LEFT
          </text>
        </svg>

        <div className="w-full mt-2 space-y-1.5" data-testid="trust-ledger">
          <AnimatePresence>
            {visibleLedger.map((e) => (
              <motion.div
                key={e.t}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-1.5"
                data-testid="trust-ledger-row"
              >
                <span className="text-[12px] text-white/65">{e.reason}</span>
                <span className="font-mono text-[12px] text-rose-300">{e.delta}</span>
              </motion.div>
            ))}
          </AnimatePresence>
          {visibleLedger.length === 0 && (
            <p className="font-mono text-[11px] text-white/35 text-center py-1.5">no trust spent yet</p>
          )}
        </div>
      </div>
    </Panel>
  );
};
