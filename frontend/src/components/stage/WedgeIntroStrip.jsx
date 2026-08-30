import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { WEDGE_BY_ID } from '@/config/wedges';
import { WEDGE_PITCH } from '@/config/pitchNarrative';

export const WedgeIntroStrip = ({ wedge, visible }) => {
  const lane = WEDGE_BY_ID[wedge];
  const pitch = WEDGE_PITCH[wedge];
  if (!lane || !visible || !pitch) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="shrink-0 overflow-hidden"
      data-testid="wedge-intro-strip"
    >
      <div className="rounded-[16px] border border-white/[0.1] bg-white/[0.03] px-4 py-3 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="type-micro text-primary/90 font-medium">{pitch.agent}</p>
          <p className="type-body text-white/75 mt-0.5 leading-snug">{pitch.mission}</p>
          <p className="type-meta text-white/45 mt-1">{pitch.handles} · {pitch.window}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <Link to="/research" className="type-micro text-primary/70 hover:text-primary hidden sm:inline">
            How we trained it →
          </Link>
          <HorizonBar windowLabel={lane.windowLabel} accent={lane.accent} />
          <span className="type-micro font-mono text-white/40">{lane.windowLabel}</span>
        </div>
      </div>
    </motion.div>
  );
};

const accentGrad = {
  checkout: 'from-primary/80 to-primary/30',
  cart: 'from-warning/80 to-warning/30',
  subscription: 'from-violet-400/80 to-violet-400/30',
  invoice: 'from-teal-400/80 to-teal-400/30',
};

function HorizonBar({ windowLabel, accent }) {
  return (
    <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
      <motion.div
        className={`h-full rounded-full bg-gradient-to-r ${accentGrad[accent] || accentGrad.checkout}`}
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
