import React from 'react';
import { useTimeline } from '@/lib/timelineContext';
import { PolicyBrainScene } from '@/components/svg/PolicyBrainViz';
import { POLICY_NODES } from '@/components/brain/policyBrainNodes';

const STAGE_LABELS = ['observe', 'encode', 'guard', 'dqn', 'select', 'act'];

export const StageBrainPanel = ({ wedge, ghostOverlay = false }) => {
  const {
    brainPipelineStep,
    brainThinking,
    brainGuardrailActive,
    brainSelectedAction,
    activeAgent,
    caseData,
  } = useTimeline();

  const c = caseData?.case;
  const stageLabel = STAGE_LABELS[Math.min(brainPipelineStep, 5)] || 'observe';
  const nodeLabel = POLICY_NODES[Math.min(brainPipelineStep, POLICY_NODES.length - 1)]?.label;

  return (
    <div className="flex flex-col h-full min-h-0 gap-3" data-testid="stage-brain-panel">
      <div className="flex items-center justify-between gap-2 shrink-0 px-1">
        <div>
          <p className="type-micro text-white/45">
            Policy cortex · exported DQN weights
            {ghostOverlay && <span className="text-teal-300"> · ghost overlay</span>}
          </p>
          <p className="type-section text-white/88">{activeAgent?.name || c?.agentName}</p>
        </div>
        <div className="text-right">
          <p className="type-micro font-mono text-primary">{stageLabel}</p>
          <p className="type-micro text-white/35">{nodeLabel}</p>
        </div>
      </div>

      <div className="flex-1 min-h-[220px] lg:min-h-[280px] rounded-[24px] border border-white/[0.08] overflow-hidden glass-card backdrop-blur-xl">
        <PolicyBrainScene
          pipelineStep={brainPipelineStep}
          thinking={brainThinking}
          guardrailActive={brainGuardrailActive}
          selectedAction={brainSelectedAction}
          className="!rounded-none !border-0 !h-full !min-h-[220px]"
        />
      </div>
    </div>
  );
};
