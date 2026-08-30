import React from 'react';

/** RazorStitch lockup — Blade-style, sentence case, calm confidence. */
export const Wordmark = ({ className = '' }) => (
  <div className={`select-none leading-none ${className}`} data-testid="brand-wordmark">
    <div className="type-body font-semibold tracking-tight text-foreground">
      Razor<span className="text-primary">Stitch</span>
    </div>
    <p className="type-micro text-muted-foreground mt-[3px]">
      Payment recovery AI
    </p>
  </div>
);
