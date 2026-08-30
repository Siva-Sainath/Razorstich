import React, { useMemo } from 'react';
import { useTimeline } from '@/lib/timelineContext';
import { PolicyBrainScene } from '@/components/svg/PolicyBrainViz';
import { pipelineStepFromPolicy } from '@/components/svg/PolicyBrainViz';
import { DecisionBar } from '@/components/kit/DecisionBar';

const ACTION_HINT = {
  wait: 'hold',
  notify_sms: 'SMS',
  notify_whatsapp: 'WhatsApp',
  create_payment_link: 'payment link',
  retry_same_method: 'card retry',
  retry_upi: 'UPI retry',
  escalate_support: 'escalate',
  request_new_method: 'new method',
  stop: 'close',
};

export const StagePolicyView = () => {
  const {
    tick,
    tickHours,
    maxSteps,
    activeEvent,
    livePolicy,
    policyError,
    contactsUsed,
    maxContacts,
  } = useTimeline();

  const thinking = activeEvent?.type === 'policy_eval';
  const rec = livePolicy;
  const enforced = rec?.guardrails?.filter((g) => g.status === 'enforced') || [];

  const pipelineStep = pipelineStepFromPolicy({
    thinking,
    rec,
    tick,
    guardrailEnforced: enforced.length > 0,
  });

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
      .slice(0, 5)
      .map(([action, q]) => ({
        action,
        q,
        width: 8 + ((q - minQ) / span) * 92,
        selected: action === rec.selected_action,
        blocked: !legal.has(action),
      }));
  }, [rec]);

  return (
    <div className="flex flex-col h-full gap-4" data-testid="stage-policy-view">
      <div className="flex-1 min-h-[200px] rounded-[20px] border border-white/10 bg-black/20 overflow-hidden">
        <PolicyBrainScene
          pipelineStep={pipelineStep}
          thinking={thinking}
          guardrailActive={enforced.length > 0}
          selectedAction={rec?.selected_action || ''}
          height={280}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 shrink-0">
        <div className="surface-inset px-3 py-2.5">
          <p className="type-micro">Tick</p>
          <p className="type-metric text-primary mt-1">{tick + 1}/{maxSteps}</p>
        </div>
        <div className="surface-inset px-3 py-2.5">
          <p className="type-micro">Contacts</p>
          <p className="type-metric mt-1">{contactsUsed}/{maxContacts}</p>
        </div>
      </div>

      {rec?.selected_action && (
        <div className="surface-inset px-4 py-3 shrink-0" data-testid="chosen-action">
          <p className="type-micro text-primary">Selected action</p>
          <p className="type-section text-white mt-1">{rec.selected_action}</p>
          <p className="type-meta mt-1">T+{Math.round(tick * tickHours)}h · {rec.policy_version}</p>
        </div>
      )}

      {policyError && !rec && (
        <p className="type-meta text-warning/90">{policyError}</p>
      )}

      {rows.length > 0 && (
        <div className="space-y-1.5 shrink-0 max-h-[140px] overflow-y-auto" data-testid="q-value-chart">
          {rows.map((row) => (
            <DecisionBar
              key={row.action}
              label={row.action}
              width={row.width}
              value={row.q.toFixed(2)}
              selected={row.selected}
              blocked={row.blocked}
              hint={ACTION_HINT[row.action]}
              testId={row.selected ? 'chosen-action-row' : 'candidate-action'}
            />
          ))}
        </div>
      )}
    </div>
  );
};
