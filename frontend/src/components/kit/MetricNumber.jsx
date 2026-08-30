import React from 'react';
import { cn } from '@/lib/utils';

/** Financial / instrument numerals — mono, tabular, consistent hierarchy. */
export const MetricNumber = ({
  children,
  size = 'md',
  tone = 'default',
  className = '',
  testId,
  as: Tag = 'span',
}) => {
  const sizes = {
    hero: 'text-4xl sm:text-5xl font-semibold leading-none tracking-[-0.02em]',
    lg: 'text-2xl font-semibold leading-none tracking-[-0.01em]',
    md: 'type-metric font-semibold leading-none',
    sm: 'type-body font-medium leading-none',
    xs: 'type-meta font-medium leading-none',
  };
  const tones = {
    default: 'text-white/90',
    primary: 'text-primary',
    accent: 'text-accent',
    teal: 'text-accent',
    muted: 'text-white/65',
  };
  return (
    <Tag
      data-testid={testId}
      className={cn('font-mono tabular-nums', sizes[size], tones[tone], className)}
    >
      {children}
    </Tag>
  );
};
