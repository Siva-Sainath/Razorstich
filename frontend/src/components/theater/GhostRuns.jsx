import React, { useMemo, useState } from 'react';
import { useTimeline } from '@/lib/timelineContext';
import { smoothPath, projectPoints } from '@/lib/svg';
import { Panel } from './Panel';
import { resolveBenchmark } from '@/config/rlRunStats';

const W = 680;
const H = 240;
const PAD = { padL: 20, padR: 66, padT: 20, padB: 18, width: W, height: H };
const PLOT_W = W - PAD.padL - PAD.padR;

export const GhostRuns = ({ className }) => {
  const { caseData, t } = useTimeline();
  const [hovered, setHovered] = useState(null);

  const runs = useMemo(
    () =>
      caseData.ghostRuns.map((run) => {
        const pts = projectPoints(run.points, PAD);
        return { ...run, path: smoothPath(pts), end: pts[pts.length - 1] };
      }),
    [caseData]
  );

  const playheadX = PAD.padL + t * PLOT_W;
  const info = hovered ? runs.find((r) => r.id === hovered) : runs.find((r) => r.chosen);
  const chosen = runs.find((r) => r.chosen);
  const rules = runs.find((r) => r.id === 'gr-rules');
  const wedge = caseData?.case?.wedge;
  const resolved = resolveBenchmark(
    { benchmark: caseData?.benchmark, model: caseData?.model },
    wedge
  );
  const sameSeedNote = chosen && rules
    ? `This seed: DQN ${chosen.recovered ? 'recovered' : 'missed'} · rules ${rules.recovered ? 'recovered' : 'missed'}.`
    : 'Same validation seed for every path.';

  return (
    <Panel
      title="Paths compared on this seed"
      subtitle={`${sameSeedNote} Wedge gate: ${resolved.liftLabel} mean net vs failure-rules (${resolved.seedsBeaten} seeds × ${resolved.episodesPerSeed} ep, simulator).`}
      testId="ghost-runs"
      className={className}
      bodyClassName="flex flex-col justify-center"
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto select-none cursor-crosshair"
        role="img"
        aria-label="Alternate recovery paths the AI simulated but did not take"
      >
        <defs>
          <linearGradient id="grStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(213 89% 58%)" />
            <stop offset="100%" stopColor="rgba(45,212,191,0.95)" />
          </linearGradient>
          <filter id="grGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="grClip">
            <rect x="0" y="0" width={playheadX} height={H} />
          </clipPath>
        </defs>

        <line x1={playheadX} y1={PAD.padT - 4} x2={playheadX} y2={H - PAD.padB} stroke="rgba(255,255,255,0.25)" strokeWidth="1" opacity="0.5" />

        {runs.map((run) => {
          const isHover = hovered === run.id;
          return (
            <g key={run.id}>
              {run.chosen ? (
                <>
                  <path d={run.path} fill="none" stroke="rgba(43,138,247,0.22)" strokeWidth="2" strokeLinecap="round" />
                  <path
                    d={run.path}
                    data-testid="chosen-run-path"
                    fill="none"
                    stroke="rgba(43,138,247,0.9)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    clipPath="url(#grClip)"
                  />
                </>
              ) : (
                <path
                  d={run.path}
                  data-testid="ghost-run-path"
                  fill="none"
                  stroke={isHover ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.25)'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="4 4"
                />
              )}
              <path
                d={run.path}
                fill="none"
                stroke="transparent"
                strokeWidth="10"
                pointerEvents="stroke"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHovered(run.id)}
                onMouseLeave={() => setHovered(null)}
              />
              <text
                x={run.end.x + 9}
                y={run.end.y + 4}
                fontSize="12"
                fontFamily="IBM Plex Mono, monospace"
                fill={run.chosen ? 'rgba(43,138,247,0.95)' : isHover ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)'}
              >
                {run.recovered ? '✓' : '○'} {`${Math.round(run.prob * 100)}%`}
              </text>
            </g>
          );
        })}
      </svg>

      {info && (
        <div
          data-testid="ghost-run-info"
          className={`mt-2 rounded-[16px] px-4 py-3 border ${
            info.chosen ? 'bg-primary/[0.06] border-primary/20' : 'bg-white/[0.03] border-white/[0.08]'
          }`}
        >
          <span className={`type-meta font-medium ${info.chosen ? 'text-primary' : 'text-white/85'}`}>
            {info.label}
          </span>
          <span className="type-meta text-white/55 ml-2.5">{info.reason}</span>
        </div>
      )}
    </Panel>
  );
};
