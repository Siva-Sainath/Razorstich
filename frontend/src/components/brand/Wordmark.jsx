import React from 'react';

/** RazorStitch lockup — Blade-style, sentence case, calm confidence. */
export const Wordmark = ({ className = '' }) => (
  <div className={`select-none leading-none ${className}`} data-testid="brand-wordmark">
    <div className="text-[15px] font-semibold tracking-tight text-foreground">
      Razor<span className="text-primary">Stitch</span>
    </div>
    <div className="text-[10px] text-muted-foreground mt-[3px] font-medium">
      Payment recovery AI
    </div>
  </div>
);
