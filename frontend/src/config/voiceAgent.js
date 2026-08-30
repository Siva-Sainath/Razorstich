/**
 * Smallest AI pricing voice — prompt lives here (frontend source of truth).
 * Synced to Atoms on /pricing via POST /api/voice/pricing/sync.
 */
import voiceConfig from '@/config/pricingVoiceAgent.json';

export const PRICING_VOICE_AGENT = {
  agentId: process.env.REACT_APP_SMALLEST_AI_AGENT_ID || voiceConfig.agentId,
  widgetScript: 'https://unpkg.com/atoms-widget-core@latest/dist/embed/widget.umd.js',
  widgetName: voiceConfig.widgetName,
  ctaName: voiceConfig.ctaName,
  startButtonText: voiceConfig.startButtonText,
  endButtonText: voiceConfig.endButtonText,
  chatPlaceholder: voiceConfig.chatPlaceholder,
  firstMessage: voiceConfig.firstMessage,
};

export const PRICING_VOICE_PROMPTS = [
  'Which plan fits a store doing ₹50L/month?',
  'How does pay-per-recovery pricing work?',
  'Can you explain phone recovery?',
  'I want to join the Growth pilot',
];

/** Sent to backend → Smallest AI on pricing page load */
export const PRICING_AGENT_KNOWLEDGE = voiceConfig.prompt;
