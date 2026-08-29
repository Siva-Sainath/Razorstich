import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimeline, API } from '@/lib/timelineContext';
import { localRecommend } from '@/lib/mockCase';
import { Panel } from './Panel';

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

/** Policy Brain — the hero. Live Q-values from POST /api/policy/recommend. */
export const PolicyBrainStrip = ({ className }) => {
  const { tick, contactsUsed, hoursSince, activeEvent } = useTimeline();
  const [rec, setRec] = useState(null);
  const thinking = activeEvent?.type === 'policy_eval';

  useEffect(() => {
    let cancelled = false;
    axios
      .post(`${API}/policy/recommend`, {
        tick,
        contacts_used: contactsUsed,
        method: 'card',
        hours_since_failure: Math.round(hoursSince * 10) / 10,
      }, { timeout: 6000 })
      .then((r) => {
        if (!cancelled) setRec(r.data);
      })
      .catch(() => {
        if (!cancelled) setRec(localRecommend(tick, contactsUsed, 'card', hoursSince));
      });
    return () => {
      cancelled = true;
    };
  }, [tick, contactsUsed]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = useMemo(() => {
    if (!rec) return [];
    const entries = Object.entries(rec.q_values);
    const qs = entries.map(([, q]) => q);
    const minQ = Math.min(...qs);
    const maxQ = Math.max(...qs);
    const span = maxQ - minQ || 1;
    const legal = new Set(rec.legal_actions);
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

  return (
    <Panel
      title="Policy Brain"
      subtitle="A 72-hour recovery episode — the DQN picks one of 11 actions every 6 hours, up to 12 steps."
      testId="policy-brain"
      className={className}
      variant="focus"
      bodyClassName="flex flex-col"
      right={
        <div className="flex flex-col items-end gap-1 shrink-0 text-right">
          <span data-testid="policy-version-badge" className="font-mono text-[12px] text-white/70">
            {rec?.policy_version || 'dqn-export-4748'}
          </span>
          <span data-testid="policy-constraints" className="font-mono text-[11px] text-white/45">
            {`source: ${rec?.source || 'dqn_export'} · guardrails ${rec?.constraints_passed ?? 3}/${rec?.constraints_total ?? 3}`}
          </span>
        </div>
      }
    >
      {/* Tick status line */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="font-mono text-[13px] text-white/60 tabular-nums">
          {`Tick ${tick + 1} of 12 · T+${tick * 6}h · contacts ${contactsUsed}/3`}
        </p>
        {thinking && (
          <motion.span
            className="font-mono text-[12px] text-primary"
            animate={{ opacity: [0.35, 0.9, 0.35] }}
            transition={{ repeat: Infinity, duration: 1.1 }}
            data-testid="policy-thinking-indicator"
          >
            evaluating…
          </motion.span>
        )}
      </div>

      {/* Chosen action */}
      <AnimatePresence mode="wait">
        <motion.div
          key={rec?.selected_action || 'loading'}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } }}
          exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
          className="mt-3 rounded-[16px] bg-primary/[0.07] border border-primary/20 px-5 py-4"
        >
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <span data-testid="chosen-action" className="font-mono text-[19px] font-semibold text-primary">
              {rec?.selected_action || '…'}
            </span>
            <span className="font-mono text-[13px] text-white/60 tabular-nums">
              {rec ? `Q ${rec.q_values[rec.selected_action].toFixed(2)}` : ''}
            </span>
          </div>
          <p className="text-sm text-white/60 mt-1.5">{rec?.note}</p>
        </motion.div>
      </AnimatePresence>

      {/* Q-value bar chart — all 11 actions */}
      <div className="mt-5 space-y-2.5 flex-1" data-testid="q-value-chart">
        {rows.map((row) => (
          <div
            key={row.action}
            data-testid={row.selected ? 'chosen-action-row' : 'candidate-action'}
            className={`flex items-center gap-3 ${row.blocked ? 'opacity-40' : ''}`}
          >
            <span className={`font-mono text-[12px] w-[168px] shrink-0 truncate ${row.selected ? 'text-primary font-semibold' : 'text-white/65'}`}>
              {row.action}
            </span>
            <div className="flex-1 h-[6px] rounded-[3px] bg-white/[0.06] overflow-hidden relative">
              <motion.div
                data-testid="q-bar"
                className={`h-full rounded-[3px] ${
                  row.selected
                    ? 'bg-primary'
                    : row.blocked
                      ? 'bg-white/[0.12]'
                      : 'bg-white/[0.25]'
                }`}
                animate={{ width: `${row.width}%` }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <span className={`font-mono text-[12px] w-[48px] text-right tabular-nums shrink-0 ${row.selected ? 'text-white/90' : 'text-white/45'}`}>
              {row.q.toFixed(2)}
            </span>
            <span className="text-[11px] text-white/35 w-[150px] shrink-0 truncate hidden xl:block">
              {row.blocked ? 'blocked by guardrail' : ACTION_HINT[row.action]}
            </span>
          </div>
        ))}
      </div>

      {/* Guardrail notes — inline, quiet */}
      <AnimatePresence>
        {enforced.map((g) => (
          <motion.p
            key={g.rule}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            data-testid="guardrail-callout"
            className="mt-4 flex items-start gap-2 text-[13px] leading-relaxed text-white/65"
          >
            <span className="mt-[6px] inline-block h-1.5 w-1.5 rounded-full bg-warning/80 shrink-0" aria-hidden="true" />
            <span>
              <span className="font-mono text-[12px] text-warning/90">Guardrail · {g.rule}</span>
              <span className="ml-2">{g.note}</span>
            </span>
          </motion.p>
        ))}
      </AnimatePresence>

      <p className="text-[13px] text-white/40 mt-4">
        Net-value policy — optimizes recovery minus cost and duplicate risk.
      </p>
    </Panel>
  );
};
