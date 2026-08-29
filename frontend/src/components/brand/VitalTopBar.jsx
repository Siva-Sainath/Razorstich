import React from 'react';
import { motion } from 'framer-motion';
import { useTimeline } from '@/lib/timelineContext';
import { LogoMark } from './LogoMark';
import { Wordmark } from './Wordmark';
import { ECGTrace } from './ECGTrace';

const VitalChip = ({ label, value, tone = 'text-white/85', testId }) => (
  <div className="flex flex-col items-end leading-none" data-testid={testId}>
    <span className="font-mono text-[8px] tracking-[0.28em] text-white/40 uppercase mb-[3px]">{label}</span>
    <span className={`font-mono text-[13px] font-semibold ${tone}`}>{value}</span>
  </div>
);

/**
 * Fixed OR-monitor rail: brand lockup left, live ECG center, vitals right.
 */
export const VitalTopBar = () => {
  const { recoveryProb, trustRemaining, elapsedLabel, recovered, clockAt, t } = useTimeline();
  const probTone = recoveryProb >= 0.65 ? 'text-emerald-300' : recoveryProb >= 0.4 ? 'text-amber-300' : 'text-rose-300';
  const trustTone = trustRemaining >= 70 ? 'text-emerald-300' : trustRemaining >= 40 ? 'text-amber-300' : 'text-rose-300';

  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 inset-x-0 z-[120] h-[52px] border-b border-white/[0.08] bg-[hsl(210_25%_4%/0.78)] backdrop-blur-xl"
      data-testid="vital-top-bar"
    >
      <div className="max-w-[1600px] mx-auto h-full px-4 md:px-6 xl:px-8 flex items-center gap-4 md:gap-6">
        <div className="flex items-center gap-3 shrink-0">
          <LogoMark size={28} />
          <Wordmark className="hidden sm:block" />
        </div>

        <div className="h-7 w-px bg-white/10 shrink-0 hidden md:block" aria-hidden="true" />

        {/* live ECG — the heartbeat of the case */}
        <ECGTrace prob={recoveryProb} height={34} className="flex-1 min-w-0 hidden md:block" />

        <div className="h-7 w-px bg-white/10 shrink-0 hidden md:block" aria-hidden="true" />

        <div className="flex items-center gap-4 md:gap-6 shrink-0 ml-auto md:ml-0">
          <VitalChip label="P·Recover" value={`${Math.round(recoveryProb * 100)}%`} tone={probTone} testId="vital-prob" />
          <VitalChip label="Trust" value={trustRemaining} tone={trustTone} testId="vital-trust" />
          <VitalChip label="Elapsed" value={elapsedLabel} tone="text-cyan-300" testId="vital-elapsed" />
          <div className="hidden lg:block">
            <VitalChip label="Clock" value={clockAt(t)} testId="vital-clock" />
          </div>
          <div className="flex items-center gap-1.5" data-testid="vital-status">
            <motion.span
              className={`w-2 h-2 rounded-full ${recovered ? 'bg-emerald-400' : 'bg-amber-400'}`}
              animate={{ opacity: [0.35, 1, 0.35] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
            />
            <span className={`font-mono text-[10px] tracking-[0.2em] ${recovered ? 'text-emerald-300' : 'text-amber-300'}`}>
              {recovered ? 'STABLE' : 'CRITICAL'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
