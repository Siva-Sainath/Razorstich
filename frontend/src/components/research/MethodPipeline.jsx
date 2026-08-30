import React from 'react';
import { motion } from 'framer-motion';
import { METHODOLOGY_LAYERS } from '@/config/trainingNarrative';

export const MethodPipeline = ({ className = '' }) => (
  <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 ${className}`} data-testid="method-pipeline">
    {METHODOLOGY_LAYERS.map((layer, i) => (
      <motion.div
        key={layer.step}
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.06, duration: 0.4 }}
        className="rounded-[18px] border border-white/[0.08] bg-white/[0.03] p-4 relative overflow-hidden group hover:border-white/15 transition-colors"
      >
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{
            background: 'radial-gradient(600px circle at 50% 0%, rgba(43,138,247,0.08), transparent 60%)',
          }}
        />
        <p className="font-mono type-micro text-primary/80">{layer.step}</p>
        <p className="type-section mt-2 text-white/88">{layer.label}</p>
        <p className="type-meta mt-2 text-white/50 leading-snug">{layer.detail}</p>
        <p className="type-micro font-mono text-white/30 mt-3 truncate">{layer.artifact}</p>
        {i < METHODOLOGY_LAYERS.length - 1 && (
          <span
            className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 text-white/20 type-micro"
            aria-hidden="true"
          >
            →
          </span>
        )}
      </motion.div>
    ))}
  </div>
);
