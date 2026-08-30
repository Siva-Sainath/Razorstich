import React, { useMemo, useRef, useCallback, useState } from 'react';
import { useTimeline, sampleCurve } from '@/lib/timelineContext';
import { smoothPath, projectPoints } from '@/lib/svg';
import { Panel } from './Panel';
import { MetricNumber } from '@/components/kit/MetricNumber';

const W = 680;
const H = 240;
const PAD = { padL: 20, padR: 66, padT: 24, padB: 22, width: W, height: H };
const PLOT_W = W - PAD.padL - PAD.padR;
const PLOT_H = H - PAD.padT - PAD.padB;

/** Merged ghost paths + chosen recovery curve + optimal retry window. */
export const RecoveryPathsPanel = ({ className }) => {
  const { caseData, t, setT, setPlaying, recoveryProb, replayWindow, windowHours } = useTimeline();
  const svgRef = useRef(null);
  const draggingRef = useRef(false);
  const [hovered, setHovered] = useState(null);

  const curve = caseData.recoveryCurve;
  const ghostRuns = caseData.ghostRuns || [];

  const runs = useMemo(
    () =>
      ghostRuns.map((run) => {
        const pts = projectPoints(run.points, PAD);
        return { ...run, path: smoothPath(pts), end: pts[pts.length - 1] };
      }),
    [ghostRuns]
  );

  const curvePts = useMemo(() => projectPoints(curve, PAD), [curve]);
  const curvePath = useMemo(() => smoothPath(curvePts), [curvePts]);
  const areaPath = useMemo(
    () => `${curvePath} L ${PAD.padL + PLOT_W} ${PAD.padT + PLOT_H} L ${PAD.padL} ${PAD.padT + PLOT_H} Z`,
    [curvePath]
  );

  const xAt = (tt) => PAD.padL + tt * PLOT_W;
  const yAt = useCallback((tt) => PAD.padT + (1 - sampleCurve(curve, tt)) * PLOT_H, [curve]);

  const playheadX = xAt(t);
  const playheadY = yAt(t);
  const winStartX = xAt(replayWindow?.start ?? 0);
  const winEndX = xAt(replayWindow?.end ?? 1);

  const chosen = runs.find((r) => r.chosen);
  const bestGhost = Math.max(...runs.filter((r) => !r.chosen).map((r) => r.prob), 0);
  const lift = chosen ? Math.round((chosen.prob - bestGhost) * 100) : 0;
  const info = hovered ? runs.find((r) => r.id === hovered) : chosen;

  const tFromClientX = useCallback((clientX) => {
    const rect = svgRef.current.getBoundingClientRect();
    const frac = (clientX - rect.left) / rect.width;
    const x = frac * W;
    return Math.max(0, Math.min(1, (x - PAD.padL) / PLOT_W));
  }, []);

  const onPointerDown = (e) => {
    draggingRef.current = true;
    setPlaying(false);
    e.currentTarget.setPointerCapture(e.pointerId);
    setT(tFromClientX(e.clientX));
  };
  const onPointerMove = (e) => {
    if (draggingRef.current) setT(tFromClientX(e.clientX));
  };
  const onPointerUp = () => {
    draggingRef.current = false;
  };

  return (
    <Panel
      title="Recovery paths & timing"
      subtitle={`Ghost alternatives vs chosen rollout · optimal window shaded · +${lift}% vs best alt`}
      testId="recovery-paths-panel"
      className={className}
      variant="standard"
      figure="FIG.4"
      bodyClassName="pt-3"
      right={
        <div data-testid="recovery-probability" className="text-right shrink-0">
          <MetricNumber size="lg">{Math.round(recoveryProb * 100)}%</MetricNumber>
          <p className="type-meta mt-1">belief now</p>
        </div>
      }
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto select-none cursor-crosshair touch-none"
        role="img"
        aria-label="Recovery paths and timing window"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <defs>
          <linearGradient id="rppFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(213 89% 56%)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="hsl(213 89% 56%)" stopOpacity="0" />
          </linearGradient>
          <clipPath id="rppClip">
            <rect x="0" y="0" width={playheadX} height={H} />
          </clipPath>
        </defs>

        <rect
          x={winStartX}
          y={PAD.padT - 6}
          width={Math.max(0, winEndX - winStartX)}
          height={PLOT_H + 12}
          fill="rgba(43,138,247,0.06)"
          stroke="rgba(43,138,247,0.2)"
          strokeWidth="1"
          rx="4"
        />

        {runs.map((run) => {
          const isHover = hovered === run.id;
          if (run.chosen) return null;
          return (
            <g key={run.id}>
              <path
                d={run.path}
                fill="none"
                stroke={isHover ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="4 4"
              />
              <path
                d={run.path}
                fill="none"
                stroke="transparent"
                strokeWidth="12"
                pointerEvents="stroke"
                onMouseEnter={() => setHovered(run.id)}
                onMouseLeave={() => setHovered(null)}
              />
            </g>
          );
        })}

        <path d={areaPath} fill="url(#rppFill)" clipPath="url(#rppClip)" />
        <path d={curvePath} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeLinecap="round" />
        <path
          d={curvePath}
          fill="none"
          stroke="rgba(43,138,247,0.95)"
          strokeWidth="2.5"
          strokeLinecap="round"
          clipPath="url(#rppClip)"
        />

        {chosen && (
          <path
            d={chosen.path}
            fill="none"
            stroke="rgba(45,212,191,0.35)"
            strokeWidth="2"
            strokeLinecap="round"
            clipPath="url(#rppClip)"
          />
        )}

        <line x1={playheadX} y1={PAD.padT - 4} x2={playheadX} y2={PAD.padT + PLOT_H} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        <circle cx={playheadX} cy={playheadY} r="5" fill="rgba(255,255,255,0.9)" stroke="rgba(43,138,247,0.8)" strokeWidth="2" />

        <text x={PAD.padL} y={H - 4} fontSize="11" fill="rgba(255,255,255,0.35)" fontFamily="IBM Plex Mono, monospace">
          now
        </text>
        <text x={W - PAD.padR} y={H - 4} textAnchor="end" fontSize="11" fill="rgba(255,255,255,0.35)" fontFamily="IBM Plex Mono, monospace">
          {`+${windowHours}h`}
        </text>
      </svg>

      {info && (
        <div
          data-testid="ghost-run-info"
          className={`mt-3 rounded-[16px] px-4 py-3 border ${
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
