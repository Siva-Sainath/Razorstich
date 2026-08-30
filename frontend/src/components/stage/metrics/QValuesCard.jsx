import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTimeline } from '@/lib/timelineContext';
import { GlassCard } from '../GlassCard';
import { DecisionBar } from '@/components/kit/DecisionBar';
import { friendlyAction } from '@/config/consumerCopy';

export const QValuesCard = ({ delay = 0 }) => {
  const { livePolicy, policyError } = useTimeline();
  const rec = livePolicy;
  const enforced = rec?.guardrails?.filter((g) => g.status === 'enforced') || [];

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
      .slice(0, 6)
      .map(([action, q]) => ({
        action,
        label: friendlyAction(action),
        q,
        width: 8 + ((q - minQ) / span) * 92,
        selected: action === rec.selected_action,
        blocked: !legal.has(action),
      }));
  }, [rec]);

  return (
    <GlassCard
      testId="metric-q-values"
      title="Best next steps"
      subtitle="Ranked by what the agent thinks will work"
      delay={delay}
    >
      {policyError && !rec && (
        <p className="type-meta text-warning/90 mb-3">{policyError}</p>
      )}
      {enforced.length > 0 && (
        <div className="mb-3 space-y-1 rounded-xl border border-warning/20 bg-warning/5 px-3 py-2">
          <p className="type-micro text-warning/90 font-medium">Safety rules applied</p>
          {enforced.slice(0, 3).map((g) => (
            <p key={g.rule} className="type-micro text-white/50">
              {g.note || g.rule}
            </p>
          ))}
        </div>
      )}
      {rows.length > 0 ? (
        <div className="space-y-1.5" data-testid="q-value-chart">
          {rows.map((row, i) => (
            <motion.div
              key={row.action}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + i * 0.04 }}
            >
              <DecisionBar
                label={row.label}
                width={row.width}
                value={row.selected ? 'Top pick' : ''}
                selected={row.selected}
                blocked={row.blocked}
                hint={row.blocked ? 'Not allowed now' : undefined}
                testId={row.selected ? 'chosen-action-row' : 'candidate-action'}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="type-body text-white/55">Thinking through options…</p>
      )}
      {rec?.selected_action && (
        <motion.p
          key={rec.selected_action}
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          data-testid="chosen-action"
          className="type-meta mt-3 surface-inset px-3 py-2 rounded-xl border border-primary/20 text-white/70"
        >
          Recommended · <span className="text-primary font-medium">{friendlyAction(rec.selected_action)}</span>
        </motion.p>
      )}
    </GlassCard>
  );
};
