import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { LogoMark } from './LogoMark';

const INTRO_MS = 700;

/** Fast boot splash — once per session. */
export const SterilizeIntro = () => {
  const reduce = useReducedMotion();
  const [done, setDone] = useState(() => {
    if (typeof window === 'undefined') return true;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return true;
    return sessionStorage.getItem('rs-intro-seen') === '1';
  });

  useEffect(() => {
    if (done) return undefined;
    const id = setTimeout(() => {
      sessionStorage.setItem('rs-intro-seen', '1');
      setDone(true);
    }, reduce ? 0 : INTRO_MS);
    return () => clearTimeout(id);
  }, [done, reduce]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.32, ease: 'easeInOut' } }}
          className="fixed inset-0 z-[400] bg-background flex flex-col items-center justify-center gap-4 px-6"
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
            transition={{ delay: 0.12, duration: 0.28 }}
            className="font-mono type-meta text-white/45"
          >
            Loading recovery theater…
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
