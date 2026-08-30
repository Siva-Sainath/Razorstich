import React from 'react';
import { motion } from 'framer-motion';
import { useTimeline } from '@/lib/timelineContext';
import { GlassCard } from '../GlassCard';
import { MetricNumber } from '@/components/kit/MetricNumber';
import { getPersona } from '@/config/demoPersonas';
import { inr } from '../stageUtils';

/** Persona-specific hero — highlights what makes each validation run unique (real rollout data). */
export const PersonaHeroCard = () => {
  const { caseData, rolloutSteps, wedgeSummary } = useTimeline();
  const c = caseData?.case;
  if (!c) return null;

  const persona = getPersona(c.id);
  const ghost = caseData?.ghostRuns || [];
  const dqn = ghost.find((g) => g.chosen);
  const rules = ghost.find((g) => g.id === 'gr-rules');
  const uniqueActions = [...new Set(rolloutSteps.map((s) => s.ui_action))];
  const escalateCount = rolloutSteps.filter((s) => s.ui_action === 'escalate_support').length;
  const linkCount = rolloutSteps.filter((s) => s.ui_action === 'create_payment_link').length;
  const b = wedgeSummary?.benchmark;
  const hero = persona?.hero || 'action_mix';

  let title = persona?.hook || c.failureReason;
  let metric = inr(c.amount);
  let detail = persona?.story || '';

  switch (hero) {
    case 'beats_rules':
      const delta = dqn && rules ? Math.round((dqn.prob - rules.prob) * 100) : 0;
      title = `DQN +${delta}% vs rules`;
      metric = `${Math.round((dqn?.prob || 0) * 100)}%`;
      detail = `Same val scenario · rules stuck at ${Math.round((rules?.prob || 0) * 100)}% on ghost replay`;
      break;
    case 'enterprise':
      title = 'Enterprise capture';
      metric = inr(c.amount);
      detail = `${rolloutSteps.length} simulator tick${rolloutSteps.length === 1 ? '' : 's'} · ${c.agentName}`;
      break;
    case 'patience':
      title = `${escalateCount} escalations`;
      metric = `${rolloutSteps.length} ticks`;
      detail = 'Issuer decline · agent holds then escalates under trust budget';
      break;
    case 'link_cadence':
      title = `${linkCount} payment links`;
      metric = inr(c.amount);
      detail = 'Shipping-drop cart · link cadence from trained cart policy';
      break;
    case 'renewal':
      title = `${c.windowHours}h renewal window`;
      metric = `${rolloutSteps.length} ticks`;
      detail = 'Wait → method update → escalate path from subscription DQN';
      break;
    case 'action_mix':
    default:
      title = `${uniqueActions.length} distinct actions`;
      metric = inr(c.amount);
      detail = uniqueActions.slice(0, 4).map((a) => a.replace(/_/g, ' ')).join(' · ');
      break;
  }

  return (
    <GlassCard
      testId="persona-hero-card"
      figure={c.id}
      title={persona?.hook || c.failureReason?.replace(/_/g, ' ')}
      subtitle={title}
      delay={0}
    >
      <motion.div
        key={`${c.id}-${metric}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <MetricNumber size="hero" className="text-white/92">{metric}</MetricNumber>
      </motion.div>
      <p className="type-body mt-2 text-white/55 leading-relaxed">{detail}</p>
      {b?.seeds_beaten && (
        <p className="type-micro mt-3 text-white/40">
          Benchmark {b.seeds_beaten} seeds · +{b.acceptance?.mean_improvement_pct?.toFixed(0)}% vs rules
        </p>
      )}
    </GlassCard>
  );
};
