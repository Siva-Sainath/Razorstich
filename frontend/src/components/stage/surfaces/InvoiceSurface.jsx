import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ArrowUpRight, Building2 } from 'lucide-react';
import { useTimeline } from '@/lib/timelineContext';
import { inr } from '../stageUtils';
import { getCaseMeta } from '@/config/recoveryScenarios';

const DUNNING_TIERS = [
  { key: 'notify', label: 'Reminder', actions: ['notify_sms', 'notify_email', 'notify_whatsapp'] },
  { key: 'link', label: 'Payment link', actions: ['create_payment_link', 'offer_incentive'] },
  { key: 'escalate', label: 'Escalate', actions: ['escalate_support', 'request_new_method'] },
];

export const DunningLadder = ({ currentAction }) => {
  const tierIdx = DUNNING_TIERS.findIndex((tier) =>
    tier.actions.some((a) => currentAction?.includes(a.replace('notify_', '').replace('create_', '')) || currentAction === a)
  );
  const activeTier = currentAction
    ? DUNNING_TIERS.findIndex((tier) => tier.actions.includes(currentAction))
    : -1;

  return (
    <div className="flex gap-2 w-full" data-testid="dunning-ladder">
      {DUNNING_TIERS.map((tier, i) => {
        const lit = i <= activeTier;
        const current = i === activeTier;
        return (
          <div
            key={tier.key}
            className={`flex-1 rounded-lg border px-2 py-2 text-center transition-colors ${
              current
                ? 'border-teal-400/50 bg-teal-400/15 text-teal-300'
                : lit
                  ? 'border-white/15 bg-white/5 text-white/60'
                  : 'border-white/8 bg-transparent text-white/35'
            }`}
          >
            <p className="type-micro font-medium">{tier.label}</p>
          </div>
        );
      })}
    </div>
  );
};

export const InvoiceARTimeline = ({ t, windowHours }) => {
  const days = (t * windowHours) / 24;
  const maxDays = windowHours / 24;
  const markers = [0, 7, 14, 21, maxDays];

  return (
    <div className="mt-4" data-testid="ar-timeline">
      <div className="relative h-3 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-500/60 to-teal-300/40 rounded-full"
          animate={{ width: `${(days / maxDays) * 100}%` }}
        />
        {markers.map((m) => (
          <div
            key={m}
            className="absolute top-0 bottom-0 w-px bg-white/25"
            style={{ left: `${(m / maxDays) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1 type-micro font-mono text-white/35">
        <span>Due</span>
        <span>D+{Math.round(days)}</span>
        <span>D+{maxDays}</span>
      </div>
    </div>
  );
};

export const InvoiceSurface = ({ embedded = false }) => {
  const { caseData, t, recovered, displayAmount, currentRolloutStep, windowHours } = useTimeline();
  const c = caseData?.case;
  if (!c) return null;

  const meta = getCaseMeta(c.id);
  const isEnterprise = c.failureReason === 'enterprise' || meta.taxonomy === 'Enterprise';

  const shell = embedded
    ? 'flex flex-col rounded-[20px] border border-white/[0.08] bg-black/30 overflow-hidden'
    : 'flex flex-col h-full min-h-[300px] rounded-[24px] border border-white/[0.08] overflow-hidden glass-card';

  return (
    <div className={shell} data-testid="invoice-surface">
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <DunningLadder currentAction={currentRolloutStep?.rl_action || currentRolloutStep?.ui_action} />
      </div>
      <div className="flex-1 p-5">
        <motion.div
          className="rounded-[16px] border border-teal-400/25 bg-gradient-to-br from-teal-400/10 to-transparent p-5"
          layout
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {isEnterprise ? <Building2 className="text-teal-300" size={22} /> : <FileText className="text-teal-300" size={22} />}
              <div>
                <p className="type-micro text-white/40">{isEnterprise ? 'Enterprise AR' : 'SMB invoice'}</p>
                <p className="font-display text-2xl font-semibold tabular-nums text-white/95">
                  {inr(recovered ? displayAmount.captured || c.amount : c.amount)}
                </p>
              </div>
            </div>
            {!recovered && (
              <span className="rounded-full border border-warning/40 bg-warning/10 px-2 py-1 type-micro text-warning">
                OVERDUE
              </span>
            )}
          </div>
          {meta.enterprise && (
            <p className="type-micro text-teal-300/90 mt-3 flex items-center gap-1">
              <ArrowUpRight size={12} />
              Single-tick escalation close path
            </p>
          )}
          {recovered && (
            <p className="type-section text-success mt-3">Invoice collected in sim</p>
          )}
        </motion.div>
        <InvoiceARTimeline t={t} windowHours={windowHours} />
        <p className="type-micro font-mono text-white/30 mt-3">{c.id} · {c.merchant}</p>
      </div>
    </div>
  );
};
