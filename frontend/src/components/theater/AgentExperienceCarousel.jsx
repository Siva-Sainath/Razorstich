import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTimeline } from '@/lib/timelineContext';
import { Panel } from './Panel';
import { AgentPreviewCard } from './AgentPreviewCard';
import { RevenueRecoverySpark } from '@/components/svg/RevenueRecoverySpark';

const WEDGE_DEMOS = [
  { id: 'checkout_failed', caseId: 'VAL-CHK-004', label: 'Checkout failed' },
  { id: 'cart_abandon', caseId: 'VAL-CART-003', label: 'Cart abandon' },
  { id: 'subscription_failed', caseId: 'VAL-SUB-003', label: 'Subscription' },
  { id: 'invoice_overdue', caseId: 'VAL-INV-001', label: 'Invoice overdue' },
];

export const AgentExperienceCarousel = ({ className }) => {
  const { caseData, loadCase, t, recoveryProb } = useTimeline();
  const scrollerRef = useRef(null);
  const activeWedge = caseData?.case?.wedge;

  const scrollBy = (dir) => scrollerRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });

  return (
    <Panel
      title="Customer view"
      subtitle="Swipe through agent wedges · tap to load a validation case"
      testId="agent-experience-carousel"
      className={className}
      variant="standard"
      bodyClassName="pt-2"
      right={
        <div className="flex gap-1.5 shrink-0">
          <button type="button" aria-label="Previous" onClick={() => scrollBy(-1)} className="h-9 w-9 rounded-full border border-white/10 text-white/55 hover:text-white hover:border-white/20 transition-colors duration-150">
            <ChevronLeft size={16} className="mx-auto" />
          </button>
          <button type="button" aria-label="Next" onClick={() => scrollBy(1)} className="h-9 w-9 rounded-full border border-white/10 text-white/55 hover:text-white hover:border-white/20 transition-colors duration-150">
            <ChevronRight size={16} className="mx-auto" />
          </button>
        </div>
      }
    >
      <div ref={scrollerRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 scrollbar-thin">
        {WEDGE_DEMOS.map((demo) => {
          const active = activeWedge === demo.id && caseData?.case?.id === demo.caseId;
          return (
            <motion.button
              key={demo.id}
              type="button"
              onClick={() => caseData?.case?.id !== demo.caseId && loadCase(demo.caseId)}
              data-testid={active ? 'agent-preview-active' : 'agent-preview-card'}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.18 }}
              className={`snap-center shrink-0 w-[272px] rounded-[16px] border p-4 text-left panel-hover-lift ${
                active
                  ? 'gradient-border bg-primary/[0.08] shadow-[0_20px_50px_rgba(43,138,247,0.12)]'
                  : 'border-white/[0.07] bg-white/[0.03] hover:border-white/14'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <p className={`type-section ${active ? 'text-primary' : 'text-white/88'}`}>{demo.label}</p>
                <RevenueRecoverySpark
                  values={active ? [0.2, 0.35, recoveryProb, recoveryProb * 0.95, recoveryProb] : [0.15, 0.22, 0.28, 0.35, 0.42]}
                  animate={active}
                />
              </div>
              <AgentPreviewCard wedge={demo.id} t={t} caseData={active ? caseData : null} compact />
            </motion.button>
          );
        })}
      </div>
    </Panel>
  );
};
