import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Mic, MessageCircle } from 'lucide-react';
import { SmallestAiWidget } from '@/components/pricing/SmallestAiWidget';
import { ErrorBoundary } from '@/components/kit/ErrorBoundary';
import { PRICING_VOICE_PROMPTS } from '@/config/voiceAgent';
import { usePricingVoice } from '@/hooks/usePricingVoice';

export const PricingVoiceGuide = () => {
  const { status, widget, error } = usePricingVoice();

  const onWidgetReady = useCallback(() => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({ event: 'pricing_voice_widget_ready', page: '/pricing' });
    }
  }, []);

  return (
    <section
      className="mb-16 lg:mb-20 rounded-[24px] surface-1 p-6 sm:p-8 lg:p-10"
      data-testid="pricing-voice-guide"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-8 lg:gap-10 items-start">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1 mb-4">
            <Mic className="w-3.5 h-3.5 text-accent" aria-hidden />
            <span className="type-micro text-white/55">Live voice guide</span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white/92 leading-tight">
            Not sure which plan fits?
            <span className="block text-white/55 font-normal text-xl sm:text-2xl mt-1">Ask our pricing guide.</span>
          </h2>

          <p className="type-body text-white/50 mt-4 leading-relaxed max-w-md">
            Speak or type to compare Sandbox, Growth, and Enterprise, understand success fees, and get a pilot
            recommendation. Prompt syncs from this site on each visit.
          </p>

          {status === 'syncing' && (
            <p className="type-micro text-primary/80 mt-3">Syncing agent prompt to Smallest AI…</p>
          )}
          {error && (
            <p className="type-micro text-warning/90 mt-3">
              Voice sync: {error}. Widget may still load with last published prompt.
            </p>
          )}

          <div className="mt-6">
            <p className="type-micro text-white/40 mb-3 flex items-center gap-2">
              <MessageCircle className="w-3.5 h-3.5" aria-hidden />
              Try asking
            </p>
            <ul className="space-y-2">
              {PRICING_VOICE_PROMPTS.map((prompt) => (
                <li
                  key={prompt}
                  className="type-meta text-white/55 rounded-[16px] surface-inset px-3.5 py-2.5 leading-snug"
                >
                  “{prompt}”
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-3 mt-8">
            <Link to="/start?plan=growth" className="btn-primary inline-flex items-center px-5 text-sm h-10">
              Skip to pilot form
            </Link>
            <Link to="/checkout" className="btn-quiet inline-flex items-center px-5 text-sm h-10">
              Try demo first
            </Link>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <p className="type-micro text-white/40 mb-4">Start a conversation →</p>
          <ErrorBoundary message="Voice guide unavailable.">
            <SmallestAiWidget
              widgetConfig={widget}
              className="w-full"
              onReady={onWidgetReady}
            />
          </ErrorBoundary>
          <p className="type-micro text-white/35 mt-4">
            Prefer email?{' '}
            <Link to="/start" className="text-primary/80 hover:text-primary">
              Request Growth access
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};
