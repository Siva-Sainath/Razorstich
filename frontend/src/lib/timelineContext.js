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
import { FALLBACK_CASE } from './mockCase';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const PLAY_DURATION_MS = 75000; // one full 72h episode sweep in demo time
const RECOVERED_AT = 0.833; // T+60h

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

export const TimelineProvider = ({ children }) => {
  const [caseData, setCaseData] = useState(null);
  const [dataSource, setDataSource] = useState('loading');
  const [t, setTState] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const rafRef = useRef(null);
  const lastTickRef = useRef(null);
  const tRef = useRef(0);
  const speedRef = useRef(1);

  useEffect(() => {
    tRef.current = t;
  }, [t]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${API}/case/current`, { timeout: 8000 })
      .then((res) => {
        if (!cancelled) {
          setCaseData(res.data);
          setDataSource('api');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCaseData(FALLBACK_CASE);
          setDataSource('fallback');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (caseData) {
      const id = setTimeout(() => setPlaying(true), 1400);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [caseData]);

  const setT = useCallback((next) => {
    const clamped = Math.max(0, Math.min(1, next));
    tRef.current = clamped;
    setTState(clamped);
  }, []);

  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTickRef.current = null;
      return undefined;
    }
    const tick = (now) => {
      if (lastTickRef.current == null) lastTickRef.current = now;
      const dt = now - lastTickRef.current;
      lastTickRef.current = now;
      const next = tRef.current + (dt / PLAY_DURATION_MS) * speedRef.current;
      if (next >= 1) {
        tRef.current = 1;
        setTState(1);
        setPlaying(false);
        return;
      }
      tRef.current = next;
      setTState(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTickRef.current = null;
    };
  }, [playing]);

  const togglePlay = useCallback(() => {
    if (tRef.current >= 1) {
      setT(0);
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  }, [setT]);

  const restart = useCallback(() => {
    setT(0);
    setPlaying(true);
  }, [setT]);

  // ---- Derived state (single source of truth: t) ----
  const events = caseData?.events || [];
  const windowHours = caseData?.case?.windowHours || 72;
  const maxContacts = caseData?.case?.maxContacts || 3;

  const activeEventIndex = useMemo(() => {
    let idx = -1;
    for (let i = 0; i < events.length; i += 1) {
      if (events[i].t <= t) idx = i;
      else break;
    }
    return idx;
  }, [events, t]);

  const activeEvent = activeEventIndex >= 0 ? events[activeEventIndex] : null;

  const recoveryProb = useMemo(
    () => sampleCurve(caseData?.recoveryCurve, t),
    [caseData, t]
  );

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
  const tick = Math.min(11, Math.floor(t * 12));

  const contactsUsed = useMemo(() => {
    const ledger = caseData?.trustLedger || [];
    return ledger.reduce((acc, e) => (e.t <= t ? acc + 1 : acc), 0);
  }, [caseData, t]);

  const trustRemaining = maxContacts - contactsUsed;

  const intervention = useMemo(() => {
    if (!caseData || !stage) return null;
    return caseData.interventions?.[stage.key] || null;
  }, [caseData, stage]);

  const recovered = t >= RECOVERED_AT;
  const mode = playing ? 'Replaying' : 'Paused';

  const jumpToEvent = useCallback(
    (dir) => {
      if (!events.length) return;
      setPlaying(false);
      if (dir > 0) {
        const next = events.find((e) => e.t > tRef.current + 0.001);
        setT(next ? next.t : 1);
      } else {
        const prev = [...events].reverse().find((e) => e.t < tRef.current - 0.001);
        setT(prev ? prev.t : 0);
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

  const elapsedLabel = useMemo(() => `T+${Math.round(t * windowHours)}h`, [t, windowHours]);

  const value = {
    caseData,
    dataSource,
    t,
    setT,
    playing,
    setPlaying,
    togglePlay,
    restart,
    speed,
    setSpeed,
    events,
    activeEventIndex,
    activeEvent,
    recoveryProb,
    stage,
    tick,
    hoursSince,
    contactsUsed,
    maxContacts,
    trustRemaining,
    intervention,
    recovered,
    mode,
    jumpToEvent,
    clockAt,
    elapsedLabel,
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
