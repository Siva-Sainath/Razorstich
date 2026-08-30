import React, { useCallback, useEffect, useState } from 'react';
import { recoveryScenarioLabel } from '@/config/consumerCopy';
import axios from 'axios';
import { API } from '@/lib/timelineContext';
import { LearningScrubber } from '@/components/learn/LearningScrubber';
import { MilestoneReplayPanel } from '@/components/learn/MilestoneReplayPanel';
import { LearningCheckpointRail } from '@/components/svg/LearningCheckpointRail';
import { ResearchFigure } from './ResearchFigure';

/** Scrub DQN maturity on one anchor val case — checkpoint replay. */
export const MilestoneExplorer = ({ scenarioId, manifest = [], trainingCurve = [], anchorCaseId }) => {
  const [selectedEpisode, setSelectedEpisode] = useState(manifest[0]?.episode);
  const [milestone, setMilestone] = useState(null);
  const [error, setError] = useState(null);

  const episodes = manifest.map((r) => r.episode);

  useEffect(() => {
    if (manifest[0]?.episode) setSelectedEpisode(manifest[0].episode);
  }, [manifest]);

  useEffect(() => {
    if (!selectedEpisode || !anchorCaseId) return undefined;
    setMilestone(null);
    setError(null);
    axios
      .get(`${API}/learn/milestone/${selectedEpisode}`, {
        params: { wedge: scenarioId, case_id: anchorCaseId },
        timeout: 120000,
      })
      .then((r) => setMilestone(r.data))
      .catch((e) => setError(e.response?.data?.detail || e.message));
    return undefined;
  }, [scenarioId, selectedEpisode, anchorCaseId]);

  const handleChange = useCallback((ep) => setSelectedEpisode(ep), []);

  if (!manifest.length) {
    return (
      <ResearchFigure
        figure="FIG.5"
        title="Checkpoint replay"
        subtitle={`No milestone manifest for ${recoveryScenarioLabel(scenarioId)} yet.`}
        caption="Run training with milestone saves to populate learning_manifest_<scenario>.json"
      >
        <p className="type-body text-white/45">
          Checkout has ep 500–10k checkpoints. Other scenarios: re-run{' '}
          <code className="text-white/60">python -m packages.policy.train.run --wedge {scenarioId} --train</code>
        </p>
      </ResearchFigure>
    );
  }

  return (
    <ResearchFigure
      figure="FIG.5"
      title="Same val case · different policy age"
      subtitle={`Anchor ${anchorCaseId} — replay milestone checkpoints on a held-out validation case.`}
      caption="Each scrub loads weights from eval/checkpoints/milestones and re-runs the simulator rollout on the held-out scenario."
      testId="milestone-explorer"
      wide
    >
      <LearningCheckpointRail
        episodes={episodes}
        selectedEpisode={selectedEpisode}
        curve={trainingCurve}
        height={72}
        className="mb-4"
      />
      <LearningScrubber episodes={episodes} selectedEpisode={selectedEpisode} onChange={handleChange} />
      {error && <p className="type-body text-warning/90 mt-4">{String(error)}</p>}
      <div className="mt-5">
        <MilestoneReplayPanel milestone={milestone} />
      </div>
    </ResearchFigure>
  );
};
