import React from 'react';
import { motion } from 'framer-motion';
import { useTimeline } from '@/lib/timelineContext';
import { Panel, panelVariants, StatusDot } from './Panel';

export const AgentsStrip = ({ className }) => {
  const { agents, activeAgent, caseData } = useTimeline();
  const activeId = caseData?.case?.wedge;

  if (!agents?.length) return null;

  return (
    <motion.div variants={panelVariants} className={className}>
      <Panel
        title="Recovery agents"
        subtitle="Four trained Dueling DDQN policies — one per failure wedge."
        testId="agents-strip"
        bodyClassName="pt-1"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {agents.map((agent) => {
            const active = agent.id === activeId;
            return (
              <div
                key={agent.id}
                data-testid={active ? 'agent-card-active' : 'agent-card'}
                className={`rounded-[16px] border px-4 py-3.5 transition-colors ${
                  active
                    ? 'border-primary/35 bg-primary/[0.08]'
                    : 'border-white/[0.08] bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`type-meta font-semibold ${active ? 'text-primary' : 'text-white/85'}`}>
                    {agent.short_label}
                  </span>
                  {active && <StatusDot tone="bg-primary/80">on this case</StatusDot>}
                </div>
                <p className="type-meta text-white/55 mt-1">{agent.name}</p>
                <p className="font-mono type-micro text-white/40 mt-2 tabular-nums">
                  {agent.window_hours}h · {agent.tick_hours}h ticks · {agent.max_steps} steps
                </p>
                <p className="font-mono type-micro text-white/35 mt-1 truncate" title={agent.policy_version}>
                  {agent.policy_version || 'weights pending'}
                </p>
              </div>
            );
          })}
        </div>
        {activeAgent && (
          <p className="type-meta text-white/45 mt-4">
            Active on this case: <span className="text-white/75">{activeAgent.name}</span>
            {caseData?.case?.failureReason && (
              <span className="text-white/40"> · routing on {caseData.case.failureReason.replace(/_/g, ' ')}</span>
            )}
          </p>
        )}
      </Panel>
    </motion.div>
  );
};
