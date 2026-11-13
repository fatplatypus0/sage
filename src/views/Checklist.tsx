import { useMemo, useState } from 'react';
import { Card, Checkbox, Icon, Ring, Tag, Bar, EmptyState } from '../components/ui';
import { useStore } from '../lib/store';
import { PHASES, SUBJECTS, WEEKS, phaseOf, type PhaseKey, type SubjectKey, type Week } from '../data/roadmap';
import { cn } from '../components/cn';

type Filter = 'all' | PhaseKey;

export function Checklist() {
  const { derived } = useStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [subject, setSubject] = useState<SubjectKey | 'all'>('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<number[]>([derived.currentWeek]);
  const [board, setBoard] = useState(false);

  const weeks = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return WEEKS.filter((w) => {
      if (filter !== 'all' && w.phase !== filter) return false;
      if (subject !== 'all' && !w.sides.some((s) => s.subject === subject) && !w.tasks.some((t) => t.subject === subject)) return false;
      if (!needle) return true;
      const hay = [w.label, w.stage, w.focus, w.concept, w.drill, w.evening, w.thursday, ...w.tasks.map((t) => t.label)].join(' ').toLowerCase();
      return hay.includes(needle);
    });
  }, [filter, subject, q]);

  const toggle = (n: number) => setOpen((o) => (o.includes(n) ? o.filter((x) => x !== n) : [...o, n]));
  const currentWeek = WEEKS[derived.currentWeek - 1];

  return (
    <div>
      <Card className="mb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <Ring value={derived.completion} size={86} label={`${Math.round(derived.completion * 100)}%`} sub="plan done" />
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {PHASES.map((p) => {
                const s = derived.byPhase[p.key];
                return (
                  <div key={p.key} className="min-w-[132px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.13em]" style={{ color: p.accent }}>
                        {p.kicker}
                      </span>
                      <span className="num text-[11px] text-glow-200/55">
                        {s.hit}/{s.total}
                      </span>
                    </div>
                    <Bar value={s.pct} color={p.accent} className="mt-1.5" height={5} />
                    <div className="mt-1 text-[10.5px] text-glow-200/40">{p.window}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn-tiny" onClick={() => setBoard((b) => !b)}>
              <Icon name={board ? 'chart' : 'calendar'} size={13} />
              {board ? 'List view' : '24-week board'}
            </button>
            <button
              type="button"
              className="btn-tiny"
              onClick={() => setOpen(weeks.map((w) => w.n))}
            >
              <Icon name="chevron" size={13} /> Expand all
            </button>
            <button type="button" className="btn-tiny" onClick={() => setOpen([])}>
              <Icon name="chevron" size={13} className="rotate-180" /> Collapse all
            </button>
            <button
              type="button"
              className="btn-tiny !border-glow-400/40 !bg-glow-500/15 !text-white"
              onClick={() => {
                setFilter('all');
                setSubject('all');
                setQ('');
                setBoard(false);
                setOpen([currentWeek.n]);
                requestAnimationFrame(() =>
                  document.getElementById(`week-${currentWeek.n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
                );
              }}
            >
              <Icon name="target" size={13} /> Jump to week {currentWeek.n}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2.5 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center sm:gap-2">
          <label className="relative order-first w-full sm:ml-auto sm:order-last sm:w-56">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-glow-200/45">
              <Icon name="search" size={15} />
            </span>
            <input
              className="field !pl-9"
              placeholder="Search units, drills, clinics…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search the roadmap"
              enterKeyHint="search"
            />
            {q ? (
              <button type="button" onClick={() => setQ('')} aria-label="Clear search" className="tap absolute right-1.5 top-1/2 grid h-10 w-10 place-items-center -translate-y-1/2 rounded-full text-glow-200/60 active:bg-white/10 sm:right-2 sm:h-7 sm:w-7 sm:hover:text-white">
                <Icon name="x" size={14} />
              </button>
            ) : null}
          </label>
          <div className="hscroll gap-1.5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {([{ key: 'all', label: 'All 24 weeks' }, ...PHASES.map((p) => ({ key: p.key, label: p.name }))] as { key: Filter; label: string }[]).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  'tap shrink-0 rounded-full border px-3.5 py-2.5 text-[13px] font-medium transition sm:px-3 sm:py-1.5 sm:text-[12px]',
                  filter === f.key
                    ? 'border-white/25 bg-white/[0.1] text-white'
                    : 'border-white/[0.08] bg-white/[0.02] text-glow-200/60 hover:border-white/20 hover:text-white',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="hidden h-5 w-px shrink-0 bg-white/10 sm:block" />
          <div className="hscroll gap-1.5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            <SubjectChip active={subject === 'all'} onClick={() => setSubject('all')} label="All subjects" />
            {(['math', 'physics', 'chem', 'bio'] as SubjectKey[]).map((s) => (
              <SubjectChip key={s} active={subject === s} onClick={() => setSubject(subject === s ? 'all' : s)} label={SUBJECTS[s].short} color={SUBJECTS[s].color} />
            ))}
          </div>
        </div>
      </Card>

      {board ? (
        <Board weeks={weeks} setOpen={setOpen} setBoard={setBoard} />
      ) : weeks.length === 0 ? (
        <EmptyState
          icon="search"
          title="No weeks match that filter"
          body="Try clearing the search box or switching back to 'All 24 weeks' — the full plan lives under phases 1A, 1B, 2 and 3."
          action={
            <button className="btn-tiny" type="button" onClick={() => { setQ(''); setFilter('all'); setSubject('all'); }}>
              Reset filters
            </button>
          }
        />
      ) : (
        <div className="grid gap-2.5">
          {weeks.map((w) => (
            <WeekRow key={w.n} week={w} open={open.includes(w.n)} onToggle={() => toggle(w.n)} current={w.n === derived.currentWeek} />
          ))}
        </div>
      )}

      <p className="muted mt-5 flex items-start gap-2 text-[12px]">
        <Icon name="shield" size={15} className="mt-[1px] text-glow-300/70" />
        Progress is stored in this browser only — nothing is uploaded. Use Settings → Backup to move the plan to another device
        or print the week as a wall sheet.
      </p>
    </div>
  );
}

function SubjectChip({ label, color, active, onClick }: { label: string; color?: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'tap inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2.5 text-[12.5px] font-medium transition sm:px-2.5 sm:py-1 sm:text-[11.5px]',
        active ? 'border-white/25 bg-white/[0.1] text-white' : 'border-white/[0.08] bg-white/[0.02] text-glow-200/60 hover:text-white',
      )}
    >
      {color ? <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} /> : null}
      {label}
    </button>
  );
}

function Board({ weeks, setOpen, setBoard }: { weeks: Week[]; setOpen: (n: number[]) => void; setBoard: (b: boolean) => void }) {
  const { derived } = useStore();
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h4 className="font-display text-[15px] font-semibold text-white">24-week board</h4>
        <span className="text-[11px] text-glow-200/50">{weeks.length} weeks shown · green = complete</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {WEEKS.map((w) => {
          const stat = derived.weekStats[w.n - 1];
          const p = phaseOf(w.n);
          const current = w.n === derived.currentWeek;
          const shown = weeks.some((x) => x.n === w.n);
          return (
            <button
              key={w.n}
              type="button"
              onClick={() => {
                setBoard(false);
                setOpen(stat.complete ? [] : [w.n]);
                if (!shown) return;
                requestAnimationFrame(() => document.getElementById(`week-${w.n}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
              }}
              className={cn(
                'group relative overflow-hidden rounded-xl border p-2.5 text-left transition',
                stat.complete ? 'border-mint/35 bg-mint/[0.07]' : 'border-white/[0.07] bg-white/[0.02] hover:border-white/20',
                current && 'ring-1 ring-glow-300/50',
                !shown && 'opacity-35',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-[13px] font-semibold text-white">W{w.n}</span>
                <span className="num text-[10.5px] text-glow-200/55">{Math.round(stat.pct * 100)}%</span>
              </div>
              <div className="mt-1 truncate text-[10.5px] text-glow-200/55">{w.stage}</div>
              <Bar value={stat.pct} color={stat.complete ? '#34d399' : p.accent} className="mt-2" height={3} />
              {current ? <span className="absolute right-2 top-2 h-1.5 w-1.5 animate-pulse rounded-full bg-glow-200" /> : null}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function WeekRow({ week, open, onToggle, current }: { week: Week; open: boolean; onToggle: () => void; current: boolean }) {
  const { state, dispatch, derived } = useStore();
  const stat = derived.weekStats[week.n - 1];
  const p = phaseOf(week.n);
  const allDone = stat.complete;

  return (
    <div
      id={`week-${week.n}`}
      className={cn(
        'card !rounded-[18px] !p-0 transition-all',
        allDone && 'border-mint/25 bg-mint/[0.03]',
        current && !allDone && 'border-glow-400/30 shadow-[0_0_0_1px_rgba(158,193,255,0.08),0_30px_80px_-50px_rgba(77,124,255,0.6)]',
      )}
    >
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 p-3.5 text-left sm:gap-4 sm:p-4">
        <Ring value={stat.pct} size={44} stroke={4} color={allDone ? '#34d399' : p.accent} label={<span className="text-[11px]">{stat.hit}</span>} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-[15px] font-semibold text-white">Week {week.n}</span>
            <Tag color={p.accent}>{week.stage}</Tag>
            {current ? <Tag color="#9ec1ff">you are here</Tag> : null}
            {allDone ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-mint">
                <Icon name="check" size={12} /> cleared
              </span>
            ) : null}
          </div>
          <div className="mt-1.5 flex flex-col gap-y-0.5 text-[12px] text-glow-200/60 sm:flex-row sm:flex-wrap sm:gap-x-3">
            {week.sides.map((s) => (
              <span key={s.label} className="flex min-w-0 items-center gap-1.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: SUBJECTS[s.subject].color }} />
                <span className="shrink-0">{s.label.split('—')[0].trim()}</span>
                <span className="min-w-0 truncate text-glow-200/45">· {s.short}</span>
              </span>
            ))}
            {week.mode !== 'foundation' ? <span className="inline-flex items-center gap-1.5 text-amber/80">timed papers only</span> : null}
          </div>
        </div>
        <span className="hidden text-[11px] tabular-nums text-glow-200/45 sm:block">
          {week.weeklyQuestions + 40} Qs planned
        </span>
        <Icon name="chevron" size={16} className={cn('text-glow-200/50 transition-transform duration-300', open && 'rotate-180')} />
      </button>

      <div className={cn('grid transition-all duration-300', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="overflow-hidden">
          <div className="border-t border-white/[0.06] p-4 sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="label !mb-0">Checklist · {stat.hit}/{stat.total}</span>
                  <button
                    type="button"
                    className="btn-tiny"
                    onClick={() => dispatch({ type: 'setTasks', ids: week.tasks.map((t) => t.id), value: !allDone })}
                  >
                    <Icon name={allDone ? 'reset' : 'check'} size={12} /> {allDone ? 'Clear week' : 'Check all'}
                  </button>
                </div>
                <div className="space-y-1">
                  {week.tasks.map((t) => (
                    <div key={t.id} className="row-hover rounded-lg px-2 py-2">
                      <Checkbox
                        checked={Boolean(state.done[t.id])}
                        onChange={() => dispatch({ type: 'toggleTask', id: t.id })}
                        tone={t.subject ? SUBJECTS[t.subject].color : p.accent}
                        label={
                          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <span className="text-[10px] uppercase tracking-[0.14em] text-glow-300/60">{t.tag}</span>
                            <span>{t.label}</span>
                          </span>
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-2.5 self-start">
                <Info icon="eye" label="Concept goal" body={week.concept} />
                <Info icon="target" label="Locked drill hour" body={week.drill} tone="#6f9bff" />
                <Info icon="book" label="Evening · Gr 12 link" body={week.evening} tone="#22d3ee" />
                <Info icon="sigma" label="Thursday clinic" body={week.thursday} tone="#fbbf24" />
                {week.milestone ? <Info icon="flag" label="Milestone" body={week.milestone} tone="#f472b6" /> : null}
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                  <div className="label !mb-2">Unit map · {week.rangeLabel}</div>
                  {week.sides.map((s) => (
                    <div key={s.label} className="mb-2 last:mb-0">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: SUBJECTS[s.subject].color }}>
                        <Icon name={s.subject === 'math' ? 'sigma' : s.subject === 'physics' ? 'bolt' : s.subject === 'chem' ? 'flask' : 'dna'} size={12} />
                        {s.label}
                      </div>
                      <div className="mt-0.5 text-[12px] leading-snug text-glow-100/80">{s.units}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ icon, label, body, tone = '#9ec1ff' }: { icon: string; label: string; body: string; tone?: string }) {
  return (
    <div className="flex gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
      <span className="mt-[1px] grid h-7 w-7 shrink-0 place-items-center rounded-lg border" style={{ borderColor: `${tone}3a`, background: `${tone}12`, color: tone }}>
        <Icon name={icon} size={14} />
      </span>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-glow-200/50">{label}</div>
        <p className="mt-1 text-[12.5px] leading-snug text-glow-100/85">{body}</p>
      </div>
    </div>
  );
}
