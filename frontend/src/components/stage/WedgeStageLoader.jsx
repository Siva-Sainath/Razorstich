import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useTimeline, API } from '@/lib/timelineContext';
import { RECOVERY_BY_ID } from '@/config/recoveryScenarios';
import { TheaterStage } from './TheaterStage';

/** Loads validation case for a recovery scenario (URL ?case= or lane default), then renders the stage. */
export const WedgeStageLoader = ({ wedge }) => {
  const [searchParams] = useSearchParams();
  const caseFromUrl = searchParams.get('case');
  const { loadCase, caseData, loadError, apiBase } = useTimeline();
  const lane = RECOVERY_BY_ID[wedge];
  const targetCaseId = caseFromUrl || lane?.defaultCaseId;

  useEffect(() => {
    let cancelled = false;
    const load = targetCaseId
      ? loadCase(targetCaseId)
      : axios
          .get(`${API}/case/featured`, { params: { wedge }, timeout: 120000 })
          .then((r) => (r.data?.case_id ? loadCase(r.data.case_id) : null));

    load.catch(() => {
      if (!cancelled && lane?.defaultCaseId) {
        return axios
          .get(`${API}/case/featured`, { params: { wedge }, timeout: 120000 })
          .then((r) => r.data?.case_id && loadCase(r.data.case_id));
      }
      return null;
    });

    return () => {
      cancelled = true;
    };
  }, [wedge, loadCase, targetCaseId, lane?.defaultCaseId]);

  if (loadError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="type-section text-white/80">Cannot load demo scenario.</p>
        <p className="type-body text-warning/90">{loadError}</p>
        <p className="type-micro font-mono">{apiBase}</p>
      </div>
    );
  }

  if (!caseData || (targetCaseId && caseData.case?.id !== targetCaseId)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-primary/25 border-t-primary animate-spin" />
        <p className="type-body text-white/50">
          Building DQN rollout · {lane?.short || wedge.replace(/_/g, ' ')} · {targetCaseId || 'featured case'}
        </p>
      </div>
    );
  }

  return <TheaterStage scenarioId={wedge} />;
};
