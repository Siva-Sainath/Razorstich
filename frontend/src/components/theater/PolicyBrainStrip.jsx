import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimeline } from '@/lib/timelineContext';
import { Panel } from './Panel';
import { DecisionBar } from '@/components/kit/DecisionBar';
import { EvidenceRow } from '@/components/kit/EvidenceRow';
import {
  PolicyBrainViz,
  PolicyStageCard,
  pipelineStepFromPolicy,
  stageIdFromStep,
} from '@/components/svg/PolicyBrainViz';

const ACTION_HINT = {
  wait: 'hold, re-evaluate next tick',
  notify_sms: 'SMS reminder',
  notify_whatsapp: 'WhatsApp reminder',
  notify_email: 'email reminder',
  create_payment_link: 'UPI-preselected link',
  retry_same_method: 'silent card retry',
  retry_upi: 'UPI collect request',
  offer_incentive: 'small cashback offer',
  escalate_support: 'human follow-up',
  request_new_method: 'ask for another method',
  stop: 'close the episode',
};

export const PolicyBrainStrip = ({ className }) => {
  const {
    tick,
    tickHours,
    maxSteps,
    windowHours,
    contactsUsed,
    maxContacts,
    activeEvent,
    caseData,
    activeAgent,
    livePolicy,
    policyError,
  } = useTimeline();

  const thinking = activeEvent?.type === 'policy_eval';
  const c = caseData?.case;
  const rec = livePolicy;

  const rows = useMemo(() => {
    if (!rec?.q_values) return [];
    const entries = Object.entries(rec.q_values);
    const qs = entries.map(([, q]) => q);
    const minQ = Math.min(...qs);
    const maxQ = Math.max(...qs);
    const span = maxQ - minQ || 1;
    const legal = new Set(rec.legal_actions || []);
    return entries
      .sort((a, b) => b[1] - a[1])
      .map(([action, q]) => ({
        action,
        q,
        width: 6 + ((q - minQ) / span) * 94,
        selected: action === rec.selected_action,
        blocked: !legal.has(action),
      }));
  }, [rec]);

  const enforced = rec?.guardrails?.filter((g) => g.status === 'enforced') || [];
  const agentLabel = rec?.agent_name || activeAgent?.name || c?.agentName || 'Recovery agent';

  const pipelineStep = pipelineStepFromPolicy({
    thinking,
    rec,
    tick,
    guardrailEnforced: enforced.length > 0,
  });
  const stageId = stageIdFromStep(pipelineStep);
  const topRows = rows.slice(0, 4);

  return (
    <Panel
      title="Policy Brain"
      subtitle={`Live DQN · ${agentLabel}`}
      testId="policy-brain"
      className={className}
      variant="primary"
      bodyClassName="flex flex-col gap-4 pt-3"
      right={
        <div className="flex flex-col items-end gap-1 shrink-0 text-right">
          <span data-testid="policy-version-badge" className="font-mono type-meta tabular-nums">
            {rec?.policy_version || c?.policyVersion || '…'}
          </span>
          <span data-testid="policy-constraints" className="type-micro font-mono">
            {rec
              ? `guardrails ${rec.constraints_passed}/${rec.constraints_total}`
              : policyError
                ? 'policy unavailable'
                : 'loading…'}
          </span>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <PolicyBrainViz
          pipelineStep={pipelineStep}
          thinking={thinking}
          guardrailActive={enforced.length > 0}
          selectedAction={rec?.selected_action || ''}
          height={340}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <PolicyStageCard
            stage={stageId}
            action={rec?.selected_action}
            qValue={rec?.selected_action ? rec.q_values[rec.selected_action]?.toFixed(2) : null}
            meta={`Tick ${tick + 1}/${maxSteps} · T+${Math.round(tick * tickHours)}h`}
            guardrailNote={enforced[0] ? `${enforced[0].rule} — ${enforced[0].note}` : undefined}
          />

          <AnimatePresence mode="wait">
            {rec?.selected_action ? (
              <motion.div
                key={rec.selected_action}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="surface-inset px-4 py-3.5"
                data-testid="chosen-action"
              >
                <p className="type-micro text-white/45">Policy output</p>
                <p className="type-metric text-primary mt-1">{rec.selected_action}</p>
                <p className="type-meta mt-1.5 line-clamp-3">{rec.note}</p>
              </motion.div>
            ) : (
              <div className="surface-inset px-4 py-3.5 flex items-center justify-center">
                <p className="type-meta text-white/40">Awaiting forward pass…</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap surface-inset px-4 py-2.5">
        <p className="type-micro font-mono tabular-nums text-white/50">
          {`${windowHours}h window · contacts ${contactsUsed}/${maxContacts}`}
        </p>
        {thinking && (
          <motion.span
            className="font-mono type-micro text-primary"
            animate={{ opacity: [0.35, 0.9, 0.35] }}
            transition={{ repeat: Infinity, duration: 1.1 }}
            data-testid="policy-thinking-indicator"
          >
            synapse firing…
          </motion.span>
        )}
      </div>

      {policyError && !rec && (
        <p className="type-meta text-warning/90">{policyError}</p>
      )}

      {topRows.length > 0 && (
        <div className="space-y-2" data-testid="q-value-chart">
          <p className="type-micro px-1">Top Q-values</p>
          {topRows.map((row) => (
            <DecisionBar
              key={row.action}
              label={row.action}
              width={row.width}
              value={row.q.toFixed(2)}
              selected={row.selected}
              blocked={row.blocked}
              hint={row.blocked ? 'blocked' : ACTION_HINT[row.action]}
              testId={row.selected ? 'chosen-action-row' : 'candidate-action'}
            />
          ))}
        </div>
      )}

      <div className="space-y-2">
        <AnimatePresence>
          {enforced.map((g) => (
            <motion.div key={g.rule} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <EvidenceRow
                tone="bg-warning/80"
                label={`Guardrail · ${g.rule}`}
                detail={g.note}
                testId="guardrail-callout"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Panel>
  );
};
