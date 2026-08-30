import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTimeline, API } from '@/lib/timelineContext';
import { Panel, StatusDot } from './Panel';
import { RevenueRecoverySpark } from '@/components/svg/RevenueRecoverySpark';

const STATUS_DOT = {
  recovering: 'bg-primary/80',
  queued: 'bg-white/30',
  recovered: 'bg-[rgba(45,212,191,0.85)]',
};

const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

export const CaseQueue = ({ className }) => {
  const { recoveryProb, recovered, tick, caseData, loadCase } = useTimeline();
  const [cases, setCases] = useState(null);
  const [queueError, setQueueError] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const currentId = caseData?.case?.id;

  useEffect(() => {
    if (!currentId) return undefined;
    let cancelled = false;
    setQueueError(null);
    axios
      .get(`${API}/cases/queue`, { params: { current: currentId }, timeout: 30000 })
      .then((r) => {
        if (!cancelled) setCases(r.data.cases);
      })
      .catch((err) => {
        if (!cancelled) {
          setQueueError(err.response?.data?.detail || err.message || 'Queue unavailable');
          setCases([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [currentId]);

  const rows = (cases || []).map((c) =>
    c.id === currentId
      ? { ...c, odds: recoveryProb, tick, status: recovered ? 'recovered' : 'recovering', isCurrent: true }
      : { ...c, isCurrent: false }
  );

  const handleSelect = (c) => {
    if (c.isCurrent || loadingId) return;
    setLoadingId(c.id);
    loadCase(c.id)
      .catch(() => {})
      .finally(() => setLoadingId(null));
  };

  return (
    <Panel
      title="Recovery queue"
      subtitle="Validation scenarios across four DQN agents"
      testId="case-queue"
      className={className}
      variant="quiet"
      bodyClassName="pt-2 px-0"
      right={
        <span className="font-mono type-micro tabular-nums shrink-0">
          {rows.length} cases
        </span>
      }
    >
      {queueError && (
        <p className="type-meta text-warning/90 mb-3 px-1">{queueError}</p>
      )}
      <div className="max-h-[min(380px,55vh)] overflow-y-auto">
        {cases === null && (
          <p className="type-meta text-white/40 py-6 text-center">Loading queue…</p>
        )}
        {rows.map((c) => (
          <button
            key={c.id}
            type="button"
            data-testid={c.isCurrent ? 'queue-case-current' : 'queue-case-row'}
            disabled={Boolean(loadingId) && !c.isCurrent}
            onClick={() => handleSelect(c)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-white/[0.06] last:border-b-0 transition-colors duration-150 ${
              c.isCurrent ? 'bg-white/[0.05]' : 'hover:bg-white/[0.03]'
            } ${loadingId === c.id ? 'opacity-60' : ''}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_DOT[c.status] || 'bg-white/30'}`} aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 flex-wrap">
                <span className={`font-mono type-micro ${c.isCurrent ? 'text-primary' : 'text-white/70'}`}>{c.id}</span>
              </span>
              <span className="block type-meta truncate mt-1">
                {c.customer} · {inr(c.amount)} · {c.method}
              </span>
            </span>
            <span className="text-right shrink-0 flex flex-col items-end gap-1">
              <RevenueRecoverySpark
                values={[0.12, 0.2, c.odds || 0.25, c.odds || 0.3, c.status === 'recovered' ? 0.95 : c.odds || 0.35]}
                width={56}
                height={22}
              />
              <span className="font-mono type-micro tabular-nums text-white/80">
                {c.status === 'recovered' ? '✓' : `${Math.round((c.odds || 0) * 100)}%`}
              </span>
            </span>
          </button>
        ))}
      </div>
    </Panel>
  );
};
