import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Link2, MessageSquare, Headphones, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTimeline } from '@/lib/timelineContext';
import {
  WEDGE_CASES,
  WEDGE_BY_ID,
  CASE_CATALOG,
  CHECKOUT_TAXONOMY,
  getCaseMeta,
} from '@/config/wedges';
import { WEDGE_ACCENT } from '@/config/demoPersonas';
import { PITCH_SPEED_PRESETS } from '@/config/pitchNarrative';

function actionGlyph(uiAction) {
  if (!uiAction) return null;
  if (uiAction.includes('link')) return Link2;
  if (uiAction.includes('notify') || uiAction.includes('offer')) return MessageSquare;
  if (uiAction.includes('escalate') || uiAction.includes('support')) return Headphones;
  if (uiAction.includes('retry')) return CreditCard;
  return null;
}

function chapterForStep(step, stageMode, recovered) {
  if (step.recovered || recovered) return 'Captured';
  const ui = step.ui_action || '';
  if (ui.includes('escalate') || ui.includes('notify') || ui.includes('link') || ui.includes('offer')) return 'Nudge';
  if (ui === 'wait') return 'Observe';
  return 'Policy';
}

const PitchControls = () => {
  const { pitchMode, setPitchMode, speed, setSpeed, playDurationMs } = useTimeline();
  const approxSec = Math.round(playDurationMs / 1000);

  if (!pitchMode) {
    return (
      <div className="flex justify-end pt-2 mt-2 border-t border-white/[0.06]">
        <button
          type="button"
          onClick={() => setPitchMode(true)}
          className="type-micro text-white/40 hover:text-primary/80 transition-colors"
          data-testid="pitch-mode-enable"
        >
          Recording mode →
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-3 border-t border-white/[0.06]">
      <label className="inline-flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={pitchMode}
          onChange={(e) => setPitchMode(e.target.checked)}
          className="rounded border-white/20"
          data-testid="pitch-mode-toggle"
        />
        <span className="type-meta text-white/60">Pitch mode</span>
        <span className="type-micro text-white/35 hidden sm:inline">auto-pause each step</span>
      </label>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="type-micro text-white/35 mr-1">Pace</span>
        {PITCH_SPEED_PRESETS.map((preset) => {
          const active = Math.abs(speed - preset.speed) < 0.05;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => setSpeed(preset.speed)}
              className={`rounded-full px-3 py-1 type-micro transition-colors ${
                active
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-white/[0.04] text-white/50 border border-white/10 hover:border-white/20'
              }`}
              title={preset.hint}
              data-testid={`pitch-speed-${preset.id}`}
            >
              {preset.label}
            </button>
          );
        })}
        <span className="type-micro text-white/30 ml-1 tabular-nums">~{approxSec}s</span>
      </div>
    </div>
  );
};

export const StageCasePicker = ({ wedge }) => {
  const { caseData, loadCase } = useTimeline();
  const currentId = caseData?.case?.id;
  const lane = WEDGE_BY_ID[wedge];
  const accentKey = lane?.accent || 'checkout';
  const accent = WEDGE_ACCENT[accentKey];
  const cases = WEDGE_CASES[wedge] || [];

  if (!cases.length) return null;

  if (wedge === 'checkout_failed') {
    return (
      <div className="space-y-2 shrink-0" data-testid="stage-case-picker">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {CHECKOUT_TAXONOMY.map((tax) => {
            const taxCases = cases.filter((id) => CASE_CATALOG[id]?.taxonomy === tax);
            if (!taxCases.length) return null;
            return (
              <div key={tax} className="flex gap-1.5 shrink-0 items-center">
                <span className="type-micro text-white/30 font-mono uppercase mr-1">{tax}</span>
                {taxCases.map((caseId) => {
                  const active = caseId === currentId;
                  const meta = getCaseMeta(caseId);
                  return (
                    <motion.button
                      key={caseId}
                      type="button"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      data-testid={active ? 'queue-case-current' : 'queue-case-row'}
                      onClick={() => !active && loadCase(caseId)}
                      className={`rounded-full border px-3 py-1.5 type-micro font-mono transition-colors ${
                        active ? `${accent.text} border-current/40 bg-white/[0.06]` : 'border-white/10 text-white/50 hover:border-white/25'
                      }`}
                    >
                      {caseId.replace('VAL-CHK-', '')}
                      {meta.hook && <span className="hidden lg:inline text-white/35 ml-1">· {meta.hook.split('·')[0]}</span>}
                    </motion.button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin shrink-0 snap-x" data-testid="stage-case-picker">
      {cases.map((caseId) => {
        const active = caseId === currentId;
        const meta = getCaseMeta(caseId);
        return (
          <motion.button
            key={caseId}
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            data-testid={active ? 'queue-case-current' : 'queue-case-row'}
            onClick={() => !active && loadCase(caseId)}
            className={`snap-start shrink-0 rounded-[14px] border px-3 py-2 text-left transition-colors ${
              active ? 'ring-1 ring-white/20' : 'hover:border-white/25'
            }`}
            style={{
              borderColor: active ? accent.border : 'rgba(255,255,255,0.08)',
              background: active
                ? `linear-gradient(145deg, ${accent.glow} 0%, rgba(255,255,255,0.05) 50%)`
                : 'rgba(255,255,255,0.03)',
            }}
          >
            <p className={`type-micro font-mono ${active ? accent.text : 'text-white/70'}`}>{caseId}</p>
            {meta.hook && (
              <p className="type-micro mt-0.5 text-white/40 max-w-[160px] truncate">{meta.hook}</p>
            )}
            {meta.badge && (
              <span className="type-micro text-warning/80">{meta.badge}</span>
            )}
            {meta.beatsRules && (
              <span className="type-micro text-success/80">beats rules</span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

export const StageRail = ({ wedge }) => {
  const {
    rolloutSteps,
    t,
    playing,
    togglePlay,
    goToStep,
    elapsedLabel,
    recovered,
    currentRolloutStep,
    currentStepIndex,
    stageMode,
    pitchMode,
  } = useTimeline();

  const stepIdx = currentStepIndex;
  const lane = WEDGE_BY_ID[wedge];
  const accent = WEDGE_ACCENT[lane?.accent || 'checkout'];
  const chapters = lane?.chapterLabels || [];

  const actionLabel = currentRolloutStep
    ? currentRolloutStep.ui_action?.replace(/_/g, ' ')
    : 'Episode start';

  const chapter =
    stageMode === 'failure'
      ? chapters[0] || 'Decline'
      : stageMode === 'outcome'
        ? chapters[chapters.length - 1] || 'Captured'
        : chapterForStep(currentRolloutStep || {}, stageMode, recovered);

  return (
    <div
      className="stage-rail shrink-0 rounded-[20px] border border-white/10 bg-black/40 backdrop-blur-xl px-3 sm:px-4 py-2.5 z-20"
      data-testid="audit-scrubber"
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-1 shrink-0">
          <Button
            data-testid="prev-event-btn"
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full"
            onClick={() => goToStep(stepIdx - 1)}
            aria-label="Previous step"
          >
            <SkipBack size={16} />
          </Button>
          <Button
            data-testid="play-pause-btn"
            size="icon"
            className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={togglePlay}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </Button>
          <Button
            data-testid="next-event-btn"
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full"
            onClick={() => goToStep(stepIdx + 1)}
            aria-label="Next step"
          >
            <SkipForward size={16} />
          </Button>
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-1">
            {rolloutSteps.map((step, i) => {
              const lit = step.t <= t;
              const current = i === stepIdx;
              const Glyph = actionGlyph(step.ui_action);
              return (
                <button
                  key={step.step}
                  type="button"
                  onClick={() => goToStep(i)}
                  className={`relative h-3 flex-1 rounded-full transition-all duration-300 flex items-center justify-center ${
                    lit ? (step.recovered ? 'bg-success/85' : accent.bar) : 'bg-white/10'
                  } ${current ? 'ring-2 ring-white/25 ring-offset-2 ring-offset-[#0a1220]' : ''}`}
                  aria-label={`Step ${step.step}: ${step.ui_action}`}
                >
                  {Glyph && lit && (
                    <Glyph size={10} className="text-white/90 absolute" strokeWidth={2.5} />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 min-h-[24px]">
            <motion.div
              key={`${currentRolloutStep?.step}-${actionLabel}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 min-w-0 flex items-center gap-2 justify-center"
            >
              <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 type-micro text-white/50">
                {chapter}
              </span>
              <span className="type-micro font-mono text-white/70 truncate">{actionLabel}</span>
              {currentRolloutStep?.recovered && (
                <span className="type-micro text-success shrink-0">captured</span>
              )}
            </motion.div>
            <span className="type-micro font-mono text-white/35 shrink-0 tabular-nums">
              {stepIdx + 1}/{rolloutSteps.length}
            </span>
          </div>
        </div>
      </div>

      <PitchControls />

      {pitchMode && (
        <p className="type-micro text-white/30 mt-2 text-center">
          Pitch mode on — playback pauses at each step. Read the script above, then press play.
        </p>
      )}
    </div>
  );
};
