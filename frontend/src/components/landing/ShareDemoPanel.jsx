import React, { useState } from 'react';
import { demoShareUrl, shareTweetUrl, shareLinkedInUrl, getReferralCode } from '@/lib/gtm';
import { RECOVERY_LANES } from '@/config/recoveryScenarios';

/** Viral loop — copy demo link with ref code, share to social. */
export const ShareDemoPanel = ({ className = '', defaultPath = '/checkout' }) => {
  const [copied, setCopied] = useState(false);
  const [activePath, setActivePath] = useState(defaultPath);
  const url = demoShareUrl(activePath);
  const ref = getReferralCode();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className={`rounded-[16px] border border-white/[0.08] bg-white/[0.02] p-4 ${className}`} data-testid="share-demo-panel">
      <p className="type-section text-white/85">Share the demo — move up the pilot queue</p>
      <p className="type-meta text-white/45 mt-1 mb-3">
        Your link tracks referrals. When someone tries the demo from your link, you get priority onboarding.
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        {RECOVERY_LANES.map((lane) => (
          <button
            key={lane.path}
            type="button"
            onClick={() => setActivePath(lane.path)}
            className={`btn-quiet h-8 px-3 text-xs ${activePath === lane.path ? 'border-primary/40 text-primary/90' : ''}`}
          >
            {lane.short}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <code className="flex-1 min-w-[200px] type-micro font-mono text-white/50 bg-black/40 rounded-lg px-3 py-2 truncate">
          {url}
        </code>
        <button type="button" onClick={copy} className="btn-quiet h-9 px-4 shrink-0">
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <a
          href={shareTweetUrl(activePath)}
          target="_blank"
          rel="noreferrer"
          className="btn-quiet h-9 px-4 inline-flex items-center text-xs"
        >
          Post on X
        </a>
        <a
          href={shareLinkedInUrl(activePath)}
          target="_blank"
          rel="noreferrer"
          className="btn-quiet h-9 px-4 inline-flex items-center text-xs"
        >
          Share on LinkedIn
        </a>
      </div>
      <p className="type-micro text-white/30 mt-2 font-mono">ref · {ref}</p>
    </div>
  );
};
