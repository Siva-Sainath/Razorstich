import React, { useEffect, useState } from 'react';

export const LearningScrubber = ({ episodes, selectedEpisode, onChange }) => {
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing || episodes.length < 2) return undefined;
    const timer = window.setInterval(() => {
      const index = episodes.indexOf(selectedEpisode);
      onChange(episodes[(index + 1) % episodes.length]);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [episodes, selectedEpisode, playing, onChange]);

  return (
    <div className="flex items-center gap-2 flex-wrap" data-testid="learning-scrubber">
      {episodes.map((episode) => (
        <button
          key={episode}
          type="button"
          onClick={() => { setPlaying(false); onChange(episode); }}
            className={`rounded-[12px] border px-4 py-2.5 type-metric font-mono transition-colors ${
            selectedEpisode === episode
              ? 'border-primary/50 bg-primary/[0.12] text-primary'
              : 'border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.07]'
          }`}
        >
          ep {episode.toLocaleString()}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setPlaying((value) => !value)}
        className="rounded-[12px] border border-white/10 px-4 py-2.5 type-body text-white/55 hover:text-white"
      >
        {playing ? 'pause · 10×' : 'play · 10×'}
      </button>
    </div>
  );
};
