import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useTimeline, API } from '@/lib/timelineContext';
import { FALLBACK_QUEUE } from '@/lib/mockCase';
import { Panel } from './Panel';

const STATUS_DOT = {
  recovering: 'bg-primary/80',
  queued: 'bg-white/30',
  recovered: 'bg-[rgba(45,212,191,0.85)]',
};

const inr = (n) => `₹${n.toLocaleString('en-IN')}`;

/** Other failing payments the agent is working — makes RazorStitch read as a product. */
export const CaseQueue = ({ className }) => {
  const { recoveryProb, recovered, tick } = useTimeline();
  const [cases, setCases] = useState(null);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${API}/cases/queue`, { timeout: 6000 })
      .then((r) => {
        if (!cancelled) setCases(r.data.cases);
      })
      .catch(() => {
        if (!cancelled) setCases(FALLBACK_QUEUE);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = (cases || []).map((c) =>
    c.isCurrent
      ? { ...c, odds: recoveryProb, tick, status: recovered ? 'recovered' : 'recovering' }
      : c
  );

  return (
    <Panel
      title="Recovery queue"
      subtitle="Every failed payment gets its own 72-hour episode."
      testId="case-queue"
      className={className}
      right={
        <span className="font-mono text-[12px] text-white/45 shrink-0 tabular-nums">
          {rows.length} open
        </span>
      }
    >
      <div>
        {rows.length === 0 && (
          <p className="text-[13px] text-white/40 py-4 text-center">Loading queue…</p>
        )}
        {rows.map((c) => (
          <button
            key={c.id}
            type="button"
            data-testid={c.isCurrent ? 'queue-case-current' : 'queue-case-row'}
            onClick={() =>
              c.isCurrent
                ? undefined
                : toast('Multi-case view is on the roadmap', {
                    description: `This demo follows ${rows.find((r) => r.isCurrent)?.id || 'CASE-7F3A'} end to end.`,
                  })
            }
            className={`w-full flex items-center gap-3 px-3 py-3 text-left border-b border-white/[0.06] last:border-b-0 rounded-[8px] transition-colors duration-150 ${
              c.isCurrent ? 'bg-white/[0.05]' : 'hover:bg-white/[0.03]'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_DOT[c.status] || 'bg-white/30'}`} aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-2">
                <span className={`font-mono text-[12px] ${c.isCurrent ? 'text-primary' : 'text-white/70'}`}>{c.id}</span>
                {c.isCurrent && <span className="text-[10px] text-white/40">viewing</span>}
              </span>
              <span className="block text-[12px] text-white/50 truncate mt-0.5">
                {c.customer} · {inr(c.amount)} · {c.method}
              </span>
            </span>
            <span className="text-right shrink-0">
              <span className="block font-mono text-[13px] tabular-nums text-white/85">
                {c.status === 'recovered' ? '✓' : `${Math.round((c.odds || 0) * 100)}%`}
              </span>
              <span className="block text-[10px] text-white/40 mt-0.5">
                {c.status === 'recovered' ? 'recovered' : c.status === 'queued' ? 'queued' : `tick ${(c.tick ?? 0) + 1}`}
              </span>
            </span>
          </button>
        ))}
      </div>
    </Panel>
  );
};
