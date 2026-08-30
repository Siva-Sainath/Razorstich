import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, CreditCard, AlertTriangle } from 'lucide-react';
import { useTimeline, sampleCurve } from '@/lib/timelineContext';
import { inr } from '../stageUtils';
import { getCaseMeta } from '@/config/wedges';

export const SubscriptionRenewalRing = ({ t, windowHours }) => {
  const days = (t * windowHours) / 24;
  const maxDays = windowHours / 24;
  const pct = Math.min(1, days / maxDays);
  const circumference = 2 * Math.PI * 42;
  const offset = circumference * (1 - pct);

  return (
    <div className="flex items-center gap-4" data-testid="renewal-ring">
      <svg width="100" height="100" viewBox="0 0 100 100" className="shrink-0">
        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <motion.circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="rgba(167,139,250,0.85)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          transform="rotate(-90 50 50)"
          transition={{ duration: 0.5 }}
        />
        <text x="50" y="48" textAnchor="middle" className="fill-white/90 text-[14px] font-mono" fontFamily="IBM Plex Mono">
          D+{days.toFixed(0)}
        </text>
        <text x="50" y="62" textAnchor="middle" className="fill-white/40 text-[9px]" fontFamily="IBM Plex Mono">
          of {maxDays}d
        </text>
      </svg>
      <div>
        <p className="type-micro text-white/45">Renewal window</p>
        <p className="type-section text-violet-300">Billing cycle tick</p>
        <p className="type-micro text-white/35 mt-1">12h simulator ticks</p>
      </div>
    </div>
  );
};

export const ChurnRiskMeter = ({ prob }) => {
  const churn = Math.round((1 - prob) * 100);
  const tone = churn > 55 ? 'text-warning' : 'text-white/70';

  return (
    <div className="mt-4" data-testid="churn-risk-meter">
      <div className="flex justify-between type-micro mb-1">
        <span className="text-white/45">Churn risk (1 − belief)</span>
        <span className={`font-mono ${tone}`}>{churn}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-violet-500/80 to-warning/70 rounded-full"
          animate={{ width: `${churn}%` }}
        />
      </div>
    </div>
  );
};

export const SubscriptionSurface = () => {
  const { caseData, t, rolloutSteps, recovered, currentRolloutStep, windowHours } = useTimeline();
  const c = caseData?.case;
  const curve = caseData?.recoveryCurve || [];
  const prob = currentRolloutStep?.belief_p ?? sampleCurve(curve, t);

  if (!c) return null;

  const actions = rolloutSteps.filter((s) => s.t <= t).map((s) => s.ui_action);

  return (
    <div className="flex flex-col h-full min-h-[300px] rounded-[24px] border border-white/[0.08] overflow-hidden glass-card" data-testid="subscription-surface">
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
        <RefreshCw size={14} className="text-violet-300" />
        <p className="type-micro text-white/50">Subscription renewal lane</p>
      </div>
      <div className="flex-1 p-5">
        <SubscriptionRenewalRing t={t} windowHours={windowHours || 336} />
        <motion.div
          className="mt-5 rounded-[16px] border border-violet-400/20 bg-violet-400/5 p-4"
          layout
        >
          <div className="flex items-start gap-3">
            <CreditCard className="text-violet-300 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="type-micro text-white/40">Plan renewal</p>
              <p className="font-mono text-lg font-semibold tabular-nums">{inr(c.amount)}/cycle</p>
              <p className="type-meta mt-1 text-white/55">{c.failureReason?.replace(/_/g, ' ')}</p>
            </div>
          </div>
          {!recovered && (
            <div className="mt-3 flex items-center gap-2 type-micro text-warning">
              <AlertTriangle size={14} />
              Renewal payment failed
            </div>
          )}
          {recovered && (
            <p className="type-section text-success mt-3">Subscriber retained</p>
          )}
        </motion.div>
        {actions.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {actions.slice(-4).map((a, i) => (
              <span key={i} className="rounded-full border border-white/10 px-2.5 py-1 type-micro font-mono text-white/55">
                {a.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}
        <ChurnRiskMeter prob={prob} />
      </div>
    </div>
  );
};
