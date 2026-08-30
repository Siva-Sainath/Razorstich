import React, { useMemo, useRef, useCallback, useState } from 'react';
import { useTimeline, sampleCurve } from '@/lib/timelineContext';
import { smoothPath, projectPoints } from '@/lib/svg';
import { Panel } from './Panel';
import { MetricNumber } from '@/components/kit/MetricNumber';
import { ActiveWindowBracket } from '@/components/svg/ActiveWindowBracket';

const W = 680;
const H = 200;
const PAD = { padL: 16, padR: 16, padT: 24, padB: 22, width: W, height: H };
const PLOT_W = W - PAD.padL - PAD.padR;
const PLOT_H = H - PAD.padT - PAD.padB;

const MARKER_TYPES = new Set(['failure', 'retry_failed', 'intervention', 'customer_drop', 'captured']);

export const RecoveryWindow = ({ className }) => {
  const { caseData, t, setT, setPlaying, recoveryProb, clockAt, events, windowHours, activeAgent, replayWindow, replayProgress } = useTimeline();
  const svgRef = useRef(null);
  const draggingRef = useRef(false);
  const [hoverT, setHoverT] = useState(null);

  const curve = caseData.recoveryCurve;
  const pts = useMemo(() => projectPoints(curve, PAD), [curve]);
  const linePath = useMemo(() => smoothPath(pts), [pts]);
  const areaPath = useMemo(
    () => `${linePath} L ${PAD.padL + PLOT_W} ${PAD.padT + PLOT_H} L ${PAD.padL} ${PAD.padT + PLOT_H} Z`,
    [linePath]
  );

  const xAt = (tt) => PAD.padL + tt * PLOT_W;
  const yAt = useCallback((tt) => PAD.padT + (1 - sampleCurve(curve, tt)) * PLOT_H, [curve]);

  const playheadX = xAt(t);
  const playheadY = yAt(t);
  const winStartX = xAt(replayWindow?.start ?? 0);
  const winEndX = xAt(replayWindow?.end ?? 1);

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
    const tt = tFromClientX(e.clientX);
    setHoverT(tt);
    if (draggingRef.current) setT(tt);
  };
  const onPointerUp = () => {
    draggingRef.current = false;
  };

  const markers = useMemo(() => events.filter((ev) => MARKER_TYPES.has(ev.type)), [events]);
  const showWindowBracket = (replayWindow?.end ?? 1) - (replayWindow?.start ?? 0) < 0.92;

  return (
    <Panel
      title="Best time to retry"
      subtitle={`Simulated recovery odds across the ${windowHours}h episode — scrub to explore timing.`}
      testId="recovery-window"
      className={className}
      variant="standard"
      figure="FIG.4"
      bodyClassName="pt-3"
      right={
        <div data-testid="recovery-probability" className="text-right shrink-0">
          <MetricNumber size="lg">{Math.round(recoveryProb * 100)}%</MetricNumber>
          <p className="type-micro mt-1">at playhead</p>
        </div>
      }
    >
      {showWindowBracket && (
        <div className="mb-3 px-1">
          <ActiveWindowBracket
            startPct={(replayWindow?.start ?? 0) * 100}
            endPct={(replayWindow?.end ?? 1) * 100}
            label={`Active replay · ${Math.round(replayProgress * 100)}%`}
          />
        </div>
      )}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-h-[200px] cursor-crosshair select-none touch-none block rounded-[16px] surface-inset"
        role="img"
        aria-label={`Recovery probability over the ${windowHours}-hour window`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => setHoverT(null)}
      >
        <defs>
          <linearGradient id="rwFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(213 89% 56%)" stopOpacity="0.10" />
            <stop offset="100%" stopColor="hsl(213 89% 56%)" stopOpacity="0" />
          </linearGradient>
          <clipPath id="rwClip">
            <rect x="0" y="0" width={playheadX} height={H} />
          </clipPath>
        </defs>

        {showWindowBracket && (
          <rect
            x={winStartX}
            y={PAD.padT - 6}
            width={Math.max(0, winEndX - winStartX)}
            height={PLOT_H + 12}
            fill="rgba(43,138,247,0.04)"
            stroke="rgba(43,138,247,0.15)"
            strokeWidth="1"
            rx="4"
          />
        )}

        {[0.5, 1].map((p) => (
          <line
            key={p}
            x1={PAD.padL}
            y1={PAD.padT + (1 - p) * PLOT_H}
            x2={W - PAD.padR}
            y2={PAD.padT + (1 - p) * PLOT_H}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="2 6"
          />
        ))}
        <text x={PAD.padL} y={H - 4} fontSize="11" fill="rgba(255,255,255,0.35)" fontFamily="IBM Plex Mono, monospace">
          now
        </text>
        <text x={W - PAD.padR} y={H - 4} textAnchor="end" fontSize="11" fill="rgba(255,255,255,0.35)" fontFamily="IBM Plex Mono, monospace">
          {`+${windowHours}h`}
        </text>

        <path d={areaPath} fill="url(#rwFill)" clipPath="url(#rwClip)" />
        <path d={linePath} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1" strokeLinecap="round" />
        <path d={linePath} fill="none" stroke="rgba(43,138,247,0.9)" strokeWidth="2" strokeLinecap="round" clipPath="url(#rwClip)" />

        {markers.map((ev) => {
          const passed = ev.t <= t;
          return (
            <g key={ev.t} data-testid="recovery-event-marker" opacity={passed ? 0.95 : 0.35}>
              <circle cx={xAt(ev.t)} cy={yAt(ev.t)} r="3.5" fill="rgba(255,255,255,0.85)" stroke="rgba(43,138,247,0.9)" strokeWidth="2" />
              <title>{ev.label}</title>
            </g>
          );
        })}

        {hoverT != null && !draggingRef.current && (
          <g pointerEvents="none" opacity="0.6">
            <line x1={xAt(hoverT)} y1={PAD.padT} x2={xAt(hoverT)} y2={PAD.padT + PLOT_H} stroke="rgba(255,255,255,0.25)" strokeDasharray="2 4" />
            <text x={xAt(hoverT)} y={PAD.padT - 8} textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.7)" fontFamily="IBM Plex Mono, monospace">
              {`${Math.round(sampleCurve(curve, hoverT) * 100)}% · ${clockAt(hoverT)}`}
            </text>
          </g>
        )}

        <g data-testid="recovery-playhead" pointerEvents="none">
          <line x1={playheadX} y1={PAD.padT - 4} x2={playheadX} y2={PAD.padT + PLOT_H} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
          <circle cx={playheadX} cy={playheadY} r="5" fill="rgba(255,255,255,0.9)" stroke="rgba(43,138,247,0.8)" strokeWidth="2" />
          <text x={playheadX} y={PAD.padT - 8} textAnchor="middle" fontSize="11" fontWeight="600" fill="rgba(255,255,255,0.9)" fontFamily="IBM Plex Mono, monospace">
            {`${Math.round(recoveryProb * 100)}%`}
          </text>
        </g>
      </svg>

      <p className="type-micro mt-3 border-t border-white/[0.06] pt-3">
        Curve from pre-recorded{' '}
        <span className="text-white/55">{activeAgent?.name || caseData.case.agentName}</span> rollout — live Q-values in Policy Brain.
      </p>
    </Panel>
  );
};
