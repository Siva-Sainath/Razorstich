import React from 'react';
import { cn } from '@/lib/utils';

/** Quiet zone divider — separates semantic sections with a mono label + hairline. */
export const SectionDivider = ({ label, className = '' }) => (
  <div className={cn('flex items-center gap-4 px-1', className)}>
    <span className="type-micro font-mono text-white/30 uppercase tracking-wider whitespace-nowrap">
      {label}
    </span>
    <div className="flex-1 h-px bg-white/[0.06]" />
  </div>
);
