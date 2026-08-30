import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import axios from 'axios';
import { formatWedgeElapsed } from '@/config/wedges';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
export const API = `${BACKEND_URL}/api`;

const PLAY_DURATION_MS = 52000;
const PITCH_MODE_KEY = 'rs_pitch_mode';
const PITCH_SPEED_KEY = 'rs_pitch_speed';

export function getPlayDurationMs(speed = 1) {
  return PLAY_DURATION_MS / Math.max(0.25, speed);
}

const MEANINGFUL_EVENT_TYPES = new Set([
  'policy_eval',
  'intervention',
  'captured',
  'retry_failed',
  'customer_drop',
  'failure',
]);

/** Active replay span — zooms scrubber/playback to where the episode actually moves. */
export function computeReplayWindow(caseData) {
  if (!caseData?.case) return { start: 0, end: 1 };
  const events = caseData.events || [];
  const recoveredAt = caseData.case.recoveredAt;
  const firstT = events.length ? events[0].t : 0;
  const lastEventT = events.length ? events[events.length - 1].t : 0;
  const firstMeaningful =
    events.find((e) => MEANINGFUL_EVENT_TYPES.has(e.type) && e.type !== 'failure')?.t ?? firstT;
  const endBase = recoveredAt ?? lastEventT ?? 1;
  const span = Math.max(0.04, endBase - firstMeaningful);
  const pad = Math.min(0.025, span * 0.1);
  let start = Math.max(0, Math.min(firstT, firstMeaningful - pad));
  let end = Math.min(1, endBase + pad);
  if (end <= start) end = Math.min(1, start + 0.08);
  return { start, end };
}

/** Equal-time segments between key moments so long simulator gaps do not stall the demo. */
export function buildReplaySchedule(events, replayWindow) {
  const { start, end } = replayWindow;
  const times = [
    ...new Set(
      events
        .filter((e) => e.t >= start - 0.001 && e.t <= end + 0.001)
        .map((e) => e.t)
    ),
  ].sort((a, b) => a - b);
  if (!times.length || times[0] > start + 0.001) times.unshift(start);
  if (times[times.length - 1] < end - 0.001) times.push(end);
  return times;
}

/** Map episode time back to wall-clock position for event-paced replay. */
export function elapsedForEpisodeT(targetT, schedule, durationMs = PLAY_DURATION_MS) {
  if (schedule.length < 2) return 0;
  const segmentMs = durationMs / (schedule.length - 1);
  for (let i = 0; i < schedule.length - 1; i += 1) {
    const t0 = schedule[i];
    const t1 = schedule[i + 1];
    if (targetT >= t0 - 0.0001 && targetT <= t1 + 0.0001) {
      const segFrac = t1 === t0 ? 0 : (targetT - t0) / (t1 - t0);
      return (i + segFrac) * segmentMs;
    }
  }
  return targetT >= schedule[schedule.length - 1] ? durationMs : 0;
}

const TimelineContext = createContext(null);

/** Linear interpolation over sorted {t, p} points */
export const sampleCurve = (points, t) => {
  if (!points || points.length === 0) return 0;
  if (t <= points[0].t) return points[0].p;
  for (let i = 1; i < points.length; i += 1) {
    if (t <= points[i].t) {
      const a = points[i - 1];
      const b = points[i];
      const span = b.t - a.t || 1;
      const f = (t - a.t) / span;
      return a.p + (b.p - a.p) * f;
    }
  }
  return points[points.length - 1].p;
};

const CHANNEL_FOR_ACTION = {
  wait: 'Internal',
  notify_sms: 'SMS',
  notify_whatsapp: 'WhatsApp',
  notify_email: 'Email',
  create_payment_link: 'SMS',
  offer_incentive: 'SMS',
  retry_upi: 'UPI',
  retry_same_method: 'Card',
  escalate_support: 'Support',
  request_new_method: 'Email',
  stop: 'Internal',
};

export const TimelineProvider = ({ children }) => {
  const [caseData, setCaseData] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [t, setTState] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pitchMode, setPitchModeState] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(PITCH_MODE_KEY) !== '0';
  });
  const [speed, setSpeed] = useState(() => {
    if (typeof window === 'undefined') return 0.65;
    const stored = parseFloat(localStorage.getItem(PITCH_SPEED_KEY) || '');
    return Number.isFinite(stored) && stored > 0 ? stored : 0.65;
  });
  const [livePolicy, setLivePolicy] = useState(null);
  const [policyError, setPolicyError] = useState(null);
  const [wedgeSummary, setWedgeSummary] = useState(null);
  const [ghostOverlay, setGhostOverlay] = useState(false);
  const rafRef = useRef(null);
  const lastTickRef = useRef(null);
  const playElapsedRef = useRef(0);
  const tRef = useRef(0);
  const speedRef = useRef(1);
  const replayWindowRef = useRef({ start: 0, end: 1 });
  const replayScheduleRef = useRef([0, 1]);
  const prevStepIndexRef = useRef(null);

  const setPitchMode = useCallback((on) => {
    setPitchModeState(on);
    if (typeof window !== 'undefined') {
      localStorage.setItem(PITCH_MODE_KEY, on ? '1' : '0');
    }
    if (on) setPlaying(false);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PITCH_SPEED_KEY, String(speed));
    }
  }, [speed]);

  useEffect(() => {
    tRef.current = t;
  }, [t]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const resetTimeline = useCallback(() => {
    setTState(0);
    tRef.current = 0;
    playElapsedRef.current = 0;
    setPlaying(false);
    setLivePolicy(null);
    setPolicyError(null);
    setGhostOverlay(false);
  }, []);

  const loadCase = useCallback(
    (caseId) => {
      resetTimeline();
      setLoadError(null);
      return axios
        .get(`${API}/case/${caseId}`, { timeout: 120000 })
        .then((res) => {
          setCaseData(res.data);
          return res.data;
        })
        .catch((err) => {
          const message =
            err.response?.data?.detail?.error ||
            err.response?.data?.detail ||
            err.message ||
            'Failed to load case from API';
          setLoadError(String(message));
          throw err;
        });
    },
    [resetTimeline]
  );

  const loadInitial = useCallback(() => {
    setLoadError(null);
    setCaseData(null);
    const requestedCaseId = new URLSearchParams(window.location.search).get('case');
    const caseRequest = requestedCaseId
      ? axios.get(`${API}/case/${encodeURIComponent(requestedCaseId)}`, { timeout: 120000 })
      : axios.get(`${API}/case/current`, { timeout: 120000 });
    return Promise.all([
      caseRequest,
      axios.get(`${API}/agents`, { timeout: 30000 }),
    ])
      .then(([caseRes, agentsRes]) => {
        setCaseData(caseRes.data);
        setAgents(agentsRes.data?.agents || []);
      })
      .catch((err) => {
        const message =
          err.response?.data?.detail ||
          err.message ||
          `Cannot reach backend at ${BACKEND_URL}`;
        setLoadError(String(message));
      });
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    const wedge = caseData?.case?.wedge;
    if (!wedge) {
      setWedgeSummary(null);
      return undefined;
    }
    let cancelled = false;
    axios
      .get(`${API}/learn/summary`, { params: { wedge }, timeout: 60000 })
      .then((r) => {
        if (!cancelled) setWedgeSummary(r.data);
      })
      .catch(() => {
        if (!cancelled) setWedgeSummary(null);
      });
    return () => {
      cancelled = true;
    };
  }, [caseData?.case?.wedge]);

  const replayWindow = useMemo(() => computeReplayWindow(caseData), [caseData]);
  const replaySchedule = useMemo(
    () => buildReplaySchedule(caseData?.events || [], replayWindow),
    [caseData, replayWindow]
  );

  useEffect(() => {
    replayWindowRef.current = replayWindow;
    replayScheduleRef.current = replaySchedule;
  }, [replayWindow, replaySchedule]);

  useEffect(() => {
    if (!caseData) return undefined;
    const { start } = computeReplayWindow(caseData);
    setTState(start);
    tRef.current = start;
    playElapsedRef.current = 0;
    prevStepIndexRef.current = null;
    if (pitchMode) {
      setPlaying(false);
      return undefined;
    }
    const id = setTimeout(() => setPlaying(true), 1400);
    return () => clearTimeout(id);
  }, [caseData, pitchMode]);

  const setT = useCallback((next) => {
    const clamped = Math.max(0, Math.min(1, next));
    tRef.current = clamped;
    setTState(clamped);
    playElapsedRef.current = elapsedForEpisodeT(
      clamped,
      replayScheduleRef.current,
      PLAY_DURATION_MS
    );
  }, []);

  const setReplayProgress = useCallback(
    (u) => {
      const { start, end } = replayWindowRef.current;
      const clamped = Math.max(0, Math.min(1, u));
      setT(start + clamped * (end - start || 1));
    },
    [setT]
  );

  const tAtPlayElapsed = useCallback((elapsedMs) => {
    const schedule = replayScheduleRef.current;
    if (schedule.length < 2) return replayWindowRef.current.start;
    const segmentMs = PLAY_DURATION_MS / (schedule.length - 1);
    const scaled = elapsedMs * speedRef.current;
    if (scaled >= PLAY_DURATION_MS) return schedule[schedule.length - 1];
    const segIdx = Math.min(schedule.length - 2, Math.floor(scaled / segmentMs));
    const segProgress = (scaled - segIdx * segmentMs) / segmentMs;
    const t0 = schedule[segIdx];
    const t1 = schedule[segIdx + 1];
    return t0 + (t1 - t0) * segProgress;
  }, []);

  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTickRef.current = null;
      return undefined;
    }
    const tickFrame = (now) => {
      if (lastTickRef.current == null) lastTickRef.current = now;
      const dt = now - lastTickRef.current;
      lastTickRef.current = now;
      playElapsedRef.current += dt;
      const { end } = replayWindowRef.current;
      if (playElapsedRef.current >= PLAY_DURATION_MS) {
        tRef.current = end;
        setTState(end);
        setPlaying(false);
        return;
      }
      const next = tAtPlayElapsed(playElapsedRef.current);
      tRef.current = next;
      setTState(next);
      rafRef.current = requestAnimationFrame(tickFrame);
    };
    rafRef.current = requestAnimationFrame(tickFrame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTickRef.current = null;
    };
  }, [playing, tAtPlayElapsed]);

  const togglePlay = useCallback(() => {
    const { start, end } = replayWindowRef.current;
    if (tRef.current >= end - 0.001) {
      setT(start);
      playElapsedRef.current = 0;
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  }, [setT]);

  const restart = useCallback(() => {
    const { start } = replayWindowRef.current;
    setT(start);
    playElapsedRef.current = 0;
    setPlaying(true);
  }, [setT]);

  const caseMeta = caseData?.case;
  const events = useMemo(() => caseData?.events || [], [caseData]);
  const windowHours = caseMeta?.windowHours || 72;
  const tickHours = caseMeta?.tickHours || 6;
  const maxSteps = caseMeta?.maxSteps || 12;
  const maxContacts = caseMeta?.maxContacts || 3;
  const recoveredAt = caseMeta?.recoveredAt ?? 0.833;

  const activeEventIndex = useMemo(() => {
    let idx = -1;
    for (let i = 0; i < events.length; i += 1) {
      if (events[i].t <= t) idx = i;
      else break;
    }
    return idx;
  }, [events, t]);

  const activeEvent = activeEventIndex >= 0 ? events[activeEventIndex] : null;

  const recoveryProb = useMemo(() => {
    if (caseMeta?.recoveredAt != null && t >= caseMeta.recoveredAt) return 1;
    const rollout = caseData?.rollout || [];
    let step = rollout[0];
    for (const s of rollout) {
      if (s.t <= t) step = s;
      else break;
    }
    if (step?.belief_p != null) return step.belief_p;
    return sampleCurve(caseData?.recoveryCurve, t);
  }, [caseData, caseMeta, t]);

  const stage = useMemo(() => {
    const stages = caseData?.stages || [];
    let current = stages[0] || null;
    for (const s of stages) {
      if (s.from <= t) current = s;
      else break;
    }
    return current;
  }, [caseData, t]);

  const hoursSince = t * windowHours;
  const tick = Math.min(maxSteps - 1, Math.floor(t * maxSteps));

  const contactsUsed = useMemo(() => {
    const ledger = caseData?.trustLedger || [];
    return ledger.reduce((acc, e) => (e.t <= t ? acc + 1 : acc), 0);
  }, [caseData, t]);

  const trustRemaining = maxContacts - contactsUsed;

  const scriptedIntervention = useMemo(() => {
    if (!caseData || !stage) return null;
    return caseData.interventions?.[stage.key] || null;
  }, [caseData, stage]);

  useEffect(() => {
    if (!caseMeta) return undefined;
    let cancelled = false;
    setPolicyError(null);
    axios
      .post(
        `${API}/policy/recommend`,
        {
          tick,
          contacts_used: contactsUsed,
          method: caseMeta.method,
          hours_since_failure: Math.round(hoursSince * 10) / 10,
          wedge: caseMeta.wedge,
          case_id: caseMeta.id,
          amount_inr: caseMeta.amount,
          failure_reason: caseMeta.failureReason,
        },
        { timeout: 30000 }
      )
      .then((r) => {
        if (!cancelled) {
          setLivePolicy(r.data);
          setPolicyError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLivePolicy(null);
          setPolicyError(err.response?.data?.detail || err.message || 'Policy API unavailable');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [caseMeta, tick, contactsUsed, hoursSince]);

  const intervention = useMemo(() => {
    if (livePolicy?.selected_action) {
      const action = livePolicy.selected_action;
      const q = livePolicy.q_values?.[action] ?? 0;
      const maxQ = Math.max(...Object.values(livePolicy.q_values || { wait: 0 }));
      const confidence = maxQ > 0 ? Math.min(0.95, 0.5 + (q / maxQ) * 0.45) : 0.6;
      return {
        action,
        channel: CHANNEL_FOR_ACTION[action] || 'Internal',
        timing: `Tick ${tick + 1} · T+${Math.round(tick * tickHours)}h`,
        message:
          livePolicy.note ||
          scriptedIntervention?.message ||
          `${caseMeta?.agentName || 'Recovery agent'} recommends ${action.replace(/_/g, ' ')}.`,
        incentive: scriptedIntervention?.incentive || null,
        confidence,
        source: 'live_policy',
        agentName: livePolicy.agent_name || caseMeta?.agentName,
        wedge: livePolicy.wedge || caseMeta?.wedge,
      };
    }
    return scriptedIntervention;
  }, [livePolicy, scriptedIntervention, tick, tickHours, caseMeta]);

  const rolloutSteps = useMemo(() => caseData?.rollout || [], [caseData]);

  const currentRolloutStep = useMemo(() => {
    if (!rolloutSteps.length) return null;
    let step = rolloutSteps[0];
    for (const s of rolloutSteps) {
      if (s.t <= t) step = s;
      else break;
    }
    return step;
  }, [rolloutSteps, t]);

  const currentStepIndex = useMemo(() => {
    if (!currentRolloutStep) return 0;
    const idx = rolloutSteps.findIndex((s) => s.step === currentRolloutStep.step);
    return idx >= 0 ? idx : 0;
  }, [rolloutSteps, currentRolloutStep]);

  useEffect(() => {
    if (!pitchMode || !playing) {
      prevStepIndexRef.current = currentStepIndex;
      return;
    }
    if (
      prevStepIndexRef.current !== null &&
      currentStepIndex !== prevStepIndexRef.current
    ) {
      setPlaying(false);
    }
    prevStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex, pitchMode, playing]);

  const stageMode = useMemo(() => {
    if (t >= recoveredAt - 0.001) return 'outcome';
    const type = activeEvent?.type;
    if (type === 'policy_eval') return 'policy';
    if (type === 'intervention') return 'intervene';
    if (type === 'captured') return 'outcome';
    if (type === 'failure') return 'failure';
    if (type === 'retry_failed' || type === 'customer_drop') return 'intervene';
    return 'observe';
  }, [activeEvent, recoveredAt, t]);

  const brainSelectedAction = useMemo(() => {
    if (livePolicy?.selected_action) return livePolicy.selected_action;
    if (currentRolloutStep?.ui_action) return currentRolloutStep.ui_action;
    return '';
  }, [livePolicy, currentRolloutStep]);

  const brainGuardrailActive = useMemo(() => {
    const enforced = livePolicy?.guardrails?.filter((g) => g.status === 'enforced') || [];
    return enforced.length > 0;
  }, [livePolicy]);

  const brainPipelineStep = useMemo(() => {
    const enforced = livePolicy?.guardrails?.filter((g) => g.status === 'enforced') || [];
    if (activeEvent?.type === 'policy_eval' && livePolicy) {
      if (enforced.length > 0) return 2;
      if (livePolicy.selected_action) return 5;
      return 3;
    }
    if (stageMode === 'outcome') return 5;
    if (currentStepIndex === 0 && t < 0.05) return 0;
    const stepPhase = currentStepIndex % 4;
    if (playing) return Math.min(5, 2 + stepPhase);
    return Math.min(5, 1 + stepPhase);
  }, [activeEvent, livePolicy, stageMode, currentStepIndex, t, playing]);

  const brainThinking = useMemo(() => {
    if (playing && brainPipelineStep < 5) return true;
    return activeEvent?.type === 'policy_eval' && !livePolicy?.selected_action;
  }, [playing, brainPipelineStep, activeEvent, livePolicy]);

  const displayAmount = useMemo(() => {
    const amount = caseMeta?.amount || 0;
    if (t >= recoveredAt - 0.001) return { atRisk: 0, captured: amount, label: 'recovered' };
    return { atRisk: amount, captured: 0, label: 'at_risk' };
  }, [caseMeta, recoveredAt, t]);

  const recovered = t >= recoveredAt;
  const mode = playing ? 'Replaying' : 'Paused';
  const replaySpan = replayWindow.end - replayWindow.start || 1;
  const replayProgress = Math.max(0, Math.min(1, (t - replayWindow.start) / replaySpan));

  const jumpToEvent = useCallback(
    (dir) => {
      if (!events.length) return;
      setPlaying(false);
      const { start, end } = replayWindowRef.current;
      if (dir > 0) {
        const next = events.find((e) => e.t > tRef.current + 0.001);
        setT(next ? next.t : end);
      } else {
        const prev = [...events].reverse().find((e) => e.t < tRef.current - 0.001);
        setT(prev ? prev.t : start);
      }
    },
    [events, setT]
  );

  const clockAt = useCallback(
    (tt) => {
      if (!caseData) return '--:--';
      const start = new Date(caseData.case.failedAt).getTime();
      const d = new Date(start + tt * windowHours * 3600000);
      return d.toLocaleString('en-IN', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Kolkata',
      });
    },
    [caseData, windowHours]
  );

  const elapsedLabel = useMemo(() => {
    const wedge = caseMeta?.wedge;
    if (wedge) return formatWedgeElapsed(wedge, t, windowHours);
    return `T+${Math.round(t * windowHours)}h`;
  }, [caseMeta, t, windowHours]);

  const toggleGhostOverlay = useCallback(() => setGhostOverlay((g) => !g), []);

  const activeAgent = useMemo(() => {
    if (!caseMeta) return null;
    return (
      agents.find((a) => a.id === caseMeta.wedge) || {
        id: caseMeta.wedge,
        name: caseMeta.agentName,
        tick_hours: tickHours,
        window_hours: windowHours,
        max_steps: maxSteps,
        policy_version: caseMeta.policyVersion,
      }
    );
  }, [agents, caseMeta, tickHours, windowHours, maxSteps]);

  const goToStep = useCallback(
    (stepIdx) => {
      if (!rolloutSteps.length) return;
      const idx = Math.max(0, Math.min(rolloutSteps.length - 1, stepIdx));
      setPlaying(false);
      setT(rolloutSteps[idx].t);
    },
    [rolloutSteps, setT]
  );

  const value = {
    caseData,
    agents,
    activeAgent,
    loadError,
    policyError,
    loadInitial,
    loadCase,
    t,
    setT,
    replayWindow,
    replayProgress,
    setReplayProgress,
    playing,
    setPlaying,
    togglePlay,
    restart,
    speed,
    setSpeed,
    pitchMode,
    setPitchMode,
    playDurationMs: getPlayDurationMs(speed),
    events,
    activeEventIndex,
    activeEvent,
    recoveryProb,
    stage,
    stageMode,
    rolloutSteps,
    currentRolloutStep,
    currentStepIndex,
    displayAmount,
    wedgeSummary,
    brainPipelineStep,
    brainThinking,
    brainGuardrailActive,
    brainSelectedAction,
    tick,
    tickHours,
    maxSteps,
    windowHours,
    hoursSince,
    contactsUsed,
    maxContacts,
    trustRemaining,
    intervention,
    livePolicy,
    scriptedIntervention,
    recovered,
    recoveredAt,
    mode,
    jumpToEvent,
    goToStep,
    clockAt,
    elapsedLabel,
    ghostOverlay,
    setGhostOverlay,
    toggleGhostOverlay,
    apiBase: BACKEND_URL,
  };

  return (
    <TimelineContext.Provider value={value}>{children}</TimelineContext.Provider>
  );
};

export const useTimeline = () => {
  const ctx = useContext(TimelineContext);
  if (!ctx) throw new Error('useTimeline must be used inside TimelineProvider');
  return ctx;
};
