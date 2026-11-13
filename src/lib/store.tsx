import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { ALL_TASK_IDS, SUBJECT_ORDER, WEEKS, type SubjectKey } from '../data/roadmap';
import { addDays, diffDays, isoDate, parseISO, todayKey } from './date';

/* ------------------------------------------------------------------ *
 * Shape of persisted state
 * ------------------------------------------------------------------ */

export type DrillFields = 'stem' | 'evening' | 'sat' | 'eng';

export type DayLog = {
  stem: number;
  evening: number;
  sat: number;
  eng: number;
  lightsOut: boolean;
  up3am: boolean;
  habits: string[];
};

export type Reason = 'formula-gap' | 'sign-error' | 'misread-trap' | 'timed-out' | 'concept-gap' | 'careless';

export const REASONS: { key: Reason; label: string; fix: string }[] = [
  { key: 'formula-gap', label: 'Formula gap', fix: 'Add it to the weekly formula sheet + recall it blind 3×' },
  { key: 'sign-error', label: 'Sign error', fix: 'Circle every sign before moving to the next line' },
  { key: 'misread-trap', label: 'Misread trap', fix: 'Underline what the question actually asks' },
  { key: 'timed-out', label: 'Ran out of time', fix: 'Flag-and-skip drill: 90 s max per MC question' },
  { key: 'concept-gap', label: 'Concept gap', fix: 'Push the chapter to the Friday 3:00 AM buffer' },
  { key: 'careless', label: 'Careless slip', fix: 'Last 5 minutes = bubble-sheet audit only' },
];

export type ErrorEntry = {
  id: string;
  created: string;
  week: number;
  subject: SubjectKey;
  topic: string;
  year: string;
  reason: Reason;
  rule: string;
  cleared: boolean;
};

export type State = {
  v: number;
  name: string;
  programStart: string;
  examDate: string;
  groupSize: number;
  done: Record<string, boolean>;
  days: Record<string, DayLog>;
  entries: ErrorEntry[];
  lastVisit: string;
};

const STORAGE_KEY = 'sage.euee.v5';

const defaultStart = () => isoDate(new Date());
const defaultExam = () => isoDate(addDays(new Date(), 24 * 7));

export const emptyState = (): State => ({
  v: 5,
  name: '',
  programStart: defaultStart(),
  examDate: defaultExam(),
  groupSize: 5,
  done: {},
  days: {},
  entries: [],
  lastVisit: todayKey(),
});

/* ------------------------------------------------------------------ *
 * Reducer
 * ------------------------------------------------------------------ */

type Action =
  | { type: 'field'; key: 'name' | 'programStart' | 'examDate' | 'groupSize'; value: string | number }
  | { type: 'toggleTask'; id: string }
  | { type: 'setTasks'; ids: string[]; value: boolean }
  | { type: 'bump'; day: string; field: DrillFields; delta: number }
  | { type: 'flag'; day: string; field: 'lightsOut' | 'up3am'; value?: boolean }
  | { type: 'habit'; day: string; habit: string }
  | { type: 'addEntry'; entry: Omit<ErrorEntry, 'id' | 'created'> }
  | { type: 'patchEntry'; id: string; patch: Partial<ErrorEntry> }
  | { type: 'delEntry'; id: string }
  | { type: 'import'; state: State }
  | { type: 'reset' };

const blankDay = (): DayLog => ({ stem: 0, evening: 0, sat: 0, eng: 0, lightsOut: false, up3am: false, habits: [] });

function day(state: State, key: string): DayLog {
  return state.days[key] ?? blankDay();
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'field':
      return { ...state, [action.key]: action.value } as State;
    case 'toggleTask':
      return { ...state, done: { ...state.done, [action.id]: !state.done[action.id] } };
    case 'setTasks': {
      const done = { ...state.done };
      for (const id of action.ids) {
        if (action.value) done[id] = true;
        else delete done[id];
      }
      return { ...state, done };
    }
    case 'bump': {
      const d = day(state, action.day);
      const next = Math.max(0, Math.min(400, d[action.field] + action.delta));
      return { ...state, days: { ...state.days, [action.day]: { ...d, [action.field]: next } } };
    }
    case 'flag': {
      const d = day(state, action.day);
      return {
        ...state,
        days: { ...state.days, [action.day]: { ...d, [action.field]: action.value ?? !d[action.field] } },
      };
    }
    case 'habit': {
      const d = day(state, action.day);
      const habits = d.habits.includes(action.habit) ? d.habits.filter((h) => h !== action.habit) : [...d.habits, action.habit];
      return { ...state, days: { ...state.days, [action.day]: { ...d, habits } } };
    }
    case 'addEntry':
      return {
        ...state,
        entries: [
          { ...action.entry, id: `e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, created: todayKey() },
          ...state.entries,
        ],
      };
    case 'patchEntry':
      return { ...state, entries: state.entries.map((e) => (e.id === action.id ? { ...e, ...action.patch } : e)) };
    case 'delEntry':
      return { ...state, entries: state.entries.filter((e) => e.id !== action.id) };
    case 'import':
      return sanitize(action.state);
    case 'reset':
      return { ...emptyState(), name: state.name, programStart: state.programStart, examDate: state.examDate };
    default:
      return state;
  }
}

function sanitize(raw: unknown): State {
  const base = emptyState();
  if (!raw || typeof raw !== 'object') return base;
  const s = raw as Partial<State>;
  const done: Record<string, boolean> = {};
  const valid = new Set(ALL_TASK_IDS);
  for (const [k, v] of Object.entries(s.done ?? {})) if (valid.has(k) && v) done[k] = true;

  const days: Record<string, DayLog> = {};
  for (const [k, v] of Object.entries(s.days ?? {})) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || !v) continue;
    const d = { ...blankDay(), ...v };
    days[k] = {
      ...d,
      stem: clampNum(d.stem, 0, 400),
      evening: clampNum(d.evening, 0, 400),
      sat: clampNum(d.sat, 0, 400),
      eng: clampNum(d.eng, 0, 400),
      habits: Array.isArray(d.habits) ? d.habits.filter((h) => typeof h === 'string') : [],
    };
  }

  const entries: ErrorEntry[] = Array.isArray(s.entries)
    ? s.entries
        .filter((e) => e && typeof e === 'object')
        .map((e) => ({
          id: String(e.id ?? `e${Math.random().toString(36).slice(2, 9)}`),
          created: String(e.created ?? todayKey()),
          week: clampNum(Number(e.week) || 1, 1, 24),
          subject: (SUBJECT_ORDER as string[]).includes(String(e.subject)) ? (e.subject as SubjectKey) : 'math',
          topic: String(e.topic ?? '').slice(0, 120),
          year: String(e.year ?? '').slice(0, 24),
          reason: (REASONS.find((r) => r.key === e.reason)?.key ?? 'concept-gap') as Reason,
          rule: String(e.rule ?? '').slice(0, 400),
          cleared: Boolean(e.cleared),
        }))
    : [];

  return {
    ...base,
    name: typeof s.name === 'string' ? s.name.slice(0, 40) : '',
    programStart: typeof s.programStart === 'string' ? s.programStart : base.programStart,
    examDate: typeof s.examDate === 'string' ? s.examDate : base.examDate,
    groupSize: clampNum(Number(s.groupSize) || 5, 1, 40),
    done,
    days,
    entries,
    lastVisit: todayKey(),
  };
}

const clampNum = (n: number, lo: number, hi: number) => (Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : lo);

/* ------------------------------------------------------------------ *
 * Derived metrics
 * ------------------------------------------------------------------ */

export type Derived = ReturnType<typeof derive>;

function derive(state: State) {
  const doneCount = Object.values(state.done).filter(Boolean).length;
  const totalTasks = ALL_TASK_IDS.length;
  const completion = totalTasks ? doneCount / totalTasks : 0;

  const weekStats = WEEKS.map((w) => {
    const ids = w.tasks.map((t) => t.id);
    const hit = ids.filter((id) => state.done[id]).length;
    return { n: w.n, total: ids.length, hit, pct: ids.length ? hit / ids.length : 0, complete: hit === ids.length };
  });

  const byPhase = { p1a: pct(weekStats, 1, 8), p1b: pct(weekStats, 9, 14), p2: pct(weekStats, 15, 19), p3: pct(weekStats, 20, 24) };
  const completeWeeks = weekStats.filter((w) => w.complete).length;

  const dayKeys = Object.keys(state.days).sort();
  const totals = dayKeys.reduce(
    (acc, k) => {
      const d = state.days[k];
      acc.stem += d.stem;
      acc.evening += d.evening;
      acc.sat += d.sat;
      acc.eng += d.eng;
      return acc;
    },
    { stem: 0, evening: 0, sat: 0, eng: 0 },
  );
  const questions = totals.stem + totals.evening + totals.sat + totals.eng;

  // Streak: consecutive days (ending today or yesterday) with a drill logged or lights-out honoured.
  let streak = 0;
  const cursor = new Date();
  const hasToday = Boolean(state.days[todayKey()]) && (state.days[todayKey()].stem > 0 || state.days[todayKey()].habits.length > 0);
  if (!hasToday) cursor.setDate(cursor.getDate() - 1);
  for (let i = 0; i < 400; i++) {
    const k = isoDate(cursor);
    const d = state.days[k];
    const active = Boolean(d && (d.stem > 0 || d.habits.length >= 2 || d.lightsOut));
    if (!active) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const openErrors = state.entries.filter((e) => !e.cleared).length;
  const clearedErrors = state.entries.length - openErrors;

  const start = parseISO(state.programStart);
  const today = new Date();
  const dayNumber = diffDays(start, today) + 1;
  const currentWeek = Math.min(24, Math.max(1, Math.ceil(dayNumber / 7) || 1));
  const daysToExam = diffDays(today, parseISO(state.examDate));
  const hoursLogged = dayKeys.filter((k) => (state.days[k]?.stem ?? 0) > 0).length;

  const weekly = lastNDays(state, 28).map((d) => ({ key: d.key, value: d.log.stem + d.log.evening, habits: d.log.habits.length }));
  const sleepDays = dayKeys.filter((k) => state.days[k]?.lightsOut).length;
  // Nights held out of the nights that have actually happened so far (max 28, the review window).
  const nightsElapsed = Math.max(1, Math.min(28, Math.max(0, dayNumber)));
  const sleepPct = sleepDays / nightsElapsed;

  const subjectLoad = SUBJECT_ORDER.map((s) => ({ key: s, done: 0, total: 0 }));
  const idx = new Map(subjectLoad.map((s) => [s.key, s]));
  for (const w of WEEKS)
    for (const t of w.tasks) {
      if (!t.subject) continue;
      const bucket = idx.get(t.subject)!;
      bucket.total += 1;
      if (state.done[t.id]) bucket.done += 1;
    }

  // Readiness: 60% checklist, 25% drill volume vs plan, 15% error-notebook hygiene.
  const plannedQuestions = WEEKS.slice(0, currentWeek).reduce((s, w) => s + w.weeklyQuestions + 40, 0);
  const volumeScore = plannedQuestions ? Math.min(1, (totals.stem + totals.evening + totals.sat + totals.eng) / plannedQuestions) : 0;
  const errorScore = state.entries.length ? clearedErrors / state.entries.length : 0;
  const readiness = Math.round(100 * (0.6 * completion + 0.25 * volumeScore + 0.15 * (0.5 * errorScore + 0.5 * sleepPct)));

  return {
    doneCount,
    totalTasks,
    completion,
    weekStats,
    byPhase,
    completeWeeks,
    totals,
    questions,
    streak,
    openErrors,
    clearedErrors,
    entries: state.entries.length,
    dayNumber,
    currentWeek,
    daysToExam,
    hoursLogged,
    weekly,
    sleepDays,
    sleepPct,
    nightsElapsed,
    subjectLoad,
    readiness,
    plannedQuestions,
    volumeScore,
  };
}

function pct(stats: { n: number; hit: number; total: number }[], from: number, to: number) {
  const slice = stats.filter((s) => s.n >= from && s.n <= to);
  const hit = slice.reduce((a, s) => a + s.hit, 0);
  const total = slice.reduce((a, s) => a + s.total, 0);
  return { hit, total, pct: total ? hit / total : 0 };
}

function lastNDays(state: State, n: number) {
  const out: { key: string; log: DayLog }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = addDays(new Date(), -i);
    const key = isoDate(d);
    out.push({ key, log: state.days[key] ?? blankDay() });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Context plumbing + localStorage sync
 * ------------------------------------------------------------------ */

function load(): State {
  if (typeof window === 'undefined') return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    return sanitize(JSON.parse(raw));
  } catch {
    return emptyState();
  }
}

type Store = {
  state: State;
  dispatch: React.Dispatch<Action>;
  derived: Derived;
  storageOk: boolean;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const [storageOk, setStorageOk] = useState(true);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setStorageOk(true);
    } catch {
      setStorageOk(false);
    }
  }, [state]);

  const derived = useMemo(() => derive(state), [state]);
  const value = useMemo(() => ({ state, dispatch, derived, storageOk }), [state, derived, storageOk]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

/** Live ticking clock hook (1 s) for shift countdowns. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
}

/** Smoothly animate a number (used for the big stat tiles). */
export function useCountUp(target: number, ms = 900) {
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(a + (target - a) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

/** Reveal-on-scroll for sections. */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);
  const cb = useCallback((node: T | null) => {
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') return setShown(true);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '-8% 0px -8% 0px' },
    );
    io.observe(node);
    ref.current = node;
  }, []);
  return { ref, shown, cb };
}
