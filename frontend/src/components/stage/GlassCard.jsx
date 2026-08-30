import React from 'react';
import { motion } from 'framer-motion';

/** Quiet source line — optional, sentence case. */
export const ProvenanceBadge = ({ source, className = '' }) => (
  <p className={`type-micro text-white/40 truncate ${className}`}>{source}</p>
);

/**
 * Calm metric shell — glass-panel on deep-ink (design_guidelines).
 * No per-wedge colored rims, no icon boxes, no pulse glow.
 */
export const GlassCard = ({
  title,
  subtitle,
  figure,
  children,
  className = '',
  testId,
  provenance,
  delay = 0,
  variant: _variant,
  pulse: _pulse,
  icon: _icon,
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={{ duration: 0.28, delay, ease: [0.16, 1, 0.3, 1] }}
    data-testid={testId}
    className={`glass-panel rounded-[20px] p-4 sm:p-5 ${className}`}
  >
    {(figure || title || subtitle) && (
      <header className="mb-3">
        {figure && <p className="type-micro text-white/40 mb-1">{figure}</p>}
        {title && <h3 className="type-panel-title text-white/90">{title}</h3>}
        {subtitle && <p className="type-meta text-white/55 mt-1 leading-snug">{subtitle}</p>}
      </header>
    )}
    {provenance && <ProvenanceBadge source={provenance} className="mb-3" />}
    {children}
  </motion.div>
);
