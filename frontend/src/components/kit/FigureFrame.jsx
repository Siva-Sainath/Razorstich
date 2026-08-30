import React from 'react';
import { cn } from '@/lib/utils';

/** Prime-Intellect-style labeled figure shell for authored SVGs. */
export const FigureFrame = ({
  figure = 'FIG.1',
  caption,
  children,
  className = '',
  testId,
  compact = false,
}) => (
  <figure
    data-testid={testId}
    className={cn(
      'relative surface-inset overflow-hidden',
      compact ? 'p-3' : 'p-4',
      className
    )}
  >
    {figure ? (
      <div className="absolute top-3 left-3 font-mono type-micro tracking-[0.08em] text-white/35 uppercase">
        {figure}
      </div>
    ) : null}
    <div className={cn('w-full', figure ? (compact ? 'pt-4' : 'pt-5') : '')}>{children}</div>
    {caption && (
      <figcaption className="mt-3 type-meta leading-relaxed text-white/50 border-t border-white/[0.06] pt-3">
        {caption}
      </figcaption>
    )}
  </figure>
);
