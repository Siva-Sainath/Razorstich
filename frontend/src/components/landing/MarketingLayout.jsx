import React from 'react';

/** Shared content width — every marketing / research page. */
export const PAGE_CONTAINER = 'max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8';

export const PageSection = ({ children, className = '' }) => (
  <section className={`${PAGE_CONTAINER} py-12 sm:py-16 ${className}`}>{children}</section>
);

/**
 * Centered page hero — Glide-style structure on dark shell (no extra beam layers).
 */
export const PageHero = ({
  eyebrow,
  title,
  subtitle,
  children,
  className = '',
  centered = true,
}) => (
  <header
    className={`relative z-10 ${PAGE_CONTAINER} pt-10 sm:pt-14 pb-10 sm:pb-12 border-b border-white/[0.05] ${
      centered ? 'text-center' : ''
    } ${className}`}
  >
    {eyebrow && (
      <p className="font-mono type-micro tracking-[0.14em] text-accent uppercase mb-4">{eyebrow}</p>
    )}
    {title && (
      <h1
        className={`font-display text-[clamp(2rem,5.5vw,3.25rem)] font-semibold text-white/95 leading-[1.08] tracking-[-0.02em] ${
          centered ? 'max-w-2xl mx-auto' : 'max-w-3xl'
        }`}
      >
        {title}
      </h1>
    )}
    {subtitle && (
      <p
        className={`type-body text-white/55 mt-5 max-w-lg leading-relaxed ${
          centered ? 'mx-auto' : ''
        }`}
      >
        {subtitle}
      </p>
    )}
    {children}
  </header>
);
