import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export const panelVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] },
  },
};

export const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

export const SEV_STYLES = {
  ok: 'bg-[rgba(45,212,191,0.9)]',
  info: 'bg-primary',
  warn: 'bg-warning',
  fail: 'bg-destructive',
};

/** Inline dot + sentence-case text — unified status treatment. */
export const StatusDot = ({ tone = 'bg-primary', children, testId, className = '' }) => (
  <span data-testid={testId} className={cn('inline-flex items-center gap-2 type-meta text-white/70', className)}>
    <span className={cn('inline-block h-1.5 w-1.5 rounded-full', tone)} aria-hidden="true" />
    {children}
  </span>
);

const VARIANT_SHELL = {
  hero: 'gradient-border glint-top backdrop-blur-2xl rounded-[24px] shadow-[var(--shadow-2)] p-8',
  primary: 'gradient-border glint-top backdrop-blur-2xl rounded-[24px] shadow-[var(--shadow-2)] p-6',
  standard: 'glass-panel glint-top rounded-[24px] p-6 panel-hover-lift',
  inset: 'surface-inset rounded-[16px] p-4',
  quiet: 'rounded-[24px] surface-1 p-6',
};

/**
 * Unified RazorStitch panel shell.
 * variant: hero | primary | standard | inset | quiet
 */
export const Panel = ({
  title,
  subtitle,
  right,
  children,
  className = '',
  testId,
  bodyClassName = '',
  variant = 'standard',
  icon,
  index,
  figure,
}) => {
  const shell = VARIANT_SHELL[variant] || VARIANT_SHELL.standard;
  const isFocus = variant === 'hero' || variant === 'primary';

  return (
    <motion.section
      variants={panelVariants}
      data-testid={testId}
      className={cn(shell, 'overflow-hidden flex flex-col', className)}
    >
      {(title || right || figure) && (
        <header className="flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            {figure && (
              <span className="font-mono type-micro tracking-[0.1em] text-white/35 uppercase block mb-2">
                {figure}
              </span>
            )}
            {title && (
              <h2 className={cn(isFocus ? 'type-panel-title' : 'type-section')}>{title}</h2>
            )}
            {subtitle && <p className="type-meta mt-1.5 max-w-[52ch]">{subtitle}</p>}
          </div>
          {right}
        </header>
      )}
      <div className={cn('pt-4 flex-1 min-h-0', bodyClassName)}>{children}</div>
    </motion.section>
  );
};
