import React from 'react';
import { cn } from '@/lib/utils';

/** AutoGo-style numbered figure shell — RazorStitch glass treatment. */
export const ResearchFigure = ({
  figure = 'FIG.1',
  title,
  subtitle,
  caption,
  children,
  className = '',
  testId,
  wide = false,
}) => (
  <section
    data-testid={testId}
    className={cn(
      'rounded-[24px] border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden',
      wide ? 'lg:col-span-2' : '',
      className
    )}
  >
    <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-white/[0.06] flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-mono type-micro tracking-[0.12em] text-white/35 uppercase">{figure}</p>
        {title && <h3 className="type-panel-title mt-1">{title}</h3>}
        {subtitle && <p className="type-meta mt-1 text-white/50 max-w-2xl">{subtitle}</p>}
      </div>
    </div>
    <div className="px-5 sm:px-6 py-5">{children}</div>
    {caption && (
      <p className="px-5 sm:px-6 pb-5 type-meta leading-relaxed text-white/45 border-t border-white/[0.06] pt-4 mx-0">
        {caption}
      </p>
    )}
  </section>
);
