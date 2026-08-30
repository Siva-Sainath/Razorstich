import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
 * Hybrid left panel — brain during observe/policy; customer surface during intervene/outcome.
 * During failure: split view so policy cortex stays visible while decline card shows.
 */
export const WedgeLeftPanel = ({ wedge, ghostOverlay }) => {
  const { stageMode, caseData } = useTimeline();
  const lane = WEDGE_BY_ID[wedge];
  const Surface = SURFACES[wedge];
  const isHybrid = lane?.leftPanel === 'hybrid' && Surface;

  const showSurfaceFull =
    isHybrid && (stageMode === 'intervene' || stageMode === 'outcome');
  const showSurfaceSplit = isHybrid && stageMode === 'failure';
  const showBrain =
    !isHybrid ||
    ghostOverlay ||
    stageMode === 'observe' ||
    stageMode === 'policy' ||
    showSurfaceSplit;

  const showCustomer = isHybrid && !ghostOverlay && (showSurfaceFull || showSurfaceSplit);

  if (!isHybrid) {
    return (
      <div className="relative flex flex-col h-full min-h-[360px]" data-testid="wedge-left-panel">
        <StageBrainPanel wedge={wedge} ghostOverlay={ghostOverlay} />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full min-h-[360px] gap-3" data-testid="wedge-left-panel">
      <AnimatePresence mode="popLayout">
        {showBrain && (
          <motion.div
            key="brain"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className={`min-h-0 flex flex-col ${
              showSurfaceSplit ? 'flex-[1.15] lg:flex-[1.2]' : 'flex-1'
            }`}
          >
            <StageBrainPanel wedge={wedge} ghostOverlay={ghostOverlay} />
          </motion.div>
        )}

        {showCustomer && (
          <motion.div
            key="surface"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3 }}
            className={`min-h-0 shrink-0 ${showSurfaceSplit ? 'flex-[0.85] max-h-[42%]' : 'flex-1'}`}
          >
            <Surface compact={showSurfaceSplit} />
          </motion.div>
        )}
      </AnimatePresence>

      {showCustomer && ghostOverlay && (
        <p className="type-micro text-center text-white/35 shrink-0">G · toggle customer surface</p>
      )}
    </div>
  );
};
