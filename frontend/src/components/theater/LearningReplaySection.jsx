import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useTimeline, API } from '@/lib/timelineContext';
import { Panel } from './Panel';
import { MetricNumber } from '@/components/kit/MetricNumber';
import { FigureFrame } from '@/components/kit/FigureFrame';
import { LearningScrubber } from '@/components/learn/LearningScrubber';
import { MilestoneReplayPanel } from '@/components/learn/MilestoneReplayPanel';
import { LearningCheckpointRail } from '@/components/svg/LearningCheckpointRail';

const inr = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

export const LearningReplaySection = ({ className }) => {
  const [summary, setSummary] = useState(null);
  const [milestone, setMilestone] = useState(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`${API}/learn/summary`, { params: { wedge: 'checkout_failed' }, timeout: 120000 })
      .then(({ data }) => {
        setSummary(data);
        if (data.manifest?.[0]?.episode) setSelectedEpisode(data.manifest[0].episode);
      })
      .catch((err) => setError(err.response?.data?.detail || err.message));
  }, []);

  useEffect(() => {
    if (!summary || !selectedEpisode) return undefined;
    setMilestone(null);
    axios.get(`${API}/learn/milestone/${selectedEpisode}`, {
      params: { wedge: summary.wedge, case_id: summary.anchor_case_id },
      timeout: 120000,
    })
      .then(({ data }) => setMilestone(data))
      .catch((err) => setError(err.response?.data?.detail || err.message));
    return undefined;
  }, [summary, selectedEpisode]);

  const handleEpisodeChange = useCallback((ep) => setSelectedEpisode(ep), []);
  const b = summary?.benchmark;
  const episodes = useMemo(
    () => (summary?.manifest || []).map((row) => row.episode),
    [summary]
  );

  if (error) {
    return (
      <Panel title="Policy learning" testId="learning-replay" className={className} variant="standard" bodyClassName="pt-2">
        <p className="type-body text-warning/90">{String(error)}</p>
      </Panel>
    );
  }
  if (!summary) {
    return (
      <Panel title="Policy learning" testId="learning-replay" className={className} variant="standard" bodyClassName="pt-2">
        <p className="type-body text-white/50">Loading checkpoints…</p>
      </Panel>
    );
  }

  return (
    <Panel
      title="Policy learning"
      subtitle={`${b?.seeds_beaten || '—'} seeds beaten · +${b?.acceptance?.mean_improvement_pct?.toFixed(0) || 0}% vs rules`}
      testId="learning-replay"
      className={className}
      variant="standard"
      figure="FIG.5"
      bodyClassName="pt-2 space-y-4"
      right={
        <div className="text-right shrink-0">
          <MetricNumber size="sm" tone="primary">{inr(b?.policy_mean_net_inr)}</MetricNumber>
          <p className="type-micro mt-1">vs {inr(b?.baseline_mean_net_inr)} rules</p>
        </div>
      }
    >
      <FigureFrame figure="" caption="Checkpoint ridges — policy net value improves across training milestones." compact>
        <LearningCheckpointRail
          episodes={episodes}
          selectedEpisode={selectedEpisode}
          curve={summary.training_curve}
          height={64}
        />
      </FigureFrame>
      <LearningScrubber
        episodes={summary.manifest.map((row) => row.episode)}
        selectedEpisode={selectedEpisode}
        onChange={handleEpisodeChange}
      />
      <MilestoneReplayPanel milestone={milestone} compact />
    </Panel>
  );
};
