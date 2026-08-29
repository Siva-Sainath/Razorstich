import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogoMark } from './LogoMark';

/** Fast, quiet boot moment (<=900ms). Skipped under prefers-reduced-motion. */
export const SterilizeIntro = () => {
  const [done, setDone] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (done) return undefined;
    const id = setTimeout(() => setDone(true), 900);
    return () => clearTimeout(id);
  }, [done]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.32, ease: 'easeInOut' } }}
          className="fixed inset-0 z-[400] bg-background flex flex-col items-center justify-center gap-4"
          data-testid="boot-intro"
          aria-hidden="true"
        >
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-3"
          >
            <LogoMark size={40} />
            <span className="font-display text-2xl font-semibold text-white/90">
              Razor<span className="text-primary">Stitch</span>
            </span>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="font-mono text-[12px] text-white/45"
          >
            Initializing timeline…
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
