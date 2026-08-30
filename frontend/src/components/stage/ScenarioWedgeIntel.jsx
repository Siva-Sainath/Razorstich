import React from 'react';
import { useTimeline } from '@/lib/timelineContext';
import { getCaseMeta, CHECKOUT_TAXONOMY } from '@/config/recoveryScenarios';
import { CartFunnelStrip, IntentHalfLife } from './surfaces/CartSurface';
import { SubscriptionRenewalRing, ChurnRiskMeter } from './surfaces/SubscriptionSurface';
import { DunningLadder, InvoiceARTimeline } from './surfaces/InvoiceSurface';

function CheckoutDeclineIntel() {
  const { caseData, t } = useTimeline();
  const c = caseData?.case;
  if (!c) return null;
  const meta = getCaseMeta(c.id);
  const showSpontaneous = c.failureReason === 'insufficient_funds';
  const spontStartPct = (24 / (c.windowHours || 72)) * 100;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 type-micro text-white/50" data-testid="wedge-intel-checkout">
      <span className="text-white/35">Decline intel</span>
      {CHECKOUT_TAXONOMY.map((tag) => (
        <span
          key={tag}
          className={`rounded-full px-2 py-0.5 border ${
            meta.taxonomy === tag ? 'border-primary/35 text-primary' : 'border-white/10 text-white/40'
          }`}
        >
          {tag}
        </span>
      ))}
      {showSpontaneous && (
        <span className="text-teal-300/80">
          Spontaneous band · playhead at {Math.round(t * 100)}%
          <span className="inline-block ml-2 w-16 h-1 rounded-full bg-white/10 align-middle relative">
            <span className="absolute inset-y-0 right-0 bg-teal-400/30 rounded-r-full" style={{ left: `${spontStartPct}%` }} />
          </span>
        </span>
      )}
    </div>
  );
}

function CartIntentRecovery() {
  const { caseData, t, windowHours } = useTimeline();
  const meta = getCaseMeta(caseData?.case?.id);
  return (
    <div className="space-y-2" data-testid="wedge-intel-cart">
      {meta?.beatsRules && (
        <p className="type-micro text-success">DQN beats rules on this validation case</p>
      )}
      <CartFunnelStrip wedgeReason={caseData?.case?.failureReason} />
      <IntentHalfLife t={t} windowHours={windowHours} />
    </div>
  );
}

function SubscriptionChurnPrevention() {
  const { t, windowHours, recoveryProb } = useTimeline();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="wedge-intel-subscription">
      <SubscriptionRenewalRing t={t} windowHours={windowHours || 336} />
      <ChurnRiskMeter prob={recoveryProb} />
    </div>
  );
}

function InvoiceDunningPlaybook() {
  const { caseData, t, currentRolloutStep, windowHours } = useTimeline();
  const meta = getCaseMeta(caseData?.case?.id);
  return (
    <div className="space-y-2" data-testid="wedge-intel-invoice">
      {meta?.enterprise && <p className="type-micro text-teal-300/90">Enterprise invoice · ₹45k</p>}
      <DunningLadder currentAction={currentRolloutStep?.rl_action || currentRolloutStep?.ui_action} />
      <InvoiceARTimeline t={t} windowHours={windowHours} />
    </div>
  );
}

const INTEL = {
  checkout_failed: CheckoutDeclineIntel,
  cart_abandon: CartIntentRecovery,
  subscription_failed: SubscriptionChurnPrevention,
  invoice_overdue: InvoiceDunningPlaybook,
};

export const ScenarioWedgeIntel = ({ scenarioId }) => {
  const Body = INTEL[scenarioId] || CheckoutDeclineIntel;
  return (
    <div className="border-t border-white/[0.06] pt-3">
      <Body />
    </div>
  );
};
