import React from 'react';
import { motion } from 'framer-motion';
import { useTimeline } from '@/lib/timelineContext';
import { GlassCard } from '../GlassCard';
import { inr } from '../stageUtils';

export const EpisodeStateCard = ({ delay = 0 }) => {
  const { caseData, tick, maxSteps, contactsUsed, maxContacts, elapsedLabel } = useTimeline();
  const c = caseData?.case;
  if (!c) return null;

  return (
    <GlassCard
      testId="metric-episode-state"
      title="Episode state"
      subtitle={`Tick ${tick + 1} of ${maxSteps} · seed ${c.scenarioSeed ?? 42}`}
      delay={delay}
    >
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Tick', value: `${tick + 1}/${maxSteps}` },
          { label: 'Sim clock', value: elapsedLabel },
          { label: 'Amount INR', value: inr(c.amount) },
          { label: 'Contacts', value: `${contactsUsed}/${maxContacts}` },
        ].map((cell, i) => (
          <motion.div
            key={cell.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + i * 0.05 }}
            className="surface-inset px-3 py-2.5 rounded-xl"
          >
            <p className="type-micro">{cell.label}</p>
            <p className="type-metric mt-1">{cell.value}</p>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
};

export const FailureNetworkCard = ({ delay = 0 }) => {
  const { caseData } = useTimeline();
  const path = caseData?.networkPath || [];
  if (!path.length) return null;

  return (
    <GlassCard
      testId="metric-failure-network"
      title="Decline path"
      subtitle="Where the payment flow broke"
      delay={delay}
    >
      <div className="space-y-2">
        {path.map((node, i) => (
          <motion.div
            key={node.node}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + i * 0.07 }}
            className="flex items-center gap-3"
          >
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                node.status === 'fail' ? 'bg-destructive/90' : node.status === 'warn' ? 'bg-warning' : 'bg-white/35'
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="type-body text-white/85 truncate">{node.node}</p>
              <p className="type-micro truncate">{node.meta}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
};
