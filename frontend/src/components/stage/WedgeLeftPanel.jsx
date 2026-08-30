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

export const WedgeLeftPanel = ({ wedge, ghostOverlay }) => {
  const { stageMode, caseData } = useTimeline();
  const lane = WEDGE_BY_ID[wedge];
  const Surface = SURFACES[wedge];

  const showSurface =
    lane?.leftPanel === 'hybrid' &&
    Surface &&
    (stageMode === 'failure' || stageMode === 'intervene' || stageMode === 'outcome');

  const showBrain = !showSurface || ghostOverlay;

  return (
    <div className="relative flex flex-col h-full min-h-0" data-testid="wedge-left-panel">
      <AnimatePresence mode="wait">
        {showSurface && !ghostOverlay ? (
          <motion.div
            key="surface"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.35 }}
            className="flex-1 min-h-0"
          >
            <Surface />
          </motion.div>
        ) : (
          <motion.div
            key="brain"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.35 }}
            className="flex-1 min-h-0"
          >
            <StageBrainPanel wedge={wedge} ghostOverlay={ghostOverlay} />
          </motion.div>
        )}
      </AnimatePresence>
      {showSurface && ghostOverlay && (
        <p className="type-micro text-center text-white/35 mt-2 shrink-0">G · toggle customer surface</p>
      )}
    </div>
  );
};
