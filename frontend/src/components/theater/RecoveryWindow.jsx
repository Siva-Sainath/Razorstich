import React, { useMemo, useRef, useCallback, useState } from 'react';
import { LineChart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTimeline, sampleCurve } from '@/lib/timelineContext';
import { smoothPath, projectPoints } from '@/lib/svg';
import { Panel } from './Panel';

const W = 640;
const H = 240;
const PAD = { padL: 40, padR: 18, padT: 20, padB: 30, width: W, height: H };
const PLOT_W = W - PAD.padL - PAD.padR;
const PLOT_H = H - PAD.padT - PAD.padB;

const MARKER_TYPES = new Set(['failure', 'retry_failed', 'intervention', 'customer_drop', 'captured']);

export const RecoveryWindow = ({ className }) => {
  const { caseData, t, setT, setPlaying, recoveryProb, clockAt, events } = useTimeline();
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

  const markers = useMemo(
    () => events.filter((ev) => MARKER_TYPES.has(ev.type)),
    [events]
  );

  return (
    <Panel
      title="Recovery Window"
      icon={LineChart}
      testId="recovery-window"
      index="02"
      className={className}
      right={
        <Badge data-testid="recovery-probability" className="bg-cyan-500/15 text-cyan-200 border border-cyan-400/20 font-mono text-[11px]">
          P(recover) {Math.round(recoveryProb * 100)}%
        </Badge>
      }
    >
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto cursor-crosshair select-none touch-none"
          role="img"
          aria-label="Recovery probability curve over the 90 minute window"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={() => setHoverT(null)}
        >
          <defs>
            <linearGradient id="rwFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </linearGradient>
            <filter id="rwGlow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <clipPath id="rwClip">
              <rect x="0" y="0" width={playheadX} height={H} />
            </clipPath>
          </defs>

          {/* grid */}
          {[0.25, 0.5, 0.75, 1].map((p) => {
            const y = PAD.padT + (1 - p) * PLOT_H;
            return (
              <g key={p}>
                <line x1={PAD.padL} y1={y} x2={W - PAD.padR} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 5" />
                <text x={PAD.padL - 7} y={y + 3} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.35)" fontFamily="IBM Plex Mono, monospace">
                  {Math.round(p * 100)}
                </text>
              </g>
            );
          })}
          {/* time axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((tt) => (
            <text key={tt} x={xAt(tt)} y={H - 8} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.3)" fontFamily="IBM Plex Mono, monospace">
              t+{Math.round(tt * caseData.case.windowMinutes)}m
            </text>
          ))}

          {/* area + dim base curve */}
          <path d={areaPath} fill="url(#rwFill)" clipPath="url(#rwClip)" />
          <path d={linePath} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" />
          {/* bright elapsed segment */}
          <path d={linePath} fill="none" stroke="#22d3ee" strokeWidth="2" clipPath="url(#rwClip)" filter="url(#rwGlow)" />

          {/* event markers */}
          {markers.map((ev) => {
            const mx = xAt(ev.t);
            const my = yAt(ev.t);
            const passed = ev.t <= t;
            const color = ev.severity === 'fail' ? '#fb7185' : ev.severity === 'ok' ? '#34d399' : '#fbbf24';
            return (
              <g key={ev.t} data-testid="recovery-event-marker" opacity={passed ? 0.95 : 0.35}>
                <rect x={mx - 3.4} y={my - 3.4} width="6.8" height="6.8" transform={`rotate(45 ${mx} ${my})`} fill={color} />
                <title>{ev.label}</title>
              </g>
            );
          })}

          {/* hover ghost line */}
          {hoverT != null && !draggingRef.current && (
            <g pointerEvents="none" opacity="0.5">
              <line x1={xAt(hoverT)} y1={PAD.padT} x2={xAt(hoverT)} y2={PAD.padT + PLOT_H} stroke="rgba(255,255,255,0.25)" strokeDasharray="2 4" />
              <text x={xAt(hoverT)} y={PAD.padT - 7} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.55)" fontFamily="IBM Plex Mono, monospace">
                {Math.round(sampleCurve(curve, hoverT) * 100)}% · {clockAt(hoverT)}
              </text>
            </g>
          )}

          {/* playhead */}
          <g data-testid="recovery-playhead" pointerEvents="none">
            <line x1={playheadX} y1={PAD.padT - 4} x2={playheadX} y2={PAD.padT + PLOT_H} stroke="#22d3ee" strokeWidth="1.2" opacity="0.85" />
            <circle cx={playheadX} cy={playheadY} r="4.2" fill="#22d3ee" filter="url(#rwGlow)" />
            <circle cx={playheadX} cy={playheadY} r="8.5" fill="none" stroke="#22d3ee" strokeOpacity="0.35" />
          </g>
        </svg>
        <p className="font-mono text-[10px] text-white/35 mt-1">
          drag anywhere on the curve to scrub · diamonds mark agent + customer events
        </p>
      </div>
    </Panel>
  );
};
