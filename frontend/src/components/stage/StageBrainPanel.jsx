import React from 'react';
import { useTimeline } from '@/lib/timelineContext';
import { PolicyBrainScene } from '@/components/svg/PolicyBrainViz';
import { POLICY_NODES } from '@/components/brain/policyBrainNodes';

const STAGE_LABELS = ['observe', 'encode', 'guard', 'dqn', 'select', 'act'];

export const StageBrainPanel = ({ wedge, ghostOverlay = false, compact = false }) => {
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
    <div className="flex flex-col h-full min-h-0 gap-2" data-testid="stage-brain-panel">
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="min-w-0">
          <p className="type-micro text-white/45 truncate">
            Policy cortex
            {ghostOverlay && <span className="text-teal-300"> · overlay</span>}
          </p>
          <p className="type-meta text-white/80 truncate">{activeAgent?.name || c?.agentName}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="type-micro font-mono text-primary">{stageLabel}</p>
          <p className="type-micro text-white/30 hidden sm:block">{nodeLabel}</p>
        </div>
      </div>

      <div
        className={`flex-1 min-h-[200px] rounded-[20px] border border-white/[0.08] overflow-hidden glass-card ${
          compact ? 'min-h-[220px]' : 'min-h-[260px]'
        }`}
      >
        <PolicyBrainScene
          pipelineStep={brainPipelineStep}
          thinking={brainThinking}
          guardrailActive={brainGuardrailActive}
          selectedAction={brainSelectedAction}
          className="!rounded-none !border-0 !h-full !min-h-[200px]"
        />
      </div>
    </div>
  );
};
