import { useMemo } from 'react';
import { Card, Icon, Ring, Stat, Tag, Checkbox, Bar } from '../components/ui';
import { DAY_NAMES, DAY_SHORT, dayIndex, fmtClock, minutesOfDay } from '../lib/date';
import { useNow, useStore, type DrillFields } from '../lib/store';
import { haptic } from '../lib/haptic';
import { DAILY_HABITS, SHIFTS, SUBJECTS, WEEKS, DAY_PLAN, phaseOf } from '../data/roadmap';
import { cn } from '../components/cn';

type Status = 'done' | 'live' | 'next' | 'later';

const toneColor: Record<string, string> = {
  core: '#6f9bff',
  school: '#22d3ee',
  evening: '#a78bfa',
  sleep: '#9ec1ff',
  rest: '#34d399',
};

export function Today() {
  const now = useNow(15000);
  const { state, dispatch, derived } = useStore();
  const week = WEEKS[derived.currentWeek - 1];
  const phase = phaseOf(week.n);
  const di = dayIndex(now);
  const m = minutesOfDay(now);
  const todayKey = isoLocal(now);
  const log = state.days[todayKey] ?? { stem: 0, evening: 0, sat: 0, eng: 0, lightsOut: false, up3am: false, habits: [] };

  const isRest = di === 0 || di === 6 || (di === 5 && m >= 360);

  const timeline = useMemo(() => {
    const ordered = SHIFTS.filter((s) => s.dayMask.includes(di)).slice().sort((a, b) => a.start - b.start);
    const list = ordered.map((s) => {
      let status: Status = 'later';
      if (m >= s.end) status = 'done';
      else if (m >= s.start) status = 'live';
      else status = 'next';
      return { s, status };
    });
    // first 'later' row becomes 'next', the rest 'later'
    let seenNext = false;
    return list.map((r) => {
      if (r.status === 'next' && !seenNext) {
        seenNext = true;
        return { ...r, status: 'next' as Status };
      }
      return r.status === 'next' ? { ...r, status: 'later' as Status } : r;
    });
  }, [di, Math.floor(m)]);

  const live = timeline.find((t) => t.status === 'live');
  const nextRow = timeline.find((t) => t.status === 'next');
  const progressLive = live ? (m - live.s.start) / (live.s.end - live.s.start) : 0;
  const minsToNext = nextRow ? nextRow.s.start - m : null;

  const targets: { field: DrillFields; label: string; hint: string; target: number; color: string; icon: string }[] = [
    { field: 'stem', label: 'Drill hour', hint: '5:30 – 6:30 AM · topic-matched', target: week.drillTarget, color: '#6f9bff', icon: 'target' },
    { field: 'evening', label: 'Grade 12 link', hint: '5:30 – 7:30 PM · past papers', target: week.mode === 'foundation' ? 12 : 45, color: '#22d3ee', icon: 'book' },
    { field: 'sat', label: 'SAT', hint: 'Thursday clinic block', target: di === 4 ? 20 : 0, color: '#fbbf24', icon: 'sigma' },
    { field: 'eng', label: 'English', hint: 'Thursday clinic block', target: di === 4 ? 20 : 0, color: '#f472b6', icon: 'quote' },
  ];

  const weekStats = derived.weekStats[week.n - 1];
  const habits = DAILY_HABITS.filter((h) => h.days.includes(di));

  /** Counter taps fire a short haptic tick where supported — this is a phone app first. */
  const bump = (field: DrillFields, delta: number) => {
    if (!delta) return;
    dispatch({ type: 'bump', day: todayKey, field, delta });
    if (delta > 0) haptic(8);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      {/* ---------------- live now ---------------- */}
      <Card glow className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="kicker">
              <Icon name="bolt" size={12} className="text-amber" />
              {phase.name} · {phase.kicker}
            </div>
            <h3 className="mt-2 text-[26px] font-semibold leading-none text-white sm:text-[30px]">
              {DAY_NAMES[di]}
              <span className="text-glow-300/70"> · Week {week.n}</span>
            </h3>
            <p className="muted mt-2 max-w-lg text-[13.5px]">
              Day {Math.max(0, derived.dayNumber)} of 168 · {week.stage}. {isRest ? 'The plan asks for nothing today — rest is load-bearing.' : week.focus}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Ring value={weekStats.pct} size={74} label={`${Math.round(weekStats.pct * 100)}%`} sub="week" color={phase.accent} />
            <Ring value={derived.readiness / 100} size={74} label={`${derived.readiness}`} sub="ready" color="#34d399" />
          </div>
        </div>

        <div
          className={cn(
            'mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4',
            isRest ? 'border-mint/25 bg-mint/[0.06]' : 'border-glow-400/25 bg-glow-500/[0.08]',
          )}
        >
          <div className="flex items-center gap-3">
            <span className={cn('grid h-10 w-10 place-items-center rounded-xl border', isRest ? 'border-mint/40 bg-mint/10 text-mint' : 'border-glow-300/30 bg-white/[0.06] text-glow-200')}>
              <Icon name={isRest ? 'coffee' : live ? 'bolt' : 'clock'} size={18} />
            </span>
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-glow-200/50">{isRest ? 'Zero-drill window' : live ? 'Happening now' : 'Current status'}</div>
              <div className="font-display text-[17px] font-semibold text-white">
                {isRest ? 'Friday afternoon → Sunday night: 100% free' : (live?.s.name ?? nextRow?.s.name ?? 'Between shifts')}
              </div>
            </div>
          </div>
          {!isRest && (minsToNext !== null ? (
            <div className="text-right">
              <div className="num text-[20px] font-semibold tabular-nums text-glow-100">
                {Math.floor(minsToNext / 60)}:{String(minsToNext % 60).padStart(2, '0')}
              </div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-glow-200/50">until {nextRow ? nextRow.s.name.toLowerCase() : 'rest'}</div>
            </div>
          ) : null)}
          {!isRest && live ? <Bar value={progressLive} className="w-full !max-w-full" color={toneColor[live.s.tone]} height={4} /> : null}
        </div>

        {/* ---------------- timeline ---------------- */}
        <div className="mt-5 space-y-1.5">
          {timeline.map(({ s, status }) => {
            const color = toneColor[s.tone];
            return (
              <div
                key={s.id}
                className={cn(
                  'relative flex gap-3 rounded-xl border px-3 py-3 transition-all sm:py-2.5',
                  status === 'live' ? 'border-white/20 bg-white/[0.07]' : 'border-white/[0.06] bg-white/[0.02]',
                  status === 'done' && 'opacity-55',
                )}
              >
                <div className="mt-1 flex flex-col items-center gap-1">
                  <span
                    className={cn('h-2.5 w-2.5 rounded-full border', status === 'live' && 'animate-pulse')}
                    style={{
                      borderColor: status === 'done' ? 'transparent' : `${color}88`,
                      background: status === 'done' ? color : status === 'live' ? color : 'transparent',
                      boxShadow: status === 'live' ? `0 0 12px ${color}` : undefined,
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-[13.5px] font-semibold text-white">{s.name}</span>
                    <span className="num text-[11.5px] text-glow-300/80">{s.window}</span>
                    {status === 'live' ? <Tag color={color}>now</Tag> : null}
                    {status === 'next' ? <Tag>next</Tag> : null}
                  </div>
                  <p className="mt-1 text-[12px] leading-snug text-glow-200/60">{s.output}</p>
                </div>
                <span className="num mt-1 hidden text-[11px] tabular-nums text-glow-200/40 sm:block">{status === 'live' ? fmtClock(m) : fmtClock(s.start)}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ---------------- right column ---------------- */}
      <div className="grid gap-4">
        {derived.openSession ? (
          <a
            href="#drill"
            className="card flex items-center gap-3 !border-amber/35 !bg-amber/[0.07] p-4 transition hover:border-amber/55"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber/35 bg-amber/15 text-amber">
              <Icon name="play" size={16} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-semibold text-white">
                Drill session still open · {derived.openSession.items.length} of {derived.openSession.target} logged
              </span>
              <span className="block truncate text-[11.5px] text-glow-200/55">
                End it to bank today&apos;s count and file the misses — or keep solving.
              </span>
            </span>
            <Icon name="arrow" size={15} className="shrink-0 text-amber" />
          </a>
        ) : null}
        <Card>
          <div className="flex items-center justify-between">
            <h4 className="font-display text-[15px] font-semibold text-white">Today&apos;s counters</h4>
            <span className="text-[11px] text-glow-200/50">{fmtClock(m)} · auto-saved</span>
          </div>
          <div className="mt-3 grid gap-2">
            {targets.map((t) => {
              const value = log[t.field];
              const hit = t.target ? value >= t.target : true;
              return (
                <div key={t.field} className={cn('rounded-xl border p-3 transition', hit && t.target ? 'border-mint/30 bg-mint/[0.05]' : 'border-white/[0.07] bg-white/[0.02]')}>
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-lg border" style={{ borderColor: `${t.color}40`, background: `${t.color}14`, color: t.color }}>
                      <Icon name={t.icon} size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-glow-100">{t.label}</div>
                      <div className="truncate text-[11px] text-glow-200/50">{t.hint}</div>
                    </div>
                    <div className="num text-[15px] font-semibold" style={{ color: hit && t.target ? '#34d399' : '#fff' }}>
                      {value}
                      {t.target ? <span className="text-[11px] text-glow-200/45">/{t.target}</span> : null}
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <CounterBtn icon="minus" onClick={() => bump(t.field, -5)} label="Remove 5 questions" />
                    {[1, 5].map((step) => (
                      <CounterBtn key={step} icon="plus" onClick={() => bump(t.field, step)} label={`Add ${step} question${step > 1 ? 's' : ''}`} wide={`+${step}`} />
                    ))}
                    <div className="ml-auto flex items-center gap-1.5">
                      {t.target > 0 ? (
                        <CounterBtn
                          icon="check"
                          onClick={() => bump(t.field, Math.max(0, t.target - value))}
                          label="Fill today's target"
                          wide="fill"
                          tone={t.color}
                        />
                      ) : null}
                      <CounterBtn icon="reset" onClick={() => bump(t.field, -value)} label="Reset counter" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 border-t border-white/[0.06] pt-3">
            <div className="label !mb-2">Habits · {DAY_SHORT[di]}</div>
            <div className="flex flex-wrap gap-1.5">
              {habits.map((h) => {
                const on = log.habits.includes(h.id);
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => {
                      dispatch({ type: 'habit', day: todayKey, habit: h.id });
                      if (!on) haptic(6);
                    }}
                    title={h.why}
                    className={cn(
                      'tap inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[12px] transition',
                      on ? 'border-mint/45 bg-mint/[0.12] text-white' : 'border-white/[0.1] bg-white/[0.03] text-glow-200/65',
                    )}
                  >
                    <Icon name={on ? 'check' : 'plus'} size={12} className={on ? 'text-mint' : ''} />
                    {h.label}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-white/[0.03] p-2.5 text-[11.5px] leading-snug text-glow-200/60">
            <Icon name="shield" size={14} className="mt-[1px] text-glow-300" />
            Week {week.n} plan target: <b className="text-glow-100">{week.weeklyQuestions} STEM</b> + 40 clinic questions. {week.drill}
          </p>
        </Card>

        <Card>
          <h4 className="font-display text-[15px] font-semibold text-white">Sleep contract · {DAY_SHORT[di]} night</h4>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(
              [
                { field: 'lightsOut', icon: 'moon', title: 'Lights out 8:30 PM', sub: 'Phone off · bag packed' },
                { field: 'up3am', icon: 'alarm', title: 'Up at 3:00 AM', sub: '6.5 h consolidated' },
              ] as const
            ).map((f) => {
              const on = log[f.field];
              return (
                <button
                  key={f.field}
                  type="button"
                  onClick={() => dispatch({ type: 'flag', day: todayKey, field: f.field, value: !on })}
                  className={cn(
                    'flex flex-col gap-2 rounded-xl border p-3 text-left transition',
                    on ? 'border-mint/40 bg-mint/[0.08] shadow-[0_10px_30px_-20px_rgba(52,211,153,0.9)]' : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20',
                  )}
                >
                  <span className="flex items-center justify-between">
                    <Icon name={f.icon} size={16} className={on ? 'text-mint' : 'text-glow-300/70'} />
                    <span className={cn('grid h-5 w-5 place-items-center rounded-full border', on ? 'border-transparent bg-mint text-ink-950' : 'border-white/20')}>
                      {on ? <Icon name="check" size={11} /> : null}
                    </span>
                  </span>
                  <span>
                    <span className="block text-[12.5px] font-semibold text-glow-100">{f.title}</span>
                    <span className="block text-[11px] text-glow-200/50">{f.sub}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
            <span className="text-[12px] text-glow-200/65">Nights held so far</span>
            <span className="num text-[15px] font-semibold text-white">
              {derived.sleepDays}
              <span className="text-[11px] text-glow-200/45">/{derived.nightsElapsed}</span>
            </span>
          </div>
          <Bar value={derived.sleepPct} color="#9ec1ff" className="mt-2" height={4} />
        </Card>
      </div>

      {/* ---------------- week checklist preview ---------------- */}
      <Card className="lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-display text-[15px] font-semibold text-white">Week {week.n} checklist</h4>
            <p className="text-[12px] text-glow-200/55">
              {weekStats.hit}/{weekStats.total} cleared · {week.concept}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-tiny"
              onClick={() => dispatch({ type: 'setTasks', ids: week.tasks.map((t) => t.id), value: weekStats.hit !== weekStats.total })}
            >
              <Icon name={weekStats.hit === weekStats.total ? 'reset' : 'check'} size={13} />
              {weekStats.hit === weekStats.total ? 'Uncheck week' : 'Mark week complete'}
            </button>
            <a href="#checklist" className="btn-tiny">
              Full roadmap <Icon name="arrow" size={13} />
            </a>
          </div>
        </div>
        <div className="mt-4 grid gap-x-6 gap-y-1 sm:grid-cols-2">
          {week.tasks.map((t) => (
            <div key={t.id} className="row-hover rounded-lg px-2 py-2">
              <Checkbox
                checked={Boolean(state.done[t.id])}
                onChange={() => dispatch({ type: 'toggleTask', id: t.id })}
                tone={t.subject ? SUBJECTS[t.subject].color : '#6f9bff'}
                label={
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[10px] uppercase tracking-[0.14em] text-glow-300/60">{t.tag}</span>
                    <span>{t.label}</span>
                  </span>
                }
              />
            </div>
          ))}
        </div>
      </Card>

      {/* ---------------- week strip ---------------- */}
      <Card className="lg:col-span-2">
        <div className="flex items-center justify-between">
          <h4 className="font-display text-[15px] font-semibold text-white">This week at a glance</h4>
          <span className="text-[11px] text-glow-200/50 sm:hidden">swipe →</span>
          <span className="hidden text-[11px] text-glow-200/50 sm:block">each day has exactly one job</span>
        </div>
        <div className="hscroll mt-3 gap-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0 lg:grid-cols-7">
          {DAY_PLAN.map((d, i) => {
            const on = i === di;
            const subject = i === 0 || i === 1 ? week.sides[0].subject : i === 2 || i === 3 ? week.sides[1].subject : null;
            const color = subject ? SUBJECTS[subject].color : '#34d399';
            return (
              <div
                key={d.day}
                className={cn('w-[146px] rounded-xl border p-3 transition sm:w-auto', on ? 'border-white/25 bg-white/[0.07]' : 'border-white/[0.06] bg-white/[0.02]')}
              >
                <div className="flex items-center justify-between">
                  <span className={cn('font-display text-[12.5px] font-semibold', on ? 'text-white' : 'text-glow-200/70')}>{d.short}</span>
                  {subject ? <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} /> : <Icon name="coffee" size={12} className="text-mint/80" />}
                </div>
                <div className="mt-1.5 text-[11px] leading-snug text-glow-100/80">{on ? d.subjectLine : subject ? SUBJECTS[subject].name : 'Rest'}</div>
                <div className="mt-1 text-[10.5px] leading-snug text-glow-200/45">{d.note}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <Stat icon="bolt" value={`${derived.streak} d`} label="Execution streak" hint="drill or sleep contract held" color="#fbbf24" />
          <Stat icon="target" value={derived.questions.toLocaleString()} label="Questions logged" hint={`plan by wk ${derived.currentWeek}: ${derived.plannedQuestions.toLocaleString()}`} color="#6f9bff" />
          <Stat icon="flag" value={derived.openErrors} label="Open red flags" hint={`${derived.clearedErrors} cleared`} color="#f472b6" />
        </div>
      </Card>
    </div>
  );
}

function CounterBtn({
  icon,
  onClick,
  label,
  wide,
  tone,
}: {
  icon: string;
  onClick: () => void;
  label: string;
  wide?: string;
  tone?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'tap grid h-11 place-items-center rounded-xl border border-white/10 bg-white/[0.05] text-glow-200/80 transition hover:border-glow-300/40 hover:bg-white/[0.12] hover:text-white active:scale-95 sm:h-8 sm:rounded-lg',
        wide ? 'px-3 text-[12px] font-semibold sm:px-2 sm:text-[11px]' : 'w-11 sm:w-8',
      )}
      style={tone ? { borderColor: `${tone}55`, color: '#fff' } : undefined}
    >
      {wide ? wide : <Icon name={icon} size={15} className="sm:hidden" />}
      {wide ? null : <Icon name={icon} size={13} className="hidden sm:block" />}
    </button>
  );
}

/** ISO 'YYYY-MM-DD' in the viewer's own timezone (never UTC-shifted). */
function isoLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

