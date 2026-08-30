import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimeline } from '@/lib/timelineContext';
import { Panel } from './Panel';
import { friendlyAction } from '@/config/consumerCopy';

export const InterventionComposer = ({ className }) => {
  const { intervention } = useTimeline();
  if (!intervention) return null;
  const actionLabel = friendlyAction(intervention.action);

  return (
    <Panel
      title="Policy decision at this tick"
      subtitle="Masked argmax from the trained Dueling DDQN — simulator log only"
      testId="intervention-composer"
      className={className}
      variant="standard"
      bodyClassName="pt-2"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`${intervention.action}-${intervention.timing}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.25 } }}
          exit={{ opacity: 0 }}
          className="flex flex-col sm:flex-row sm:items-start gap-4"
        >
          <div className="sm:w-[220px] shrink-0">
            <p data-testid="agent-chosen-action" className="type-section text-white leading-snug">
              {actionLabel}
            </p>
            <p className="type-meta mt-1.5">{intervention.timing}</p>
            {intervention.incentive && (
              <p data-testid="intervention-incentive" className="type-micro text-warning mt-1">
                {intervention.incentive}
              </p>
            )}
          </div>
          <div className="surface-inset p-3.5 flex-1 min-w-0">
            <p className="type-micro text-white/45 mb-1">Simulator episode log</p>
            <p data-testid="intervention-message" className="type-body text-white/85 leading-relaxed">
              {intervention.message}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </Panel>
  );
};
