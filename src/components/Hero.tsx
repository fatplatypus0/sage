import { useMemo } from 'react';
import { GlowArc, Starfield, TopSpill } from './Background';
import { Icon, Ring, Tag } from './ui';
import { useNow, useStore } from '../lib/store';
import { DAY_SHORT, dayIndex, fmtClock, minutesOfDay } from '../lib/date';
import { PHASES, SUBJECTS, WEEKS, phaseOf } from '../data/roadmap';
import { cn } from './cn';

/** minutes-from-midnight helper that treats the 3 AM shift as belonging to "this calendar day" */
function liveShift(now: Date) {
  const m = minutesOfDay(now);
  const di = dayIndex(now);
  const rest = di === 0 || di === 6;
  const friAfternoon = di === 5 && m >= 360;
  if (rest || friAfternoon) return { id: 'weekend', label: 'Zero-drill window', note: 'Recharge is engineered into the plan', next: 'morning' as const };
  if (m >= 180 && m < 330) return { id: 'concept', label: 'Concept block', note: '3:00 – 5:30 AM · deep read', next: 'drill' as const };
  if (m >= 330 && m < 390) return { id: 'drill', label: 'Locked drill hour', note: '5:30 – 6:30 AM · 15 questions + error log', next: 'school' as const };
  if (m >= 390 && m < 480) return { id: 'commute', label: 'Get dressed & walk', note: 'Buffer before the classroom', next: 'school' as const };
  if (m >= 480 && m < 1020) return { id: 'school', label: 'School hours', note: 'Front zone · clear worksheets in free periods', next: 'evening' as const };
  if (m >= 1020 && m < 1050) return { id: 'prepm', label: 'Dinner + bag check', note: 'Reset before the evening shift', next: 'evening' as const };
  if (m >= 1050 && m < 1170) return { id: 'evening', label: di === 4 ? 'Thursday SAT/English clinic' : 'Evening shift', note: di === 4 ? '20 SAT + 20 English + group sync' : '45 min homework + 75 min Gr 12 link', next: 'stop' as const };
  if (m >= 1170 && m < 1230) return { id: 'stop', label: 'Hard stop · wind down', note: 'Phone off, bag packed for 3 AM', next: 'lightsout' as const };
  if (m >= 1230 || m < 180) return { id: 'lightsout', label: 'Sleep protected', note: '6.5 h of REM consolidation in progress', next: 'morning' as const };
  return { id: 'prepm', label: 'Pre-shift', note: 'Alarm set for 3:00 AM', next: 'morning' as const };
}

/** Next scheduled boundary as an absolute Date, from the plan's shift table. */
function nextBoundary(now: Date) {
  const m = minutesOfDay(now);
  const table: { at: number; label: string }[] = [
    { at: 180, label: '3:00 AM · morning core shift' },
    { at: 330, label: '5:30 AM · locked drill hour' },
    { at: 390, label: '6:30 AM · books closed, to school' },
    { at: 1050, label: '5:30 PM · evening shift' },
    { at: 1170, label: '7:30 PM · hard stop' },
    { at: 1230, label: '8:30 PM · lights out' },
    { at: 1440, label: 'midnight · plan guardrail' },
  ];
  for (const t of table) if (m < t.at) return { ms: (t.at - m) * 60000, label: t.label };
  return { ms: (1440 - m + 180) * 60000, label: '3:00 AM · morning core shift' };
}

export function Hero({ onOpenApp }: { onOpenApp: () => void }) {
  const now = useNow(1000);
  const { derived } = useStore();
  const shift = useMemo(() => liveShift(now), [Math.floor(now.getTime() / 30000)]);
  const next = useMemo(() => nextBoundary(now), [Math.floor(now.getTime() / 30000)]);
  const week = WEEKS[derived.currentWeek - 1];
  const phase = phaseOf(week.n);

  const countdown = fmtCountdownLocal(next.ms);

  return (
    <div id="top" className="relative overflow-hidden pt-[62px]">
      <GlowArc height={540} apex={92} />
      <Starfield count={150} />
      <div className="pointer-events-none absolute inset-0 grid-fade opacity-70" aria-hidden="true" />

      <div className="shell relative pb-4 pt-28 sm:pt-36">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <span className="pill animate-rise backdrop-blur">
            <Icon name="sparkle" size={12} className="text-glow-200" />
            Early Access · EUEE 24-Week Playbook V5.0 Pro
          </span>

          <h1
            className="mt-6 text-[40px] font-bold leading-[0.98] text-white sm:text-[64px]"
            style={{ animation: 'rise 0.8s cubic-bezier(0.22,1,0.36,1) both' }}
          >
            Own the EUEE With
            <br />
            <span className="blue-text">3 AM Precision</span>
          </h1>

          <p className="muted mt-5 max-w-xl text-[15px] sm:text-[16px]">
            A sleep-protected study operating system that turns the 24-week master roadmap into a living checklist — 80%
            Grade 9–11 mornings, a locked 5:30 AM drill hour, a Thursday SAT/English clinic, and 100% guilt-free weekends.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
            <button type="button" onClick={onOpenApp} className="btn-light">
              Open the Command Deck
              <Icon name="arrow" size={15} />
            </button>
            <a href="#shifts" className="btn-ghost">
              <Icon name="compass" size={15} className="text-glow-300" />
              See the Daily System
            </a>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11.5px] uppercase tracking-[0.16em] text-glow-200/45">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="moon" size={13} className="text-glow-300/70" /> 6.5 h protected sleep
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="coffee" size={13} className="text-glow-300/70" /> zero Friday-afternoon drills
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="target" size={13} className="text-glow-300/70" /> {derived.totalTasks.toLocaleString()} checkable tasks
            </span>
          </div>
        </div>

        <HeroDeck shift={shift} countdown={countdown} clock={fmtClock(minutesOfDay(now))} weekN={week.n} phaseName={phase.name} readiness={derived.readiness} completion={derived.completion} />
      </div>
    </div>
  );
}

function fmtCountdownLocal(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(h)}:${p(m)}:${p(s)}`;
}

/* ------------------------------------------------------------------ *
 * The "product screenshot" from the reference — here it is live data
 * ------------------------------------------------------------------ */

function HeroDeck({
  shift,
  countdown,
  clock,
  weekN,
  phaseName,
  readiness,
  completion,
}: {
  shift: { id: string; label: string; note: string };
  countdown: string;
  clock: string;
  weekN: number;
  phaseName: string;
  readiness: number;
  completion: number;
}) {
  const { state, dispatch, derived } = useStore();
  const week = WEEKS[weekN - 1];
  const todayKey = new Date().toISOString().slice(0, 10);
  const dayLog = state.days[todayKey] ?? { stem: 0, evening: 0, sat: 0, eng: 0, lightsOut: false, up3am: false, habits: [] };
  const shown = week.tasks.slice(0, 3);
  const di = dayIndex();
  return (
    <div className="relative mx-auto mt-12 w-full max-w-[1020px] sm:mt-16">
      <TopSpill />
      <div className="card overflow-hidden !rounded-[22px] p-0 shadow-panel">
        {/* window chrome */}
        <div className="flex items-center gap-3 border-b border-white/[0.07] bg-white/[0.02] px-4 py-2.5">
          <span className="flex items-center gap-1.5">
            {['#f472b6', '#fbbf24', '#34d399'].map((c) => (
              <span key={c} className="h-2 w-2 rounded-full" style={{ background: c, opacity: 0.7 }} />
            ))}
          </span>
          <span className="font-display text-[12px] font-semibold uppercase tracking-[0.16em] text-glow-200/70">SAGE · Command Deck</span>
          <span className="ml-auto hidden items-center gap-1 text-[11px] tabular-nums text-glow-200/50 sm:flex">
            <Icon name="clock" size={12} /> {clock}
          </span>
          <span className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10.5px] uppercase tracking-[0.14em] text-glow-300/80 sm:flex">
            {DAY_SHORT[di]}
          </span>
        </div>

        <div className="grid gap-0 md:grid-cols-[210px_1fr_236px]">
          {/* rail */}
          <aside className="hidden flex-col gap-4 border-r border-white/[0.07] bg-white/[0.015] p-4 md:flex">
            <div>
              <div className="label">Active phase</div>
              <div className="space-y-1.5">
                {PHASES.map((p) => {
                  const on = p.key === week.phase;
                  return (
                    <div
                      key={p.key}
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] transition',
                        on ? 'bg-white/[0.07] text-white' : 'text-glow-200/50',
                      )}
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
                {readiness}
                <span className="text-[13px] text-glow-300/70">%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(3, completion * 100)}%`, background: 'linear-gradient(90deg,#6f9bff,#9ec1ff)' }} />
              </div>
              <div className="mt-1.5 text-[10.5px] text-glow-200/45">{derived.doneCount} of {derived.totalTasks} tasks cleared</div>
            </div>
          </aside>

          {/* main */}
          <div className="min-w-0 p-4 sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="kicker !text-[10px]">
                  <Icon name="bolt" size={12} className="text-amber" /> {phaseName}
                </div>
                <div className="mt-1.5 font-display text-[19px] font-semibold leading-tight text-white">
                  Week {weekN} · {week.stage}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Ring value={completion} size={54} stroke={5} label={`${Math.round(completion * 100)}%`} sub="plan" />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-glow-400/25 bg-glow-500/[0.09] p-3.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-mint shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                  <span className="text-[13px] font-semibold text-white">{shift.label}</span>
                </div>
                <div className="mt-1 truncate text-[11.5px] text-glow-200/60">{shift.note}</div>
              </div>
              <div className="text-right">
                <div className="num text-[17px] font-semibold tabular-nums text-glow-100">{countdown}</div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-glow-200/45">to next boundary</div>
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              {shown.map((t) => {
                const checked = Boolean(state.done[t.id]);
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    onClick={() => dispatch({ type: 'toggleTask', id: t.id })}
                    className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5 text-left transition hover:border-white/15 hover:bg-white/[0.05]"
                  >
                    <span className="checkbox" data-checked={checked}>
                      <Icon name="check" size={11} className={cn('transition-opacity', checked ? 'text-ink-950 opacity-100' : 'opacity-0')} />
                    </span>
                    <span className={cn('min-w-0 flex-1 truncate text-[13px]', checked ? 'text-glow-200/40 line-through' : 'text-glow-100/90')}>
                      {t.label}
                    </span>
                    <Tag className="hidden sm:inline-flex">{t.tag}</Tag>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { k: 'stem', label: 'Drill hour', value: dayLog.stem, target: week.drillTarget, color: '#6f9bff' },
                { k: 'evening', label: 'Gr 12 link', value: dayLog.evening, target: 12, color: '#22d3ee' },
                { k: 'sat', label: 'SAT', value: dayLog.sat, target: 20, color: '#fbbf24' },
                { k: 'eng', label: 'English', value: dayLog.eng, target: 20, color: '#f472b6' },
              ].map((m) => (
                <div key={m.k} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[0.14em] text-glow-200/50">{m.label}</span>
                    <span className="num text-[12px] font-semibold" style={{ color: m.color }}>
                      {m.value}
                      <span className="text-glow-200/40">/{m.target}</span>
                    </span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (m.value / m.target) * 100)}%`, background: m.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* side feed */}
          <aside className="hidden flex-col gap-3 border-l border-white/[0.07] bg-white/[0.015] p-4 lg:flex">
            <div className="label !mb-0">Guardrails</div>
            {[
              { icon: 'alarm', t: 'Lights out 8:30 PM', s: dayLog.lightsOut ? 'Logged tonight ✓' : '6.5 h sleep protected', on: dayLog.lightsOut },
              { icon: 'flag', t: 'Red-flag notebook', s: `${derived.openErrors} open · ${derived.clearedErrors} cleared`, on: derived.openErrors === 0 },
              { icon: 'users', t: 'Group check-in', s: state.groupSize + ' members · Thu 6:50 PM', on: true },
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

      <div className="mx-auto mt-4 flex items-center justify-center gap-2 text-[11px] text-glow-200/40">
        <Icon name="eye" size={13} />
        Live preview — every card below is editable and saved to this browser.
      </div>
    </div>
  );
}
