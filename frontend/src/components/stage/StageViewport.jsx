import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimeline } from '@/lib/timelineContext';
import { StageCustomerView } from './StageCustomerView';
import { StagePolicyView } from './StagePolicyView';

const morph = {
  initial: { opacity: 0, scale: 0.98, filter: 'blur(4px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, scale: 0.98, filter: 'blur(4px)', transition: { duration: 0.22 } },
};

export const StageViewport = () => {
  const { stageMode } = useTimeline();
  const showPolicy = stageMode === 'policy';

  return (
    <div className="stage-viewport relative flex-1 min-h-0 rounded-[24px] border border-white/[0.08] bg-white/[0.02] overflow-hidden" data-testid="stage-viewport">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-primary/[0.04] to-transparent" />
      <AnimatePresence mode="wait">
        {showPolicy ? (
          <motion.div key="policy" className="absolute inset-0 p-4 sm:p-5" {...morph}>
            <StagePolicyView />
          </motion.div>
        ) : (
          <motion.div key="customer" className="absolute inset-0" {...morph}>
            <StageCustomerView />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
