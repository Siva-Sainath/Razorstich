import React, { useMemo, useState } from 'react';
import { GitBranch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTimeline } from '@/lib/timelineContext';
import { smoothPath, projectPoints } from '@/lib/svg';
import { Panel } from './Panel';

const W = 640;
const H = 230;
const PAD = { padL: 40, padR: 64, padT: 18, padB: 22, width: W, height: H };
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

  return (
    <Panel
      title="Counterfactual Ghost Runs"
      icon={GitBranch}
      testId="ghost-runs"
      index="03"
      className={className}
      right={
        <Badge className="bg-white/[0.06] text-white/60 border border-white/10 font-mono text-[10px]">
          {runs.length - 1} PATHS REJECTED
        </Badge>
      }
    >
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto select-none"
          role="img"
          aria-label="Alternate policy timelines the agent simulated but did not take"
        >
          <defs>
            <filter id="grGlow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="2.8" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <clipPath id="grClip">
              <rect x="0" y="0" width={playheadX} height={H} />
            </clipPath>
          </defs>

          {/* playhead echo */}
          <line x1={playheadX} y1={PAD.padT - 4} x2={playheadX} y2={H - PAD.padB} stroke="#22d3ee" strokeWidth="1" opacity="0.4" />

          {runs.map((run) => {
            const isHover = hovered === run.id;
            return (
              <g key={run.id}>
                {run.chosen ? (
                  <>
                    <path d={run.path} fill="none" stroke="rgba(52,211,153,0.25)" strokeWidth="2" />
                    <path
                      d={run.path}
                      data-testid="chosen-run-path"
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="2.4"
                      clipPath="url(#grClip)"
                      filter="url(#grGlow)"
                    />
                  </>
                ) : (
                  <path
                    d={run.path}
                    data-testid="ghost-run-path"
                    fill="none"
                    stroke={isHover ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.14)'}
                    strokeWidth={isHover ? 1.8 : 1.3}
                    strokeDasharray="5 5"
                  />
                )}
                {/* invisible fat hover target */}
                <path
                  d={run.path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="14"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHovered(run.id)}
                  onMouseLeave={() => setHovered(null)}
                />
                <text
                  x={run.end.x + 8}
                  y={run.end.y + 3}
                  fontSize="10"
                  fontFamily="IBM Plex Mono, monospace"
                  fill={run.chosen ? '#34d399' : isHover ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)'}
                >
                  {Math.round(run.prob * 100)}%
                </text>
              </g>
            );
          })}
        </svg>

        {/* info readout */}
        {info && (
          <div
            data-testid="ghost-run-info"
            className={`mt-1 rounded-lg border px-3 py-2 flex items-start gap-3 ${
              info.chosen ? 'border-emerald-400/20 bg-emerald-500/[0.06]' : 'border-white/10 bg-white/[0.03]'
            }`}
          >
            <span className={`font-mono text-[11px] shrink-0 ${info.chosen ? 'text-emerald-300' : 'text-white/70'}`}>
              {info.label}
            </span>
            <span className="font-mono text-[11px] text-white/45 leading-relaxed">{info.reason}</span>
          </div>
        )}
      </div>
    </Panel>
  );
};
