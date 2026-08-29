import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogoMark } from './LogoMark';

const LINES = [
  'M.O.T. CONSOLE v0.9.3 · POWER ON',
  'STERILIZING INSTRUMENTS … OK',
  'CALIBRATING POLICY BRAIN … Q-NET v0.9.3 LOADED',
  'PATIENT INTAKE · pay_NxT4bKQ2mYfA8c · ₹2,499.00',
];

/**
 * Boot / sterilization intro — powers on the OR console.
 * Skipped entirely under prefers-reduced-motion.
 */
export const SterilizeIntro = () => {
  const [done, setDone] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (done) return undefined;
    const id = setTimeout(() => setDone(true), 2100);
    return () => clearTimeout(id);
  }, [done]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.45, ease: 'easeInOut' } }}
          className="fixed inset-0 z-[400] bg-[hsl(210_25%_4%)] flex flex-col items-center justify-center gap-6"
          data-testid="boot-intro"
          aria-hidden="true"
        >
          <LogoMark size={52} />
          <div className="w-[300px]">
            <div className="space-y-1.5 mb-5 min-h-[68px]">
              {LINES.map((line, i) => (
                <motion.p
                  key={line}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 + i * 0.38, duration: 0.18 }}
                  className="font-mono text-[10px] tracking-[0.14em] text-white/55"
                >
                  <span className="text-emerald-400/80 mr-2">▸</span>
                  {line}
                </motion.p>
              ))}
            </div>
            <div className="h-[2px] bg-white/[0.08] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-cyan-400/80 origin-left"
                style={{ boxShadow: '0 0 12px rgba(34,211,238,0.6)' }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.7, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
