import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PolicyBrainScene } from '@/components/brain/PolicyBrainScene';
import { POLICY_NODES } from '@/components/brain/policyBrainNodes';

/** @deprecated alias — use PolicyBrainScene */
export const PolicyBrainViz = (props) => <PolicyBrainScene {...props} />;

export { PolicyBrainScene };

/** Stage card — updates as the policy pipeline advances. */
export const PolicyStageCard = ({
  stage = 'observe',
  title,
  detail,
  meta,
  qValue,
  action,
  guardrailNote,
}) => {
  const STAGE_COPY = {
    observe: { title: 'Reading episode', detail: 'Failure signal, method, hours elapsed, contacts used.' },
    encode: { title: 'Building obs vector', detail: 'Normalizing state for the DQN input layer.' },
    guard: { title: 'Applying action mask', detail: guardrailNote || 'Illegal actions removed before Q lookup.' },
    dqn: { title: 'Q-value forward pass', detail: 'Dueling Double DQN over legal action space.' },
    select: { title: 'Masked argmax', detail: action ? `Leading candidate: ${action}` : 'Ranking legal actions by Q.' },
    act: { title: 'Emitting intervention', detail: action ? `Selected · ${action}` : 'Waiting for policy output.' },
  };
  const copy = STAGE_COPY[stage] || STAGE_COPY.observe;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stage + (action || '')}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.22 }}
        className="surface-inset px-4 py-3.5 min-h-[88px]"
        data-testid="policy-stage-card"
      >
        <p className="type-micro text-primary/80 font-mono uppercase tracking-wider mb-1">{stage}</p>
        <p className="type-section text-white/90">{title || copy.title}</p>
        <p className="type-meta mt-1.5 leading-relaxed">{detail || copy.detail}</p>
        {(qValue != null || meta) && (
          <div className="flex items-center gap-3 mt-2 type-micro font-mono text-white/45">
            {qValue != null && <span className="text-primary">Q {qValue}</span>}
            {meta && <span>{meta}</span>}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export function pipelineStepFromPolicy({ thinking, rec, tick, guardrailEnforced }) {
  if (!rec && !thinking) return 0;
  if (thinking && !rec) return Math.min(4, 1 + (tick % 4));
  if (guardrailEnforced) return 2;
  if (rec?.selected_action) return 5;
  if (rec?.q_values) return 4;
  return 3;
}

export function stageIdFromStep(step) {
  return POLICY_NODES[Math.min(step, POLICY_NODES.length - 1)]?.id || 'observe';
}
