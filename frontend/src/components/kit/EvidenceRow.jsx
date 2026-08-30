import React from 'react';
import { cn } from '@/lib/utils';

/** Guardrail / queue / proof row — dot + sentence-case text. */
export const EvidenceRow = ({
  tone = 'bg-primary/80',
  label,
  detail,
  mono,
  className = '',
  testId,
}) => (
  <div
    data-testid={testId}
    className={cn('flex items-start gap-2.5 type-meta leading-relaxed text-white/65', className)}
  >
    <span className={cn('mt-[5px] inline-block h-1.5 w-1.5 rounded-full shrink-0', tone)} aria-hidden="true" />
    <span className="min-w-0">
      {label && <span className="font-mono type-micro text-white/50">{label}</span>}
      {label && detail && <span className="mx-2 text-white/25">·</span>}
      {detail && <span>{detail}</span>}
      {mono && (
        <span className="block font-mono type-micro text-white/45 tabular-nums mt-1">{mono}</span>
      )}
    </span>
  </div>
);
