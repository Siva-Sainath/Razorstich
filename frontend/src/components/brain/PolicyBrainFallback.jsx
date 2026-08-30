import React from 'react';
import { cn } from '@/lib/utils';
import { POLICY_NODES } from './policyBrainNodes';

/** Lightweight 2D fallback when WebGL / R3F fails. */
export const PolicyBrainFallback = ({
  pipelineStep = 0,
  thinking = false,
  selectedAction = '',
  height = 340,
  className = '',
}) => {
  const active = Math.min(pipelineStep, POLICY_NODES.length - 1);

  return (
    <div
      className={cn(
        'relative w-full rounded-[20px] border border-white/[0.08] bg-[hsl(218_55%_5%/0.92)] overflow-hidden',
        className
      )}
      style={{ height, minHeight: height }}
      data-testid="policy-brain-fallback"
    >
      <div className="absolute inset-0 opacity-[0.12] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 p-8 h-full">
        {POLICY_NODES.map((node, i) => {
          const status = i < active ? 'passed' : i === active ? (thinking ? 'active' : 'current') : 'idle';
          return (
            <div
              key={node.id}
              className={cn(
                'rounded-xl border px-3 py-2 text-center min-w-[88px]',
                status === 'passed' && 'border-[rgba(45,212,191,0.45)] bg-[rgba(45,212,191,0.08)]',
                status === 'active' && 'border-primary/55 bg-primary/10 shadow-[0_0_20px_rgba(43,138,247,0.2)]',
                status === 'current' && 'border-white/20 bg-white/[0.04]',
                status === 'idle' && 'border-white/10 bg-white/[0.02] opacity-50'
              )}
            >
              <p className="type-micro font-semibold text-white/85">{node.label}</p>
              <p className="type-micro font-mono text-white/40">{node.region}</p>
            </div>
          );
        })}
      </div>
      <p className="absolute bottom-3 left-4 type-micro font-mono text-white/35">
        3D cortex unavailable · {thinking ? 'evaluating…' : selectedAction || 'standby'}
      </p>
    </div>
  );
};
