import React, { useState } from 'react';
import { motion } from 'framer-motion';

const SNIPPETS = {
  install: `curl -fsSL https://api.razorstitch.dev/install.sh | sh`,
  webhook: `POST /api/webhooks/razorpay
→ wedge router → Dueling DDQN → masked argmax
→ recovery action → Razorpay payment link`,
  policy: `curl -X POST https://api.razorstitch.dev/v1/policy/recommend \\
  -H "Authorization: Bearer rs_live_..." \\
  -d '{
    "wedge": "checkout_failed",
    "failure_reason": "upi_timeout",
    "hours_since_failure": 6,
    "amount_inr": 1499,
    "method": "upi"
  }'`,
};

/** Prime Intellect-style install / API snippet block */
export const InstallSnippet = ({ variant = 'policy' }) => {
  const [copied, setCopied] = useState(false);
  const text = SNIPPETS[variant] || SNIPPETS.policy;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[16px] border border-white/[0.1] bg-[#0a1218] overflow-hidden font-mono text-[11px] sm:text-xs leading-relaxed"
      data-testid="install-snippet"
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
        </div>
        <button
          type="button"
          onClick={copy}
          className="type-micro text-white/45 hover:text-white/70 transition-colors px-2 py-0.5"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 sm:p-5 text-white/70 overflow-x-auto whitespace-pre-wrap break-all">
        <code>{text}</code>
      </pre>
    </motion.div>
  );
};
