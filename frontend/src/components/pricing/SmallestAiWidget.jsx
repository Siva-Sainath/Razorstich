import React, { useEffect, useRef, useState } from 'react';

const SCRIPT_ID = 'smallest-ai-atoms-widget';

function loadWidgetScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Widget script failed')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error('Widget script failed'));
    document.body.appendChild(script);
  });
}

function mountWidget(host, widgetConfig) {
  if (!host || !widgetConfig?.agentId) return;
  host.innerHTML = '';
  const widget = document.createElement('atoms-widget');
  widget.setAttribute('assistant-id', widgetConfig.agentId);
  widget.setAttribute('widget-name', widgetConfig.widgetName || 'RazorStitch Pricing');
  widget.setAttribute('cta-name', widgetConfig.ctaName || 'Talk to pricing guide');
  widget.setAttribute('start-button-text', widgetConfig.startButtonText || 'Start voice chat');
  widget.setAttribute('end-button-text', widgetConfig.endButtonText || 'End');
  widget.setAttribute('chat-placeholder', widgetConfig.chatPlaceholder || 'Ask about pricing…');
  host.appendChild(widget);
}

/**
 * Smallest AI Atoms embed — config from /api/voice/pricing/config after sync.
 */
export const SmallestAiWidget = ({
  widgetConfig,
  className = '',
  onReady,
  onError,
}) => {
  const hostRef = useRef(null);
  const [status, setStatus] = useState('waiting');

  useEffect(() => {
    if (!widgetConfig?.agentId) {
      setStatus('unconfigured');
      return undefined;
    }

    let cancelled = false;
    const host = hostRef.current;
    if (!host) return undefined;

    setStatus('loading');
    const script = widgetConfig.widgetScript || 'https://unpkg.com/atoms-widget-core@latest/dist/embed/widget.umd.js';

    loadWidgetScript(script)
      .then(() => {
        if (cancelled || !hostRef.current) return;
        mountWidget(hostRef.current, widgetConfig);
        setStatus('ready');
        onReady?.();
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus('error');
        onError?.(err);
      });

    return () => {
      cancelled = true;
      if (host) host.innerHTML = '';
    };
  }, [widgetConfig, onReady, onError]);

  if (!widgetConfig?.agentId) {
    return (
      <div
        className={`flex flex-col items-center justify-center min-h-[280px] rounded-[20px] border border-dashed border-white/15 bg-black/20 p-6 text-center ${className}`}
        data-testid="smallest-ai-widget-unconfigured"
      >
        <p className="type-section text-white/70">Connecting voice guide…</p>
        <p className="type-meta text-white/45 mt-2">Start the backend with SMALLEST_AI_API_KEY set.</p>
      </div>
    );
  }

  return (
    <div className={`relative min-h-[320px] ${className}`} data-testid="smallest-ai-widget-host">
      {(status === 'waiting' || status === 'loading') && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[20px] border border-white/[0.08] glass-panel">
          <p className="type-meta text-white/55 animate-pulse">Loading voice guide…</p>
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[20px] border border-warning/25 bg-warning/5 p-6 text-center">
          <p className="type-meta text-white/55">
            Voice widget could not load. Check backend sync and Smallest AI agent allowlist for this domain.
          </p>
        </div>
      )}
      <div ref={hostRef} className="min-h-[320px] w-full" />
    </div>
  );
};
