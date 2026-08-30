import React from 'react';
import { cn } from '@/lib/utils';

/** Numbered figure shell — RazorStitch glass treatment. */
export const ResearchFigure = ({
  figure = 'FIG.1',
  title,
  subtitle,
  caption,
  children,
  className = '',
  testId,
  wide = false,
  dense = false,
}) => (
  <section
    data-testid={testId}
    className={cn(
      'rounded-[24px] border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden',
      wide ? 'lg:col-span-2' : '',
      className
    )}
  >
    <div
      className={cn(
        'px-5 sm:px-6 border-b border-white/[0.06] flex flex-wrap items-start justify-between gap-3',
        dense ? 'pt-4 pb-3' : 'pt-5 pb-4'
      )}
    >
      <div className="min-w-0">
        <p className="font-mono type-micro tracking-[0.12em] text-white/35 uppercase">{figure}</p>
        {title && <h3 className="type-panel-title mt-1">{title}</h3>}
        {subtitle && <p className="type-meta mt-1 text-white/50 max-w-2xl">{subtitle}</p>}
      </div>
    </div>
    <div className={cn('px-5 sm:px-6', dense ? 'py-3' : 'py-5')}>{children}</div>
    {caption && (
      <p
        className={cn(
          'px-5 sm:px-6 type-meta leading-relaxed text-white/45 border-t border-white/[0.06] pt-3 mx-0',
          dense ? 'pb-3' : 'pb-5'
        )}
      >
        {caption}
      </p>
    )}
  </section>
);
