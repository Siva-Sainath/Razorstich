import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/** Q-value / confidence bar for ranked actions. */
export const DecisionBar = ({
  label,
  width = 50,
  value,
  selected = false,
  blocked = false,
  hint,
  testId,
}) => (
  <div
    data-testid={testId}
    className={cn('flex items-center gap-3', blocked && 'opacity-40')}
  >
    <span
      className={cn(
        'font-mono type-meta w-[168px] shrink-0 truncate',
        selected ? 'text-primary font-semibold' : 'text-white/60'
      )}
    >
      {label}
    </span>
    <div className="flex-1 h-[6px] rounded-full bg-white/[0.06] overflow-hidden">
      <motion.div
        className={cn(
          'h-full rounded-full',
          selected ? 'bg-primary/90' : blocked ? 'bg-white/[0.12]' : 'bg-white/[0.22]'
        )}
        animate={{ width: `${width}%` }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
    {value != null && value !== '' && (
      <span
        className={cn(
          'font-mono type-micro w-[52px] text-right tabular-nums shrink-0',
          selected ? 'text-white/90' : 'text-white/40'
        )}
      >
        {value}
      </span>
    )}
    {hint && (
      <span className="type-micro text-white/35 w-[120px] shrink-0 truncate hidden xl:block">{hint}</span>
    )}
  </div>
);
