import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTimeline, API } from '@/lib/timelineContext';
import { WEDGE_BY_ID } from '@/config/wedges';
import { RecoveryStage } from './RecoveryStage';

/** Loads wedge default validation case (curated for demo), then renders the stage. */
export const WedgeStageLoader = ({ wedge }) => {
  const { loadCase, caseData, loadError, apiBase } = useTimeline();
  const lane = WEDGE_BY_ID[wedge];
  const defaultId = lane?.defaultCaseId;

  useEffect(() => {
    let cancelled = false;
    const load = defaultId
      ? loadCase(defaultId)
      : axios
          .get(`${API}/case/featured`, { params: { wedge }, timeout: 120000 })
          .then((r) => (r.data?.case_id ? loadCase(r.data.case_id) : null));

    load.catch(() => {
      if (!cancelled && defaultId) {
        return axios
          .get(`${API}/case/featured`, { params: { wedge }, timeout: 120000 })
          .then((r) => r.data?.case_id && loadCase(r.data.case_id));
      }
      return null;
    });

    return () => {
      cancelled = true;
    };
  }, [wedge, loadCase, defaultId]);

  if (loadError) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="type-section text-white/80">Cannot load wedge episode.</p>
        <p className="type-body text-warning/90">{loadError}</p>
        <p className="type-micro font-mono">{apiBase}</p>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-primary/25 border-t-primary animate-spin" />
        <p className="type-body text-white/50">
          Building DQN rollout · {lane?.short || wedge.replace(/_/g, ' ')} · {defaultId || 'featured case'}
        </p>
      </div>
    );
  }

  return <RecoveryStage wedge={wedge} />;
};
