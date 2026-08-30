import React from 'react';
import { useTimeline } from '@/lib/timelineContext';
import { WEDGE_BY_ID } from '@/config/wedges';
import { StageBrainPanel } from './StageBrainPanel';
import { CheckoutSurface } from './surfaces/CheckoutSurface';
import { CartSurface } from './surfaces/CartSurface';
import { SubscriptionSurface } from './surfaces/SubscriptionSurface';
import { InvoiceSurface } from './surfaces/InvoiceSurface';

const SURFACES = {
  checkout_failed: CheckoutSurface,
  cart_abandon: CartSurface,
  subscription_failed: SubscriptionSurface,
  invoice_overdue: InvoiceSurface,
};

/**
 * Hybrid stage — brain + customer view always visible (side-by-side on desktop).
 */
export const WedgeLeftPanel = ({ wedge, ghostOverlay }) => {
  const { stageMode } = useTimeline();
  const lane = WEDGE_BY_ID[wedge];
  const Surface = SURFACES[wedge];
  const isHybrid = lane?.leftPanel === 'hybrid' && Surface;

  if (!isHybrid || ghostOverlay) {
    return (
      <div className="h-full min-h-[300px] flex flex-col" data-testid="wedge-left-panel">
        <StageBrainPanel wedge={wedge} ghostOverlay={ghostOverlay} />
      </div>
    );
  }

  return (
    <div
      className="h-full min-h-[300px] grid grid-cols-1 lg:grid-cols-2 gap-3"
      data-testid="wedge-left-panel"
    >
      <div className="min-h-[260px] lg:min-h-0 flex flex-col">
        <StageBrainPanel wedge={wedge} compact />
      </div>
      <div className="min-h-[220px] lg:min-h-0 flex flex-col">
        <Surface embedded stageMode={stageMode} />
      </div>
    </div>
  );
};
