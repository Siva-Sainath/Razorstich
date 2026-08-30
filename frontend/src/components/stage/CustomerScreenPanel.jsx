import React from 'react';
import { Panel } from '@/components/theater/Panel';
import { CheckoutSurface } from './surfaces/CheckoutSurface';
import { CartSurface } from './surfaces/CartSurface';
import { SubscriptionSurface } from './surfaces/SubscriptionSurface';
import { InvoiceSurface } from './surfaces/InvoiceSurface';
import { useTimeline } from '@/lib/timelineContext';
import { friendlyUiAction } from '@/config/consumerCopy';

const SURFACES = {
  checkout_failed: CheckoutSurface,
  cart_abandon: CartSurface,
  subscription_failed: SubscriptionSurface,
  invoice_overdue: InvoiceSurface,
};

/** Customer-facing screen — always visible, updates with rollout replay. */
export const CustomerScreenPanel = ({ scenarioId, className }) => {
  const { currentRolloutStep, recovered } = useTimeline();
  const Surface = SURFACES[scenarioId] || CheckoutSurface;
  const phase = recovered
    ? 'Payment captured'
    : friendlyUiAction(currentRolloutStep?.ui_action);

  return (
    <Panel
      title="Customer screen"
      subtitle="What the shopper sees as the agent acts — driven by rollout replay"
      testId="customer-screen-panel"
      className={className}
      variant="primary"
      right={
        <span className="type-micro text-white/45 shrink-0 max-w-[120px] text-right leading-snug">
          {phase}
        </span>
      }
      bodyClassName="pt-2 min-h-[320px] flex flex-col"
    >
      <div className="flex-1 min-h-[280px]">
        <Surface embedded />
      </div>
    </Panel>
  );
};
