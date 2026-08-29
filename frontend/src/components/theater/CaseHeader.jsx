import React from 'react';
import { motion } from 'framer-motion';
import { Activity, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTimeline } from '@/lib/timelineContext';
import { panelVariants } from './Panel';

const probTone = (p) => {
  if (p >= 0.65) return 'text-emerald-300 text-glow-green';
  if (p >= 0.4) return 'text-amber-300';
  return 'text-rose-300';
};

export const CaseHeader = () => {
  const { caseData, recoveryProb, recovered, mode, elapsedLabel, clockAt, t, restart, dataSource } = useTimeline();
  const c = caseData.case;

  return (
    <motion.header
      variants={panelVariants}
      data-testid="case-header"
      className="glass-panel corner-notch px-5 md:px-7 py-5 flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="label-caps">Case File · Priority P0</span>
          <Badge
            data-testid="case-live-status"
            className={
              recovered
                ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/20'
                : 'bg-amber-500/15 text-amber-200 border border-amber-400/20'
            }
          >
            <motion.span
              className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${recovered ? 'bg-emerald-300' : 'bg-amber-300'}`}
              animate={{ opacity: [0.35, 1, 0.35], scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 2.2 }}
            />
            {recovered ? 'RECOVERED' : 'RECOVERING'}
          </Badge>
          <Badge className="bg-white/5 text-white/70 border border-white/10 font-mono text-[10px]">
            {mode}
          </Badge>
          {dataSource === 'fallback' && (
            <Badge className="bg-rose-500/15 text-rose-200 border border-rose-400/20 font-mono text-[10px]">
              OFFLINE DATA
            </Badge>
          )}
        </div>
        <h1 className="font-display text-3xl md:text-4xl text-white/95 mt-2 tracking-[-0.01em]">
          <span data-testid="case-id">{c.id}</span>
          <span className="text-white/40"> · </span>
          <span data-testid="case-merchant" className="text-white/80">{c.merchant}</span>
        </h1>
        <div className="flex items-center gap-4 flex-wrap mt-2.5 font-mono text-[12px] text-white/60">
          <span data-testid="case-amount" className="text-white/90 text-[14px]">₹2,499.00</span>
          <span>{c.paymentId}</span>
          <span className="hidden sm:inline">{c.method}</span>
          <span className="text-rose-300/90">decline {c.declineCode} · {c.declineReason}</span>
        </div>
      </div>

      <div className="flex items-center gap-6 md:gap-8 shrink-0">
        <div>
          <div className="label-caps mb-1">Case clock</div>
          <div data-testid="case-clock" className="font-mono text-lg md:text-xl text-white/85">
            {clockAt(t)}
            <span className="text-cyan-300/80 text-[12px] ml-2">{elapsedLabel}</span>
          </div>
        </div>
        <div className="h-10 w-px bg-white/10" aria-hidden="true" />
        <div>
          <div className="label-caps mb-1 flex items-center gap-1.5">
            <Activity size={11} aria-hidden="true" /> P(recover)
          </div>
          <div
            data-testid="header-recovery-probability"
            className={`font-mono text-2xl md:text-3xl font-semibold tracking-[-0.02em] ${probTone(recoveryProb)}`}
          >
            {Math.round(recoveryProb * 100)}%
          </div>
        </div>
        <Button
          data-testid="replay-case-btn"
          onClick={restart}
          variant="outline"
          size="sm"
          className="rounded-xl bg-white/5 hover:bg-white/10 border-white/10 text-white/80 focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <RotateCcw size={13} className="mr-1.5" aria-hidden="true" /> Replay
        </Button>
      </div>
    </motion.header>
  );
};
