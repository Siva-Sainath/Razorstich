import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, ChevronRight, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTimeline } from '@/lib/timelineContext';
import { Panel } from './Panel';

export const PolicyBrainStrip = ({ className }) => {
  const { policy, activeEvent } = useTimeline();
  const thinking = activeEvent?.type === 'policy_eval';
  if (!policy) return null;

  return (
    <Panel
      title="Policy Brain · Q-Network v0.9.3"
      icon={BrainCircuit}
      testId="policy-brain"
      index="06"
      className={className}
      right={
        <div className="flex items-center gap-2">
          {thinking && (
            <motion.span
              className="font-mono text-[10px] text-cyan-300"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.4 }}
              data-testid="policy-thinking-indicator"
            >
              EVALUATING…
            </motion.span>
          )}
          <Badge className="bg-cyan-500/15 text-cyan-200 border border-cyan-400/20 font-mono text-[10px]">
            conf {Math.round(policy.confidence * 100)}%
          </Badge>
        </div>
      }
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={policy.t}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } }}
          exit={{ opacity: 0, x: -10, transition: { duration: 0.18 } }}
          className="flex flex-col lg:flex-row lg:items-center gap-4"
        >
          {/* state */}
          <div className="shrink-0 lg:w-[230px]" data-testid="policy-state">
            <div className="label-caps mb-2">Observed state</div>
            <div className="grid grid-cols-2 gap-1.5">
              {policy.stateFeatures.map((f) => (
                <div key={f.k} className="rounded-lg border border-white/[0.07] bg-black/25 px-2.5 py-1.5">
                  <div className="font-mono text-[9px] text-white/40 truncate">{f.k}</div>
                  <div className="font-mono text-[12px] text-white/85 truncate">{f.v}</div>
                </div>
              ))}
            </div>
          </div>

          <ChevronRight size={18} className="hidden lg:block text-white/25 shrink-0" aria-hidden="true" />

          {/* candidates */}
          <div className="flex-1 min-w-0">
            <div className="label-caps mb-2">Candidate actions · Q-values</div>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
              {policy.candidates.map((cand) => {
                const isChosen = cand.action === policy.chosen;
                return (
                  <div
                    key={cand.action}
                    data-testid={isChosen ? 'chosen-action' : 'candidate-action'}
                    className={`rounded-xl border px-3 py-2.5 relative overflow-hidden ${
                      isChosen
                        ? 'border-cyan-400/40 bg-cyan-500/[0.08]'
                        : 'border-white/[0.07] bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className={`font-mono text-[11px] font-semibold truncate ${isChosen ? 'text-cyan-200' : 'text-white/70'}`}>
                        {cand.action}
                      </span>
                      {isChosen && <Check size={12} className="text-cyan-300 shrink-0" aria-hidden="true" />}
                    </div>
                    <div className="mt-2 h-1 rounded-full bg-white/[0.07] overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${isChosen ? 'bg-cyan-400' : 'bg-white/30'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${cand.q * 100}%` }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    <div className="flex items-baseline justify-between mt-1.5">
                      <span className="font-mono text-[10px] text-white/45 truncate pr-1">{cand.note}</span>
                      <span className={`font-mono text-[11px] shrink-0 ${isChosen ? 'text-cyan-300' : 'text-white/55'}`}>
                        {cand.q.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </Panel>
  );
};
