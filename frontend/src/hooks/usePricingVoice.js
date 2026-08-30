import { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '@/lib/timelineContext';
import voiceConfig from '@/config/pricingVoiceAgent.json';
import { PRICING_AGENT_KNOWLEDGE } from '@/config/voiceAgent';

/**
 * On pricing page load: push prompt from frontend → backend → Smallest AI, then expose widget config.
 */
export function usePricingVoice() {
  const [state, setState] = useState({
    status: 'idle',
    widget: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setState((s) => ({ ...s, status: 'syncing' }));
      try {
        await axios.post(
          `${API}/voice/pricing/sync`,
          {
            prompt: PRICING_AGENT_KNOWLEDGE || voiceConfig.prompt,
            firstMessage: voiceConfig.firstMessage,
          },
          { timeout: 45000 }
        );
        const { data } = await axios.get(`${API}/voice/pricing/config`, { timeout: 15000 });
        if (!cancelled) {
          setState({ status: 'ready', widget: data, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err.response?.data?.detail || err.message || 'Voice guide could not connect';
          setState({
            status: 'error',
            widget: {
              agentId: voiceConfig.agentId,
              widgetName: voiceConfig.widgetName,
              ctaName: voiceConfig.ctaName,
              startButtonText: voiceConfig.startButtonText,
              endButtonText: voiceConfig.endButtonText,
              chatPlaceholder: voiceConfig.chatPlaceholder,
              widgetScript: 'https://unpkg.com/atoms-widget-core@latest/dist/embed/widget.umd.js',
              configured: false,
            },
            error: message,
          });
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
