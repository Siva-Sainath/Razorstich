import React from 'react';

/** Shared content width — every marketing / research page. */
export const PAGE_CONTAINER = 'max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8';

export const PageSection = ({ children, className = '' }) => (
  <section className={`${PAGE_CONTAINER} py-12 sm:py-16 ${className}`}>{children}</section>
);

/**
 * Page hero — shared across marketing routes (compact variant for inner pages).
 */
export const PageHero = ({
  eyebrow,
  title,
  subtitle,
  children,
  className = '',
  centered = true,
  compact = false,
}) => (
  <header
    className={`relative z-10 ${PAGE_CONTAINER} border-b border-white/[0.05] ${
      compact ? 'pt-8 sm:pt-10 pb-8' : 'pt-10 sm:pt-14 pb-10 sm:pb-12'
    } ${centered ? 'text-center' : ''} ${className}`}
  >
    {eyebrow && (
      <p className="font-mono type-micro tracking-[0.14em] text-accent uppercase mb-3">{eyebrow}</p>
    )}
    {title && (
      <h1
        className={`font-semibold text-white/95 leading-[1.1] tracking-[-0.02em] ${
          compact
            ? 'type-section sm:text-2xl max-w-xl'
            : `font-display text-[clamp(2rem,5.5vw,3.25rem)] ${centered ? 'max-w-2xl mx-auto' : 'max-w-3xl'}`
        }`}
      >
        {title}
      </h1>
    )}
    {subtitle && (
      <p
        className={`type-body text-white/55 mt-4 max-w-lg leading-relaxed ${
          centered ? 'mx-auto' : ''
        } ${compact ? 'text-sm' : ''}`}
      >
        {subtitle}
      </p>
    )}
    {children}
  </header>
);
