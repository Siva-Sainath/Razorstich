import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/** Generative ambient light field — pure CSS gradient mesh with slow framer drift. */
export const AmbientLightField = () => {
  const reduce = useReducedMotion();
  const drift = reduce
    ? {}
    : {
        animate: {
          x: [0, 26, -18, 0],
          y: [0, 10, -14, 0],
          scale: [1, 1.04, 1.02, 1],
          opacity: [0.56, 0.66, 0.6, 0.62],
        },
        transition: {
          duration: 64,
          ease: [0.16, 1, 0.3, 1],
          repeat: Infinity,
          repeatType: 'mirror',
        },
      };

  return (
    <div className="rs-lightfield" aria-hidden="true">
      <motion.div className="rs-lightfield__mesh" {...drift} />
    </div>
  );
};
