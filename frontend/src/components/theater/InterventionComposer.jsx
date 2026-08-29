import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, MessageCircle, MessageSquareText, Cog, BadgePercent, Clock3 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTimeline } from '@/lib/timelineContext';
import { Panel } from './Panel';

const CHANNEL_ICON = { WhatsApp: MessageCircle, SMS: MessageSquareText, Internal: Cog };

export const InterventionComposer = ({ className }) => {
  const { intervention, policy } = useTimeline();
  if (!intervention) return null;
  const Icon = CHANNEL_ICON[intervention.channel] || Cog;
  const confidence = Math.round((intervention.confidence || 0) * 100);

  return (
    <Panel
      title="Intervention Composer"
      icon={Wand2}
      testId="intervention-composer"
      index="08"
      className={className}
      right={
        <Badge className="bg-cyan-500/15 text-cyan-200 border border-cyan-400/20 font-mono text-[10px]">
          AGENT DRAFTED
        </Badge>
      }
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={intervention.action}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }}
          exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div data-testid="agent-chosen-action" className="font-mono text-[15px] font-semibold text-cyan-200">
              {intervention.action}
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-white/[0.06] text-white/75 border border-white/10 font-mono text-[10px]">
                <Icon size={10} className="mr-1" aria-hidden="true" /> {intervention.channel}
              </Badge>
              <Badge className="bg-white/[0.06] text-white/75 border border-white/10 font-mono text-[10px]">
                <Clock3 size={10} className="mr-1" aria-hidden="true" /> {intervention.timing}
              </Badge>
            </div>
          </div>

          <div className="mt-3.5 rounded-xl border border-white/10 bg-black/25 p-3.5">
            <div className="label-caps mb-2">Message payload</div>
            <p data-testid="intervention-message" className="text-[13px] leading-relaxed text-white/80">
              {intervention.message}
            </p>
          </div>

          {intervention.incentive && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-500/[0.08] px-3 py-2">
              <BadgePercent size={13} className="text-amber-300" aria-hidden="true" />
              <span data-testid="intervention-incentive" className="font-mono text-[11px] text-amber-200">
                {intervention.incentive}
              </span>
              <span className="font-mono text-[10px] text-white/40 ml-auto">cap ₹60</span>
            </div>
          )}

          <div className="mt-4">
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="label-caps">Agent confidence</span>
              <span data-testid="agent-confidence" className="font-mono text-[13px] text-cyan-200">
                {confidence}%
              </span>
            </div>
            <Progress value={confidence} className="h-1.5 bg-white/[0.07]" />
            {policy && (
              <p className="font-mono text-[10px] text-white/40 mt-1.5">
                argmax Q over {policy.candidates.length} candidates · snapshot t={policy.t}
              </p>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              data-testid="approve-intervention-btn"
              size="sm"
              onClick={() =>
                toast.success('Intervention approved', {
                  description: `${intervention.action} · ${intervention.channel} · dispatched by policy v0.9.3`,
                })
              }
              className="rounded-xl bg-cyan-400/15 hover:bg-cyan-400/25 border border-cyan-400/25 text-cyan-100 focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              Approve
            </Button>
            <Button
              data-testid="override-intervention-btn"
              size="sm"
              variant="ghost"
              onClick={() =>
                toast('Override requested', {
                  description: 'Manual override queued for operator review.',
                })
              }
              className="rounded-xl text-white/65 hover:text-white/90 hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              Override
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </Panel>
  );
};
