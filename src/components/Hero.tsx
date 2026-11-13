import { useMemo } from 'react';
import { GlowArc, Starfield, TopSpill } from './Background';
import { Icon, Ring, Tag } from './ui';
import { useNow, useStore } from '../lib/store';
import { DAY_SHORT, dayIndex, fmtClock, fmtCountdown, minutesOfDay, todayKey } from '../lib/date';
import { PHASES, SUBJECTS, WEEKS, phaseOf } from '../data/roadmap';
import { cn } from './cn';

/**
 * Which shift the plan says you are in, right now.
 * The 3:00 AM block belongs to the calendar day it wakes (so 00:30 still counts as
 * "tonight's sleep", and Saturday/Sunday afternoon are the zero-drill window).
 */
function liveShift(now: Date) {
  const m = minutesOfDay(now);
  const di = dayIndex(now);
  const rest = di === 0 || di === 6;
  const friAfternoon = di === 5 && m >= 360;
  if (rest || friAfternoon) return { id: 'weekend', label: 'Zero-drill window', note: 'Recharge is engineered into the plan' };
  if (m >= 180 && m < 330) return { id: 'concept', label: 'Concept block', note: '3:00 – 5:30 AM · deep read' };
  if (m >= 330 && m < 390) return { id: 'drill', label: 'Locked drill hour', note: '5:30 – 6:30 AM · 15 questions + error log' };
  if (m >= 390 && m < 480) return { id: 'commute', label: 'Walk to school', note: 'Buffer before the classroom' };
  if (m >= 480 && m < 1020) return { id: 'school', label: 'School hours', note: 'Front zone · clear worksheets in free periods' };
  if (m >= 1020 && m < 1050) return { id: 'prep', label: 'Dinner + bag check', note: 'Reset before the evening shift' };
  if (m >= 1050 && m < 1170)
    return di === 4
      ? { id: 'clinic', label: 'Thursday SAT/English clinic', note: '20 SAT + 20 English + group sync' }
      : { id: 'evening', label: 'Evening shift', note: '45 min homework + 75 min Gr 12 link' };
  if (m >= 1170 && m < 1230) return { id: 'stop', label: 'Hard stop · wind down', note: 'Phone off, bag packed for 3 AM' };
  return { id: 'sleep', label: 'Sleep protected', note: '6.5 h of REM consolidation in progress' };
}

/** Next scheduled boundary in minutes, from the plan's own shift table. */
function nextBoundary(now: Date) {
  const m = minutesOfDay(now);
  const table = [180, 330, 390, 1050, 1170, 1230, 1440];
  const labels = [
    '3:00 AM · morning core shift',
    '5:30 AM · locked drill hour',
    '6:30 AM · books closed',
    '5:30 PM · evening shift',
    '7:30 PM · hard stop',
    '8:30 PM · lights out',
    '3:00 AM · morning core shift',
  ];
  for (let i = 0; i < table.length; i++) if (m < table[i]) return { ms: (table[i] - m) * 60000, label: labels[i] };
  return { ms: (1440 - m + 180) * 60000, label: labels[6] };
}

/** Half-second-ish live strip — isolated so the hero itself never re-renders each second. */
function DeckLive() {
  const now = useNow(1000);
  const shift = useMemo(() => liveShift(now), [Math.floor(now.getTime() / 20000)]);
  const next = useMemo(() => nextBoundary(now), [Math.floor(now.getTime() / 20000)]);
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-glow-400/25 bg-glow-500/[0.09] p-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
          <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-mint/60" />
          <span className="h-2 w-2 rounded-full bg-mint shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
        </span>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold text-white">{shift.label}</div>
          <div className="truncate text-[11.5px] text-glow-200/60">{shift.note}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="num text-[17px] font-semibold tabular-nums text-glow-100">{fmtCountdown(next.ms)}</div>
        <div className="text-[10px] uppercase tracking-[0.13em] text-glow-200/45">to {next.label.split('·')[1]?.trim() ?? next.label}</div>
      </div>
    </div>
  );
}

export function Hero({ onOpenApp }: { onOpenApp: () => void }) {
  const { derived } = useStore();
  const week = WEEKS[derived.currentWeek - 1];
  const phase = phaseOf(week.n);

  return (
    <div id="top" className="relative overflow-hidden pt-[54px] sm:pt-[62px]">
      <GlowArc height={520} apex={86} />
      <Starfield count={150} />
      <div className="pointer-events-none absolute inset-0 grid-fade opacity-70" aria-hidden="true" />

      <div className="shell relative pb-4 pt-20 sm:pt-32">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <span className="pill animate-rise backdrop-blur">
            <Icon name="sparkle" size={12} />
            <span className="hidden sm:inline">Early Access · </span>EUEE 24-Week Playbook V5.0 Pro
          </span>

          <h1 className="mt-5 text-[33px] font-bold leading-[1.02] text-white [text-wrap:balance] sm:mt-6 sm:text-[58px] lg:text-[64px]">
            Own the EUEE With
            <br />
            <span className="blue-text">3 AM Precision</span>
          </h1>

          <p className="muted mt-4 max-w-xl text-[14.5px] sm:mt-5 sm:text-[16px]">
            A sleep-protected study operating system that turns the 24-week master roadmap into a living checklist — 80% Grade
            9–11 mornings, a locked 5:30 AM drill hour, a Thursday SAT/English clinic, and 100% guilt-free weekends.
          </p>

          <div className="mt-6 flex w-full flex-col-reverse items-stretch gap-2.5 sm:mt-7 sm:w-auto sm:flex-row sm:items-center sm:justify-center">
            <button type="button" onClick={onOpenApp} className="btn-light w-full sm:w-auto">
              Open the Command Deck
              <Icon name="arrow" size={15} />
            </button>
            <a href="#shifts" className="btn-ghost w-full sm:w-auto">
              <Icon name="compass" size={15} className="text-glow-300" />
              See the Daily System
            </a>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.14em] text-glow-200/45 sm:text-[11.5px]">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="moon" size={13} className="text-glow-300/70" /> 6.5 h protected sleep
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="coffee" size={13} className="text-glow-300/70" /> zero Friday-afternoon drills
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="target" size={13} className="text-glow-300/70" /> {derived.totalTasks} checkable tasks
            </span>
          </div>
        </div>

        <HeroDeck weekN={week.n} phaseName={phase.name} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The reference's product shot — here it is live, tappable data
 * ------------------------------------------------------------------ */

function HeroDeck({ weekN, phaseName }: { weekN: number; phaseName: string }) {
  const { state, dispatch, derived } = useStore();
  const week = WEEKS[weekN - 1];
  const dayLog = state.days[todayKey()];
  const shown = week.tasks.slice(0, 3);
  const di = dayIndex();

  const metrics = [
    { k: 'stem', label: 'Drill hour', value: dayLog?.stem ?? 0, target: week.drillTarget, color: '#6f9bff' },
    { k: 'evening', label: 'Gr 12 link', value: dayLog?.evening ?? 0, target: 12, color: '#22d3ee' },
    { k: 'sat', label: 'SAT', value: dayLog?.sat ?? 0, target: 20, color: '#fbbf24' },
    { k: 'eng', label: 'English', value: dayLog?.eng ?? 0, target: 20, color: '#f472b6' },
  ] as const;

  return (
    <div className="relative mx-auto mt-10 w-full max-w-[1020px] sm:mt-16">
      <TopSpill />
      <div className="card overflow-hidden !rounded-[22px] p-0 shadow-panel">
        <div className="flex items-center gap-3 border-b border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5 sm:px-4">
          <span className="flex items-center gap-1.5">
            {['#f472b6', '#fbbf24', '#34d399'].map((c) => (
              <span key={c} className="h-2 w-2 rounded-full opacity-70" style={{ background: c }} />
            ))}
          </span>
          <span className="font-display text-[11.5px] font-semibold uppercase tracking-[0.14em] text-glow-200/70 sm:text-[12px] sm:tracking-[0.16em]">
            SAGE · Command Deck
          </span>
          <span className="ml-auto hidden items-center gap-1 text-[11px] tabular-nums text-glow-200/50 sm:flex">
            <ChromeClock />
          </span>
          <span className="ml-auto inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10.5px] uppercase tracking-[0.14em] text-glow-300/80 sm:ml-0">
            {DAY_SHORT[di]}
          </span>
        </div>

        <div className="grid gap-0 md:grid-cols-[210px_1fr_236px]">
          <aside className="hidden flex-col gap-4 border-r border-white/[0.07] bg-white/[0.015] p-4 md:flex">
            <div>
              <div className="label">Active phase</div>
              <div className="space-y-1.5">
                {PHASES.map((p) => {
                  const on = p.key === week.phase;
                  return (
                    <div
                      key={p.key}
                      className={cn('flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] transition', on ? 'bg-white/[0.07] text-white' : 'text-glow-200/50')}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: on ? p.accent : 'rgba(158,193,255,0.28)' }} />
                      {p.name}
                      {on ? <span className="ml-auto text-[10px] uppercase tracking-widest text-glow-300/70">now</span> : null}
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="label">Today&apos;s split</div>
              <div className="space-y-2">
                {week.sides.map((s) => (
                  <div key={s.label} className="flex items-start gap-2">
                    <span className="mt-[5px] h-2 w-2 shrink-0 rounded-full" style={{ background: SUBJECTS[s.subject].color }} />
                    <div className="min-w-0">
                      <div className="text-[11.5px] font-semibold text-glow-100/90">{s.label}</div>
                      <div className="truncate text-[11px] text-glow-200/50">{s.short}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-auto rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
              <div className="label !mb-1">Readiness</div>
              <div className="num text-[26px] font-bold leading-none text-white">
                {derived.readiness}
                <span className="text-[13px] text-glow-300/70">%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(3, derived.completion * 100)}%`, background: 'linear-gradient(90deg,#6f9bff,#9ec1ff)' }}
                />
              </div>
              <div className="mt-1.5 text-[10.5px] text-glow-200/45">
                {derived.doneCount} of {derived.totalTasks} tasks cleared
              </div>
            </div>
          </aside>

          <div className="min-w-0 p-3.5 sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="kicker !text-[10px]">
                  <Icon name="bolt" size={12} className="text-amber" /> {phaseName}
                </div>
                <div className="mt-1.5 font-display text-[18px] font-semibold leading-tight text-white sm:text-[19px]">
                  Week {week.n} · {week.stage}
                </div>
              </div>
              <Ring value={derived.completion} size={52} stroke={5} label={`${Math.round(derived.completion * 100)}%`} sub="plan" />
            </div>

            <DeckLive />

            <div className="mt-3.5 space-y-1.5">
              {shown.map((t) => {
                const checked = Boolean(state.done[t.id]);
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    onClick={() => dispatch({ type: 'toggleTask', id: t.id })}
                    className="tap flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-3 text-left transition hover:border-white/15 hover:bg-white/[0.05] sm:py-2.5"
                  >
                    <span className="checkbox" data-checked={checked}>
                      <Icon name="check" size={12} className={cn('text-ink-950 transition-opacity', checked ? 'opacity-100' : 'opacity-0')} />
                    </span>
                    <span className={cn('min-w-0 flex-1 truncate text-[13px]', checked ? 'text-glow-200/40 line-through' : 'text-glow-100/90')}>{t.label}</span>
                    <Tag className="hidden lg:inline-flex">{t.tag}</Tag>
                  </button>
                );
              })}
            </div>

            <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {metrics.map((m) => (
                <div key={m.k} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[10px] uppercase tracking-[0.12em] text-glow-200/50">{m.label}</span>
                    <span className="num text-[12px] font-semibold" style={{ color: m.color }}>
                      {m.value}
                      <span className="text-glow-200/40">/{m.target}</span>
                    </span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (m.value / m.target) * 100)}%`, background: m.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="hidden flex-col gap-3 border-l border-white/[0.07] bg-white/[0.015] p-4 lg:flex">
            <div className="label !mb-0">Guardrails</div>
            {[
              { icon: 'alarm', t: 'Lights out 8:30 PM', s: dayLog?.lightsOut ? 'Logged tonight ✓' : '6.5 h sleep protected', on: Boolean(dayLog?.lightsOut) },
              { icon: 'flag', t: 'Red-flag notebook', s: `${derived.openErrors} open · ${derived.clearedErrors} cleared`, on: derived.openErrors === 0 },
              { icon: 'users', t: 'Group check-in', s: `${state.groupSize} members · Thu 6:50 PM`, on: true },
              { icon: 'shield', t: 'Weekend lockdown', s: 'No drills Fri PM – Sun', on: true },
            ].map((n) => (
              <div key={n.t} className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.025] p-2.5">
                <span className={cn('mt-[1px] grid h-6 w-6 place-items-center rounded-lg border', n.on ? 'border-mint/40 bg-mint/10 text-mint' : 'border-white/10 bg-white/[0.04] text-glow-300')}>
                  <Icon name={n.icon} size={13} />
                </span>
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-glow-100/90">{n.t}</div>
                  <div className="mt-0.5 text-[11px] leading-snug text-glow-200/50">{n.s}</div>
                </div>
              </div>
            ))}
            <a href="#notebook" className="btn-ghost mt-auto !px-3 !py-2 text-[12px]">
              Open notebook <Icon name="arrow" size={13} />
            </a>
          </aside>
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] text-glow-200/40 sm:mt-4">
        <Icon name="eye" size={12} className="mr-1 inline align-[-2px]" />
        Live preview — every card below is editable and saved to this browser.
      </p>
    </div>
  );
}

function ChromeClock() {
  const now = useNow(1000);
  return (
    <>
      <Icon name="clock" size={12} /> {fmtClock(minutesOfDay(now))}
    </>
  );
}
