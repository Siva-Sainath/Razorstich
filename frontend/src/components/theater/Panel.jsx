import React from 'react';
import { motion } from 'framer-motion';

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

/** Inline dot + sentence-case text — the unified status treatment (no pills). */
export const StatusDot = ({ tone = 'bg-primary', children, testId, className = '' }) => (
  <span data-testid={testId} className={`inline-flex items-center gap-2 text-[12px] leading-4 text-white/70 ${className}`}>
    <span className={`inline-block h-1.5 w-1.5 rounded-full ${tone}`} aria-hidden="true" />
    {children}
  </span>
);

/**
 * Unified RazorSense panel shell.
 * variant="default": glass hairline. variant="focus": signature gradient hairline
 * (reserved for the hero, Policy Brain, AI next step and the dock).
 */
export const Panel = ({
  title,
  subtitle,
  right,
  children,
  className = '',
  testId,
  bodyClassName = '',
  variant = 'default',
  icon,
  index,
}) => {
  const shell =
    variant === 'focus'
      ? 'gradient-border glint-top backdrop-blur-2xl rounded-[24px] shadow-[var(--shadow-2)]'
      : 'glass-panel glint-top rounded-[24px]';
  return (
    <motion.section
      variants={panelVariants}
      data-testid={testId}
      className={`${shell} overflow-hidden flex flex-col p-6 ${className}`}
    >
      <header className="flex items-start justify-between gap-4 shrink-0">
        <div className="min-w-0">
          <h2 className="font-display text-[18px] leading-6 font-semibold text-white/90">{title}</h2>
          {subtitle && <p className="text-[12px] leading-4 text-white/55 mt-1.5">{subtitle}</p>}
        </div>
        {right}
      </header>
      <div className={`pt-4 flex-1 min-h-0 ${bodyClassName}`}>{children}</div>
    </motion.section>
  );
};
