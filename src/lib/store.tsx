import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { ALL_TASK_IDS, SUBJECT_ORDER, WEEKS, type SubjectKey } from '../data/roadmap';
import { addDays, diffDays, isoDate, parseISO, todayKey } from './date';
import { useCloudSync, type CloudSync } from './useCloudSync';

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

export type SessionKind = 'drill' | 'evening' | 'clinic';
export type SessionOutcome = 'correct' | 'wrong' | 'skipped';

export type SessionItem = {
  id: string;
  topic: string;
  outcome: SessionOutcome;
  reason?: Reason;
  secs: number;
};

/** One run of the plan's locked question hour (or the evening / Thursday block). */
export type DrillSession = {
  id: string;
  day: string;
  week: number;
  kind: SessionKind;
  target: number;
  perItemSecs: number;
  subject?: SubjectKey;
  startedAt: number;
  endedAt?: number;
  items: SessionItem[];
  autoLogged: boolean;
};

export type MockSubjectScore = { q: number; correct: number };

/** A full 100-question national mock or a timed half-paper (Phase 3). */
export type MockExam = {
  id: string;
  day: string;
  week: number;
  label: string;
  total: number;
  correct: number;
  blank: number;
  mins: number;
  subjects: Partial<Record<SubjectKey, MockSubjectScore>>;
  note?: string;
};

/** A member of the study group, verified at the Thursday night sync. */
export type Peer = {
  id: string;
  name: string;
  stem: number;
  taught: boolean;
  locked: boolean;
  note?: string;
};

/** Local, non-destructive edits to a roadmap week (school reality beats the plan). */
export type WeekOverride = {
  swapped?: boolean;
  catchUp?: string;
  note?: string;
};

export type Reminders = {
  windDown: boolean;
  wake: boolean;
  drill: boolean;
  lastFired: Record<string, string>;
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
  sessions: DrillSession[];
  mocks: MockExam[];
  peers: Peer[];
  overrides: Record<string, WeekOverride>;
  retro: Record<string, string>;
  reminders: Reminders;
  onboarded: boolean;
  lastVisit: string;
  /** Monotonic revision for cloud sync — every data-changing action bumps it. */
  rev: number;
  /** Wall clock of the last change, used to break a rev tie between devices. */
  updatedAt: number;
};

export const STORAGE_KEY = 'sage.euee.v5';
/** The plan's own totals, used for pace projection. */
const PROGRAM_DAYS_TOTAL = 168;
const PLAN_QUESTION_TARGET = 2720 + 960;

const defaultStart = () => isoDate(new Date());
const defaultExam = () => isoDate(addDays(new Date(), 24 * 7));

export const emptyState = (): State => ({
  v: 6,
  name: '',
  programStart: defaultStart(),
  examDate: defaultExam(),
  groupSize: 5,
  done: {},
  days: {},
  entries: [],
  sessions: [],
  mocks: [],
  peers: [],
  overrides: {},
  retro: {},
  reminders: { windDown: true, wake: true, drill: false, lastFired: {} },
  onboarded: false,
  lastVisit: todayKey(),
  rev: 0,
  updatedAt: 0,
});

/* ------------------------------------------------------------------ *
 * Reducer
 * ------------------------------------------------------------------ */

export type Action =
  | { type: 'field'; key: 'name' | 'programStart' | 'examDate' | 'groupSize'; value: string | number }
  | { type: 'toggleTask'; id: string }
  | { type: 'setTasks'; ids: string[]; value: boolean }
  | { type: 'bump'; day: string; field: DrillFields; delta: number }
  | { type: 'flag'; day: string; field: 'lightsOut' | 'up3am'; value?: boolean }
  | { type: 'habit'; day: string; habit: string }
  | { type: 'addEntry'; entry: Omit<ErrorEntry, 'id' | 'created'> }
  | { type: 'patchEntry'; id: string; patch: Partial<ErrorEntry> }
  | { type: 'delEntry'; id: string }
  | { type: 'startSession'; week: number; kind: SessionKind; target: number; perItemSecs: number; subject?: SubjectKey }
  | { type: 'logItem'; sessionId: string; item: Omit<SessionItem, 'id'> }
  | { type: 'undoItem'; sessionId: string; itemId: string }
  | { type: 'endSession'; sessionId: string; autoLog: boolean; dayKey: string }
  | { type: 'delSession'; sessionId: string }
  | { type: 'addMock'; mock: Omit<MockExam, 'id' | 'day'> }
  | { type: 'delMock'; id: string }
  | { type: 'addPeer'; name: string }
  | { type: 'patchPeer'; id: string; patch: Partial<Peer> }
  | { type: 'delPeer'; id: string }
  | { type: 'setOverride'; week: number; patch: WeekOverride }
  | { type: 'setRetro'; week: number; text: string }
  | { type: 'setReminder'; field: 'windDown' | 'wake' | 'drill'; value: boolean }
  | { type: 'markFired'; key: string }
  | { type: 'shiftStart'; days: number }
  | { type: 'setOnboarded'; value: boolean }
  | { type: 'import'; state: State }
  | { type: 'hydrate'; state: State }
  | { type: 'reset' };

const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const blankDay = (): DayLog => ({ stem: 0, evening: 0, sat: 0, eng: 0, lightsOut: false, up3am: false, habits: [] });

function day(state: State, key: string): DayLog {
  return state.days[key] ?? blankDay();
}

/** A pull from the cloud replaces the whole state verbatim — it must not look like a local edit. */
const NO_REV_BUMP = new Set<Action['type']>(['hydrate']);

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
    case 'startSession':
      return {
        ...state,
        sessions: [
          {
            id: uid('s'),
            day: todayKey(),
            week: clampNum(action.week, 1, 24),
            kind: action.kind,
            target: clampNum(action.target, 1, 200),
            perItemSecs: clampNum(action.perItemSecs, 15, 900),
            subject: action.subject,
            startedAt: Date.now(),
            items: [],
            autoLogged: false,
          },
          ...state.sessions,
        ],
      };
    case 'logItem':
      return {
        ...state,
        sessions: state.sessions.map((sn) =>
          sn.id === action.sessionId ? { ...sn, items: [...sn.items, { ...action.item, id: uid('i') }] } : sn,
        ),
      };
    case 'undoItem':
      return {
        ...state,
        sessions: state.sessions.map((sn) =>
          sn.id === action.sessionId ? { ...sn, items: sn.items.filter((it) => it.id !== action.itemId) } : sn,
        ),
      };
    case 'endSession': {
      const sn = state.sessions.find((x) => x.id === action.sessionId);
      if (!sn || sn.endedAt) return state;
      const wrong = sn.items.filter((i) => i.outcome === 'wrong');
      const field: DrillFields = sn.kind === 'drill' ? 'stem' : sn.kind === 'evening' ? 'evening' : 'sat';
      const d = day(state, action.dayKey);
      const sessions = state.sessions.map((x) =>
        x.id === sn.id ? { ...x, endedAt: Date.now(), autoLogged: action.autoLog } : x,
      );
      const entries =
        action.autoLog && wrong.length
          ? [
              ...wrong.map((i) => ({
                id: uid('e'),
                created: action.dayKey,
                week: sn.week,
                subject: sn.subject ?? (sn.kind === 'clinic' ? 'english' : 'math'),
                topic: i.topic || 'Untitled miss',
                year: '',
                reason: i.reason ?? 'concept-gap',
                rule: '',
                cleared: false,
              })),
              ...state.entries,
            ]
          : state.entries;
      const days = {
        ...state.days,
        [action.dayKey]: { ...d, [field]: Math.min(400, d[field] + sn.items.length) },
      };
      return { ...state, sessions, entries, days };
    }
    case 'delSession':
      return { ...state, sessions: state.sessions.filter((x) => x.id !== action.sessionId) };
    case 'addMock':
      return { ...state, mocks: [{ ...action.mock, id: uid('m'), day: todayKey() }, ...state.mocks] };
    case 'delMock':
      return { ...state, mocks: state.mocks.filter((m) => m.id !== action.id) };
    case 'addPeer': {
      const name = action.name.trim().slice(0, 24);
      if (!name) return state;
      return { ...state, peers: [...state.peers, { id: uid('p'), name, stem: 0, taught: false, locked: false }] };
    }
    case 'patchPeer':
      return { ...state, peers: state.peers.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)) };
    case 'delPeer':
      return { ...state, peers: state.peers.filter((p) => p.id !== action.id) };
    case 'setOverride': {
      const key = String(action.week);
      const next = { ...(state.overrides[key] ?? {}), ...action.patch };
      const clean = Object.fromEntries(Object.entries(next).filter(([, v]) => v !== undefined && v !== '' && v !== false));
      const overrides = { ...state.overrides };
      if (Object.keys(clean).length) overrides[key] = clean as WeekOverride;
      else delete overrides[key];
      return { ...state, overrides };
    }
    case 'setRetro': {
      const retro = { ...state.retro };
      const text = action.text.slice(0, 1200);
      if (text.trim()) retro[String(action.week)] = text;
      else delete retro[String(action.week)];
      return { ...state, retro };
    }
    case 'setReminder':
      return { ...state, reminders: { ...state.reminders, [action.field]: action.value } };
    case 'markFired':
      return { ...state, reminders: { ...state.reminders, lastFired: { ...state.reminders.lastFired, [action.key]: todayKey() } } };
    case 'shiftStart':
      return { ...state, programStart: isoDate(addDays(parseISO(state.programStart), action.days)) };
    case 'setOnboarded':
      return { ...state, onboarded: action.value };
    case 'import':
    case 'hydrate':
      // a pulled row is somebody else's JSON: same validation gate as a local load
      return sanitize(action.state);
    case 'reset':
      return {
        ...emptyState(),
        name: state.name,
        programStart: state.programStart,
        examDate: state.examDate,
        groupSize: state.groupSize,
        reminders: state.reminders,
        onboarded: state.onboarded,
      };
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

  const sessions: DrillSession[] = Array.isArray(s.sessions)
    ? s.sessions
        .filter((x) => x && typeof x === 'object')
        .slice(0, 200)
        .map((x) => ({
          id: String(x.id ?? uid('s')),
          day: /^\d{4}-\d{2}-\d{2}$/.test(String(x.day)) ? String(x.day) : todayKey(),
          week: clampNum(Number(x.week) || 1, 1, 24),
          kind: (['drill', 'evening', 'clinic'] as string[]).includes(String(x.kind)) ? (x.kind as DrillSession['kind']) : 'drill',
          target: clampNum(Number(x.target) || 15, 1, 200),
          perItemSecs: clampNum(Number(x.perItemSecs) || 90, 15, 900),
          subject: (SUBJECT_ORDER as string[]).includes(String(x.subject)) ? (x.subject as SubjectKey) : undefined,
          startedAt: Number(x.startedAt) || Date.now(),
          endedAt: Number(x.endedAt) || undefined,
          autoLogged: Boolean(x.autoLogged),
          items: Array.isArray(x.items)
            ? x.items.slice(0, 250).map((i) => ({
                id: String(i?.id ?? uid('i')),
                topic: String(i?.topic ?? '').slice(0, 120),
                outcome: (['correct', 'wrong', 'skipped'] as string[]).includes(String(i?.outcome))
                  ? (i.outcome as DrillSession['items'][number]['outcome'])
                  : 'correct',
                reason: REASONS.find((r) => r.key === i?.reason)?.key,
                secs: clampNum(Number(i?.secs) || 0, 0, 3600),
              }))
            : [],
        }))
    : [];

  const mocks: MockExam[] = Array.isArray(s.mocks)
    ? s.mocks
        .filter((m) => m && typeof m === 'object')
        .slice(0, 120)
        .map((m) => {
          const total = clampNum(Number(m.total) || 0, 0, 300);
          const subjects: MockExam['subjects'] = {};
          for (const k of SUBJECT_ORDER) {
            const v = m.subjects?.[k];
            if (!v) continue;
            const q = clampNum(Number(v.q) || 0, 0, 300);
            subjects[k] = { q, correct: clampNum(Number(v.correct) || 0, 0, q) };
          }
          return {
            id: String(m.id ?? uid('m')),
            day: /^\d{4}-\d{2}-\d{2}$/.test(String(m.day)) ? String(m.day) : todayKey(),
            week: clampNum(Number(m.week) || 1, 1, 24),
            label: String(m.label ?? 'Mock exam').slice(0, 60),
            total,
            correct: clampNum(Number(m.correct) || 0, 0, total),
            blank: clampNum(Number(m.blank) || 0, 0, total),
            mins: clampNum(Number(m.mins) || 0, 0, 900),
            subjects,
            note: m.note ? String(m.note).slice(0, 600) : undefined,
          };
        })
    : [];

  const peers: Peer[] = Array.isArray(s.peers)
    ? s.peers
        .filter((p) => p && typeof p === 'object')
        .slice(0, 40)
        .map((p) => ({
          id: String(p.id ?? uid('p')),
          name: String(p.name ?? 'Member').slice(0, 24),
          stem: clampNum(Number(p.stem) || 0, 0, 400),
          taught: Boolean(p.taught),
          locked: Boolean(p.locked),
          note: p.note ? String(p.note).slice(0, 200) : undefined,
        }))
    : [];

  const overrides: Record<string, WeekOverride> = {};
  for (const [k, v] of Object.entries(s.overrides ?? {})) {
    if (!v || typeof v !== 'object') continue;
    const o: WeekOverride = {};
    if (v.swapped) o.swapped = true;
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(v.catchUp))) o.catchUp = String(v.catchUp);
    if (typeof v.note === 'string' && v.note.trim()) o.note = v.note.slice(0, 300);
    if (Object.keys(o).length) overrides[String(clampNum(Number(k), 1, 24))] = o;
  }

  const retro: Record<string, string> = {};
  for (const [k, v] of Object.entries(s.retro ?? {})) {
    if (typeof v === 'string' && v.trim()) retro[String(clampNum(Number(k), 1, 24))] = v.slice(0, 1200);
  }

  const rm = s.reminders;
  const reminders: Reminders = {
    windDown: rm?.windDown ?? true,
    wake: rm?.wake ?? true,
    drill: rm?.drill ?? false,
    lastFired: rm?.lastFired && typeof rm.lastFired === 'object' ? rm.lastFired : {},
  };

  return {
    ...base,
    onboarded: Boolean(s.onboarded),
    sessions,
    mocks,
    peers,
    overrides,
    retro,
    reminders,
    name: typeof s.name === 'string' ? s.name.slice(0, 40) : '',
    programStart: typeof s.programStart === 'string' ? s.programStart : base.programStart,
    examDate: typeof s.examDate === 'string' ? s.examDate : base.examDate,
    groupSize: clampNum(Number(s.groupSize) || 5, 1, 40),
    done,
    days,
    entries,
    lastVisit: todayKey(),
    rev: clampNum(Number(s.rev) || 0, 0, Number.MAX_SAFE_INTEGER),
    updatedAt: Number.isFinite(Number(s.updatedAt)) ? Number(s.updatedAt) : 0,
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

  // Readiness: 60% checklist, 25% drill volume vs plan, 15% notebook + sleep hygiene;
  // once a mock exists, 15 points move from the first two onto the actual score.
  const plannedQuestions = WEEKS.slice(0, currentWeek).reduce((s, w) => s + w.weeklyQuestions + 40, 0);
  const volumeScore = plannedQuestions ? Math.min(1, (totals.stem + totals.evening + totals.sat + totals.eng) / plannedQuestions) : 0;
  const errorScore = state.entries.length ? clearedErrors / state.entries.length : 0;
  /* ---- mock ledger ---- */
  // addMock prepends, so a same-day sitting is earlier in `state.mocks` only if it is older.
  const mockSeries = state.mocks
    .map((m, i) => ({ m, i }))
    .sort((a, b) => (a.m.day === b.m.day ? b.i - a.i || b.m.week - a.m.week : a.m.day < b.m.day ? -1 : 1))
    .map((x) => x.m);
  const mockPcts = mockSeries.map((m) => (m.total ? m.correct / m.total : 0));
  const mockCount = state.mocks.length;
  const mockAvg = mockPcts.length ? mockPcts.reduce((a, b) => a + b, 0) / mockPcts.length : 0;
  const mockLatest = mockPcts.length ? mockPcts[mockPcts.length - 1] : 0;
  const mockDelta = mockPcts.length > 1 ? mockPcts[mockPcts.length - 1] - mockPcts[mockPcts.length - 2] : 0;
  // 35% -> nothing banked, 85%+ -> full credit; the roadmap's own "100 → 160" band.
  const mockScore = mockPcts.length ? Math.max(0, Math.min(1, (mockPcts[mockPcts.length - 1] - 0.35) / 0.5)) : null;

  const hygiene = 0.5 * errorScore + 0.5 * sleepPct;
  /* Before the first sitting there is no score to weight, so readiness stays on the
     original 60/25/15 split; once a mock exists, 15 points move to actual performance. */
  const readiness = mockScore === null
    ? Math.round(100 * (0.6 * completion + 0.25 * volumeScore + 0.15 * hygiene))
    : Math.round(100 * (0.5 * completion + 0.2 * volumeScore + 0.15 * hygiene + 0.15 * mockScore));

  /* ---- sessions: the locked question hour, actually instrumented ---- */
  const loggedItems = state.sessions.reduce((a, x) => a + x.items.length, 0);
  const correctItems = state.sessions.reduce((a, x) => a + x.items.filter((i) => i.outcome === 'correct').length, 0);
  const accuracy = loggedItems ? correctItems / loggedItems : 0;
  const openSession = state.sessions.find((x) => !x.endedAt) ?? null;
  const itemsToday = state.sessions.filter((x) => x.day === todayKey()).reduce((a, x) => a + x.items.length, 0);

  /* ---- costliest topics: the plan's "rank the 10 costliest" ritual ---- */
  const topicMap = new Map<string, { topic: string; count: number; open: number; subject: SubjectKey }>();
  for (const e of state.entries) {
    const key = e.topic.trim().toLowerCase().slice(0, 42) || 'untitled';
    const cur = topicMap.get(key) ?? { topic: e.topic.trim() || 'Untitled miss', count: 0, open: 0, subject: e.subject };
    cur.count += 1;
    if (!e.cleared) cur.open += 1;
    topicMap.set(key, cur);
  }
  for (const sn of state.sessions)
    for (const it of sn.items) {
      if (sn.autoLogged) continue; // already an entry, counted above
      if (it.outcome === 'correct' || !it.topic.trim()) continue;
      const key = it.topic.trim().toLowerCase().slice(0, 42);
      const cur = topicMap.get(key) ?? { topic: it.topic.trim(), count: 0, open: 1, subject: sn.subject ?? ('math' as SubjectKey) };
      cur.count += 1;
      cur.open += 1;
      topicMap.set(key, cur);
    }
  const costliest = [...topicMap.values()].sort((a, b) => b.count - a.count || b.open - a.open).slice(0, 10);

  /* ---- pace projection: does the volume actually land before exam day? ---- */
  const daysSoFar = Math.max(1, Math.min(PROGRAM_DAYS_TOTAL, dayNumber));
  const perDay = questions / daysSoFar;
  const projected = Math.round(perDay * PROGRAM_DAYS_TOTAL);
  const paceRatio = projected / PLAN_QUESTION_TARGET;

  /* ---- Thursday group readiness ---- */
  const groupTarget = WEEKS[currentWeek - 1]?.weeklyQuestions ?? 60;
  const peersReady = state.peers.filter((p) => p.stem >= groupTarget).length;
  const groupVerified = state.peers.filter((p) => p.stem >= groupTarget && p.taught && p.locked).length;

  /* ---- schedule pressure: plan weeks left vs calendar weeks left ---- */
  const weeksLeftInPlan = 24 - currentWeek + 1;
  const calendarWeeksLeft = daysToExam > 0 ? Math.floor(daysToExam / 7) : 0;
  const scheduleSlip = weeksLeftInPlan - calendarWeeksLeft;

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
    loggedItems,
    accuracy,
    openSession,
    itemsToday,
    sessionCount: state.sessions.length,
    mockCount,
    mockSeries,
    mockScore,
    mockAvg,
    mockLatest,
    mockDelta,
    costliest,
    perDay,
    projected,
    paceRatio,
    peerCount: state.peers.length,
    peersReady,
    groupVerified,
    groupTarget,
    scheduleSlip,
    weeksLeftInPlan,
    calendarWeeksLeft,
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
  cloud: CloudSync;
};

const Ctx = createContext<Store | null>(null);

/** Every mutation carries a revision + timestamp, so two devices can be ordered later. */
function syncedReducer(state: State, action: Action): State {
  const next = reducer(state, action);
  if (next === state || NO_REV_BUMP.has(action.type)) return next;
  return { ...next, rev: state.rev + 1, updatedAt: Date.now() };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(syncedReducer, undefined, load);
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

  const cloud = useCloudSync(state, dispatch);
  const derived = useMemo(() => derive(state), [state]);
  const value = useMemo(() => ({ state, dispatch, derived, storageOk, cloud }), [state, derived, storageOk, cloud]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Reducer-level surface for tests/render.smoke.tsx — the UI must go through useStore(). */
export const __test = { reducer, syncedReducer, sanitize, derive, STORAGE_KEY };

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
