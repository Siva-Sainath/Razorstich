import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Link2, CheckCircle2 } from 'lucide-react';
import { useTimeline } from '@/lib/timelineContext';
import { customerPhaseFromRollout, inr } from '../stageUtils';
import { getCaseMeta } from '@/config/recoveryScenarios';
import { WEDGE_ACCENT } from '@/config/demoPersonas';

const FUNNEL_STEPS = [
  { key: 'browsing', label: 'Browse' },
  { key: 'payment_page', label: 'Pay page' },
  { key: 'shipping', label: 'Shipping' },
];

export const CartFunnelStrip = ({ wedgeReason }) => {
  const reason = wedgeReason || 'payment_page';
  const activeIdx = FUNNEL_STEPS.findIndex((s) => s.key === reason);
  const accent = WEDGE_ACCENT.cart;

  return (
    <div className="flex items-center gap-1 w-full" data-testid="cart-funnel-strip">
      {FUNNEL_STEPS.map((step, i) => {
        const active = i === activeIdx;
        const past = i < activeIdx;
        return (
          <div key={step.key} className="flex-1 flex items-center gap-1 min-w-0">
            <div
              className={`flex-1 rounded-full h-1.5 transition-colors ${
                active ? accent.bar : past ? 'bg-warning/50' : 'bg-white/10'
              }`}
            />
            {i < FUNNEL_STEPS.length - 1 && <span className="text-white/20 type-micro">›</span>}
          </div>
        );
      })}
      <span className={`type-micro shrink-0 ml-2 ${accent.text}`}>
        drop · {reason.replace(/_/g, ' ')}
      </span>
    </div>
  );
};

export const IntentHalfLife = ({ t, windowHours }) => {
  const hours = t * windowHours;
  const decay = Math.max(0, 1 - hours / windowHours);
  const pct = Math.round(decay * 100);

  return (
    <div className="mt-3" data-testid="intent-half-life">
      <div className="flex justify-between type-micro mb-1">
        <span className="text-white/45">Purchase intent</span>
        <span className="font-mono text-warning">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-warning/90 to-warning/40 rounded-full"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
      <p className="type-micro text-white/35 mt-1">{windowHours}h attention window · 2h ticks</p>
    </div>
  );
};

export const CartSurface = ({ embedded = false }) => {
  const { caseData, t, rolloutSteps, recovered, windowHours } = useTimeline();
  const c = caseData?.case;
  if (!c) return null;

  const phase = customerPhaseFromRollout(rolloutSteps, t, recovered);
  const meta = getCaseMeta(c.id);

  const shell = embedded
    ? 'flex flex-col rounded-[20px] border border-white/[0.08] bg-black/30 overflow-hidden'
    : 'flex flex-col h-full min-h-[300px] rounded-[24px] border border-white/[0.08] overflow-hidden glass-card';

  return (
    <div className={shell} data-testid="cart-surface">
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <CartFunnelStrip wedgeReason={c.failureReason} />
      </div>
      <div className="flex-1 p-5 flex flex-col items-center justify-center">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[260px] rounded-[20px] border border-warning/20 bg-black/40 p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${recovered ? 'bg-success/20' : 'bg-warning/15'}`}>
              {recovered ? <CheckCircle2 className="text-success" size={24} /> : <ShoppingCart className="text-warning" size={24} />}
            </div>
            <div>
              <p className="type-micro text-white/40">Cart value</p>
              <p className="font-mono text-xl font-semibold tabular-nums">{inr(c.amount)}</p>
            </div>
          </div>
          {meta.beatsRules && (
            <p className="type-micro text-success mb-3 border border-success/20 rounded-lg px-2 py-1 bg-success/5">
              DQN beats rules on this val case
            </p>
          )}
          {phase === 'msg' && (
            <div className="flex items-center gap-2 type-meta text-primary">
              <Link2 size={14} />
              Payment link cadence active
            </div>
          )}
          {recovered && (
            <p className="type-section text-success mt-2">Cart converted</p>
          )}
        </motion.div>
        <IntentHalfLife t={t} windowHours={windowHours} />
      </div>
    </div>
  );
};
