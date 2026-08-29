import React from 'react';

/**
 * Two-line brand lockup: MIDNIGHT (mono caps) over OPERATING THEATER (serif),
 * separated by a thin ECG baseline.
 */
export const Wordmark = ({ className = '' }) => (
  <div className={`select-none ${className}`} data-testid="brand-wordmark">
    <div className="font-mono text-[8.5px] tracking-[0.42em] text-cyan-300/70 leading-none">
      MIDNIGHT
    </div>
    <svg width="128" height="5" viewBox="0 0 128 5" className="my-[3px] opacity-60" aria-hidden="true">
      <path
        d="M0 2.5 H46 L50 0.5 L54 4.5 L58 2.5 H128"
        stroke="rgba(52,211,153,0.7)"
        strokeWidth="1"
        fill="none"
      />
    </svg>
    <div className="font-display text-[13px] font-semibold tracking-[0.02em] text-white/90 leading-none">
      Operating Theater
    </div>
  </div>
);
