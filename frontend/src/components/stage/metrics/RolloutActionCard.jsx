import React from 'react';
import { motion } from 'framer-motion';
import { useTimeline } from '@/lib/timelineContext';
import { GlassCard } from '../GlassCard';
import { friendlyAction } from '@/config/consumerCopy';

export const RolloutActionCard = ({ delay = 0 }) => {
  const { currentRolloutStep, caseData } = useTimeline();
  const c = caseData?.case;
  if (!currentRolloutStep) return null;

  return (
    <GlassCard
      testId="metric-rollout-action"
      title="What the agent is doing"
      subtitle={`Step ${currentRolloutStep.step + 1} · ${c?.agentName || 'Recovery agent'}`}
      delay={delay}
    >
      <motion.div
        key={`${currentRolloutStep.step}-${currentRolloutStep.rl_action}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="surface-inset px-3 py-2.5 rounded-xl">
          <p className="type-micro text-white/45">Action</p>
          <p className="type-meta font-medium mt-1 text-white/80">{friendlyAction(currentRolloutStep.rl_action)}</p>
        </div>
        <div className="surface-inset px-3 py-2.5 rounded-xl">
          <p className="type-micro text-white/45">Customer sees</p>
          <p className="type-meta font-medium mt-1 text-white/80">{currentRolloutStep.ui_action}</p>
        </div>
        <div className="surface-inset px-3 py-2.5 rounded-xl">
          <p className="type-micro text-white/45">Time elapsed</p>
          <p className="type-metric mt-1">{Math.round(currentRolloutStep.hours)}h</p>
        </div>
        <div className="surface-inset px-3 py-2.5 rounded-xl">
          <p className="type-micro text-white/45">Messages sent</p>
          <p className="type-metric mt-1">{currentRolloutStep.contacts}</p>
        </div>
      </motion.div>
      {currentRolloutStep.recovered && (
        <p className="type-meta text-success/90 mt-3 font-medium">
          Payment recovered on this step
        </p>
      )}
    </GlassCard>
  );
};
