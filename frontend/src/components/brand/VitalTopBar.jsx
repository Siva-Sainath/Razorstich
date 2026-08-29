import React from 'react';
import { motion } from 'framer-motion';
import { useTimeline } from '@/lib/timelineContext';
import { LogoMark } from './LogoMark';
import { Wordmark } from './Wordmark';
import { ECGTrace } from './ECGTrace';

/** Minimal product rail — brand, live pulse, one status, one number. */
export const VitalTopBar = () => {
  const { recoveryProb, recovered, playing } = useTimeline();
  const statusLabel = recovered ? 'Recovered' : recoveryProb >= 0.55 ? 'On track' : 'At risk';
  const statusTone = recovered ? 'text-[rgba(45,212,191,0.95)]' : recoveryProb >= 0.55 ? 'text-primary' : 'text-warning';
  const statusDot = recovered ? 'bg-[rgba(45,212,191,0.95)]' : recoveryProb >= 0.55 ? 'bg-primary' : 'bg-warning';

  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 inset-x-0 z-[120] h-[60px] border-b border-white/[0.07] bg-[hsl(218_62%_7%/0.75)] backdrop-blur-2xl"
      data-testid="vital-top-bar"
    >
      <div className="max-w-[1320px] mx-auto h-full px-5 sm:px-6 lg:px-8 flex items-center gap-5 md:gap-8">
        <div className="flex items-center gap-3 shrink-0">
          <LogoMark size={30} />
          <Wordmark className="hidden sm:block" />
        </div>

        <ECGTrace prob={recoveryProb} playing={playing} height={32} className="flex-1 min-w-0 hidden md:block" />

        <div className="flex items-center gap-4 md:gap-5 shrink-0 ml-auto md:ml-0">
          <div className="text-right leading-none" data-testid="vital-prob">
            <div className="text-[11px] text-white/45 mb-1">Recovery odds</div>
            <div className="text-[15px] font-semibold tabular-nums text-white">{Math.round(recoveryProb * 100)}%</div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] pl-2.5 pr-3 py-1.5" data-testid="vital-status">
            <motion.span
              className={`w-1.5 h-1.5 rounded-full ${statusDot}`}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
            />
            <span className={`text-[13px] font-medium ${statusTone}`}>{statusLabel}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
