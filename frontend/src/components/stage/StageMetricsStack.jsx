import React, { useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTimeline } from '@/lib/timelineContext';
import { WEDGE_BY_ID } from '@/config/wedges';
import { getPersona } from '@/config/demoPersonas';
import { FailureNetworkCard } from './metrics/EpisodeCards';
import { QValuesCard } from './metrics/QValuesCard';
import { RolloutActionCard } from './metrics/RolloutActionCard';
import { RecoveryBeliefCard } from './metrics/RecoveryBeliefCard';
import { GhostCompareCard, OutcomeCard } from './metrics/TrainingCards';
import { BenchmarkStrip } from './metrics/BenchmarkStrip';
import { ChurnRiskMeter } from './surfaces/SubscriptionSurface';
import { DunningLadder, InvoiceARTimeline } from './surfaces/InvoiceSurface';

const MAX_CARDS = 2;

export const StageMetricsStack = ({ wedge }) => {
  const { stageMode, currentStepIndex, caseData, t, windowHours, currentRolloutStep, recovered } =
    useTimeline();
  const lane = WEDGE_BY_ID[wedge];
  const persona = getPersona(caseData?.case?.id);
  const ghostRuns = caseData?.ghostRuns || [];
  const rulesDelta =
    ghostRuns.find((g) => g.chosen)?.prob -
    (ghostRuns.find((g) => g.id === 'gr-rules')?.prob || 0);
  const alwaysGhost = lane?.alwaysGhost || persona?.hero === 'beats_rules';

  const cards = useMemo(() => {
    const list = [];

    if (stageMode === 'outcome') {
      list.push('outcome');
    } else if (stageMode === 'policy') {
      if (alwaysGhost || rulesDelta > 0.05) list.push('ghost');
      list.push('qvalues', 'rollout');
    } else if (stageMode === 'intervene') {
      list.push('rollout', 'belief');
    } else if (stageMode === 'failure') {
      list.push('failure', 'rollout');
    } else {
      list.push('failure');
      if (currentStepIndex > 0) list.push('rollout');
    }

    if (lane?.showChurnMeter) list.unshift('churn');
    if (lane?.showDunningLadder) list.unshift('dunning');
    if (lane?.showARTimeline) list.unshift('ar');

    return [...new Set(list)].slice(0, MAX_CARDS);
  }, [stageMode, currentStepIndex, rulesDelta, alwaysGhost, lane]);

  const renderCard = (key, index) => {
    const delay = index * 0.05;
    switch (key) {
      case 'failure':
        return <FailureNetworkCard key="failure" delay={delay} />;
      case 'qvalues':
        return <QValuesCard key="qvalues" delay={delay} wedge={wedge} />;
      case 'rollout':
        return <RolloutActionCard key={`rollout-${currentStepIndex}`} delay={delay} />;
      case 'belief':
        return <RecoveryBeliefCard key="belief" delay={delay} wedge={wedge} />;
      case 'ghost':
        return <GhostCompareCard key="ghost" delay={delay} />;
      case 'outcome':
        return <OutcomeCard key="outcome" delay={delay} />;
      case 'churn':
        return (
          <div key="churn" className="glass-panel rounded-[16px] p-3">
            <p className="type-micro text-white/45 mb-2">Churn risk</p>
            <ChurnRiskMeter prob={currentRolloutStep?.belief_p ?? (recovered ? 1 : 0.35)} />
          </div>
        );
      case 'dunning':
        return (
          <div key="dunning" className="glass-panel rounded-[16px] p-3">
            <p className="type-micro text-white/45 mb-2">Dunning ladder</p>
            <DunningLadder currentAction={currentRolloutStep?.rl_action} />
          </div>
        );
      case 'ar':
        return (
          <div key="ar" className="glass-panel rounded-[16px] p-3">
            <p className="type-micro text-white/45 mb-2">Invoice aging</p>
            <InvoiceARTimeline t={t} windowHours={windowHours} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-2.5" data-testid="stage-metrics-stack">
      <BenchmarkStrip />
      <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-y-auto scrollbar-thin pr-0.5">
        <AnimatePresence mode="popLayout">{cards.map((key, i) => renderCard(key, i))}</AnimatePresence>
      </div>
    </div>
  );
};
