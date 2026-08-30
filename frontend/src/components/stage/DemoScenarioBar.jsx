import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTimeline } from '@/lib/timelineContext';
import { RECOVERY_LANES, SCENARIO_CASES, RECOVERY_BY_ID, getCaseMeta } from '@/config/recoveryScenarios';
import { WEDGE_ACCENT } from '@/config/demoPersonas';

/** Single control strip: scenario tabs + validation case picker. */
export const DemoScenarioBar = ({ scenarioId, compact = false }) => {
  const { pathname } = useLocation();
  const { caseData, loadCase } = useTimeline();
  const currentId = caseData?.case?.id;
  const lane = RECOVERY_BY_ID[scenarioId];
  const accent = WEDGE_ACCENT[lane?.accent || 'checkout'];
  const cases = SCENARIO_CASES[scenarioId] || [];

  if (compact) {
    const amount = caseData?.case?.amount;
    return (
      <div
        className="shrink-0 rounded-[12px] border border-white/[0.08] bg-white/[0.02] px-3 py-2 flex items-center justify-between gap-3"
        data-testid="demo-scenario-bar"
      >
        <span className="type-meta text-white/70">
          {lane?.label} · <span className="font-mono text-white/90">{currentId}</span>
          {amount != null && (
            <span className="text-white/45"> · ₹{Number(amount).toLocaleString('en-IN')}</span>
          )}
        </span>
        <span className="type-micro text-white/35">{lane?.windowLabel}</span>
      </div>
    );
  }

  return (
    <div
      className="shrink-0 rounded-[16px] border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 flex flex-col sm:flex-row sm:items-center gap-3"
      data-testid="demo-scenario-bar"
    >
      <div className="flex items-center gap-1.5 shrink-0">
        {RECOVERY_LANES.map((w) => {
          const active = pathname === w.path;
          return (
            <Link
              key={w.id}
              to={w.path}
              className={`rounded-lg px-3 py-1.5 type-micro font-medium transition-colors ${
                active
                  ? 'bg-primary/15 text-primary border border-primary/35'
                  : 'text-white/45 hover:text-white/75 border border-transparent'
              }`}
            >
              {w.short}
            </Link>
          );
        })}
      </div>

      {cases.length > 0 && (
        <>
          <div className="hidden sm:block w-px h-6 bg-white/10 shrink-0" aria-hidden />
          <div className="flex gap-1.5 overflow-x-auto scrollbar-thin flex-1 min-w-0" data-testid="stage-case-picker">
            {cases.map((caseId) => {
              const active = caseId === currentId;
              const meta = getCaseMeta(caseId);
              const shortId = caseId.replace(/^VAL-[A-Z]+-/, '');
              const hookShort = meta.hook?.split('·')[0]?.trim() || meta.taxonomy;

              return (
                <motion.button
                  key={caseId}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  data-testid={active ? 'queue-case-current' : 'queue-case-row'}
                  onClick={() => !active && loadCase(caseId)}
                  title={caseId}
                  className={`shrink-0 rounded-lg border px-2.5 py-1.5 type-micro transition-colors text-left ${
                    active
                      ? `${accent.text} border-current/40 bg-white/[0.06]`
                      : 'border-white/10 text-white/50 hover:border-white/22 hover:text-white/70'
                  }`}
                >
                  <span className="font-mono">{shortId}</span>
                  {hookShort && (
                    <span className={`ml-1.5 ${active ? 'text-white/55' : 'text-white/35'}`}>{hookShort}</span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
