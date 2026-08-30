import React, { useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTimeline } from '@/lib/timelineContext';
import { WEDGE_BY_ID } from '@/config/wedges';
import { getPersona } from '@/config/demoPersonas';
import { PersonaHeroCard } from './metrics/PersonaHeroCard';
import { EpisodeStateCard, FailureNetworkCard } from './metrics/EpisodeCards';
import { QValuesCard } from './metrics/QValuesCard';
import { RolloutActionCard } from './metrics/RolloutActionCard';
import { RecoveryBeliefCard } from './metrics/RecoveryBeliefCard';
import {
  TrainingBenchmarkCard,
  GhostCompareCard,
  OutcomeCard,
} from './metrics/TrainingCards';
import { ValidationGateCard } from './metrics/ValidationGateCard';
import { ChurnRiskMeter } from './surfaces/SubscriptionSurface';
import { DunningLadder, InvoiceARTimeline } from './surfaces/InvoiceSurface';

export const StageMetricsStack = ({ wedge }) => {
  const { stageMode, currentStepIndex, caseData, t, windowHours, currentRolloutStep, recovered } = useTimeline();
  const lane = WEDGE_BY_ID[wedge];
  const persona = getPersona(caseData?.case?.id);
  const ghostRuns = caseData?.ghostRuns || [];
  const rulesDelta =
    ghostRuns.find((g) => g.chosen)?.prob -
    (ghostRuns.find((g) => g.id === 'gr-rules')?.prob || 0);

  const alwaysGhost = lane?.alwaysGhost || persona?.hero === 'beats_rules';

  const cards = useMemo(() => {
    const list = [];

    if (lane?.showChurnMeter) list.push('churn');
    if (lane?.showDunningLadder) list.push('dunning');
    if (lane?.showARTimeline) list.push('ar');

    if (stageMode === 'outcome') {
      list.push('outcome', 'belief');
    } else if (stageMode === 'policy') {
      if (alwaysGhost || rulesDelta > 0.05) list.push('ghost');
      list.push('qvalues', 'rollout', 'belief');
    } else if (stageMode === 'intervene') {
      list.push('rollout', 'belief', 'qvalues');
    } else if (stageMode === 'failure') {
      list.push('failure', 'belief', 'episode');
    } else {
      list.push('episode');
      if (currentStepIndex > 0) list.push('rollout');
    }

    if (alwaysGhost || persona?.hero === 'beats_rules' || persona?.hero === 'whale') {
      if (!list.includes('hero')) list.unshift('hero');
    }

    return list;
  }, [stageMode, currentStepIndex, rulesDelta, persona, alwaysGhost, lane]);

  const renderCard = (key, index) => {
    const delay = index * 0.06;
    switch (key) {
      case 'hero':
        return <PersonaHeroCard key="hero" />;
      case 'episode':
        return <EpisodeStateCard key="episode" delay={delay} />;
      case 'failure':
        return <FailureNetworkCard key="failure" delay={delay} />;
      case 'qvalues':
        return <QValuesCard key="qvalues" delay={delay} wedge={wedge} />;
      case 'rollout':
        return <RolloutActionCard key={`rollout-${currentStepIndex}`} delay={delay} />;
      case 'training':
        return <TrainingBenchmarkCard key="training" delay={delay} />;
      case 'validation':
        return <ValidationGateCard key="validation" delay={delay} />;
      case 'belief':
        return <RecoveryBeliefCard key="belief" delay={delay} wedge={wedge} />;
      case 'ghost':
        return <GhostCompareCard key="ghost" delay={delay} />;
      case 'outcome':
        return <OutcomeCard key="outcome" delay={delay} />;
      case 'churn':
        return (
          <div key="churn" className="glass-panel rounded-[20px] p-4">
            <p className="type-micro text-white/45 mb-2">Risk of cancelling</p>
            <ChurnRiskMeter
              prob={currentRolloutStep?.belief_p ?? (recovered ? 1 : 0.35)}
            />
          </div>
        );
      case 'dunning':
        return (
          <div key="dunning" className="glass-panel rounded-[20px] p-4">
            <p className="type-micro text-white/45 mb-3">Reminder sequence</p>
            <DunningLadder currentAction={currentRolloutStep?.rl_action} />
          </div>
        );
      case 'ar':
        return (
          <div key="ar" className="glass-panel rounded-[20px] p-4">
            <p className="type-micro text-white/45 mb-2">Invoice aging</p>
            <InvoiceARTimeline t={t} windowHours={windowHours} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="h-full min-h-0 flex flex-col gap-3 overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin"
      data-testid="stage-metrics-stack"
    >
      <AnimatePresence mode="popLayout">
        {cards.map((key, i) => renderCard(key, i))}
      </AnimatePresence>
    </div>
  );
};
