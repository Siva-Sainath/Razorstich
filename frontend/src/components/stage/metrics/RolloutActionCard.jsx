import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTimeline } from '@/lib/timelineContext';
import { GlassCard } from '../GlassCard';
import { friendlyAction, friendlyUiAction, actionsAreRedundant } from '@/config/consumerCopy';
import { inr } from '../stageUtils';

export const RolloutActionCard = ({ delay = 0 }) => {
  const { currentRolloutStep, caseData, recoveryProb, elapsedLabel } = useTimeline();
  const c = caseData?.case;

  const narrative = useMemo(() => {
    if (!currentRolloutStep || !c) return '';
    const action = friendlyAction(currentRolloutStep.rl_action);
    const hours = Math.round(currentRolloutStep.hours);
    const amount = inr(c.amount);
    const reason = (c.declineReason || c.failureReason || 'payment failure').replace(/_/g, ' ');

    if (currentRolloutStep.recovered) {
      return `Payment recovered at ${elapsedLabel} after ${action.toLowerCase()}.`;
    }

    if (currentRolloutStep.ui_action === 'wait' || currentRolloutStep.rl_action === 'wait') {
      return `At ${elapsedLabel}, the agent waits (${hours}h into the window) — ${reason} on ${amount} needs the right timing.`;
    }

    return `At ${elapsedLabel}, the agent chooses to ${action.toLowerCase()} for this ${amount} ${reason}.`;
  }, [currentRolloutStep, c, elapsedLabel]);

  const channelDetail = useMemo(() => {
    if (!currentRolloutStep) return null;
    if (actionsAreRedundant(currentRolloutStep.rl_action, currentRolloutStep.ui_action)) {
      return null;
    }
    return friendlyUiAction(currentRolloutStep.ui_action);
  }, [currentRolloutStep]);

  if (!currentRolloutStep || !c) return null;

  const probPct = Math.round((currentRolloutStep.belief_p ?? recoveryProb) * 100);

  return (
    <GlassCard
      testId="metric-rollout-action"
      title="Agent decision"
      subtitle={`Step ${currentRolloutStep.step + 1} of rollout`}
      delay={delay}
    >
      <motion.p
        key={narrative}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="type-body text-white/80 leading-relaxed"
      >
        {narrative}
      </motion.p>

      {channelDetail && (
        <p className="type-meta text-white/50 mt-3">
          Customer channel: <span className="text-white/70">{channelDetail}</span>
        </p>
      )}

      <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-white/[0.06]">
        <div>
          <p className="type-micro text-white/40">Recovery odds</p>
          <p className="type-metric text-white/90 tabular-nums">{probPct}%</p>
        </div>
        {currentRolloutStep.contacts > 0 && (
          <div>
            <p className="type-micro text-white/40">Outreach used</p>
            <p className="type-metric text-white/90 tabular-nums">{currentRolloutStep.contacts}</p>
          </div>
        )}
      </div>

      {currentRolloutStep.recovered && (
        <p className="type-meta text-success/90 mt-3 font-medium">Payment captured on this step</p>
      )}
    </GlassCard>
  );
};
