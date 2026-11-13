import { Card, Icon, Ring, Bar, Stat, Tag } from '../components/ui';
import { useStore, useCountUp } from '../lib/store';
import { EXAM_SUBJECTS, PHASES, SUBJECTS, TOTAL_CLINIC_QUESTIONS, TOTAL_QUESTIONS, WEEKS, phaseOf } from '../data/roadmap';
import { DrillHeatmap } from './Notebook';
import { cn } from '../components/cn';
import { addDays, isoDate, parseISO, fmtShortDate } from '../lib/date';

export function Stats() {
  const { state, derived } = useStore();
  const readiness = useCountUp(derived.readiness);
  const questions = useCountUp(derived.questions);
  const planned = useCountUp(derived.plannedQuestions);
  const week = WEEKS[derived.currentWeek - 1];
  const phase = phaseOf(week.n);
  const exam = parseISO(state.examDate);
  const daysLeft = derived.daysToExam;

  // 28-day bar series
  const series = derived.weekly;
  const peak = Math.max(45, ...series.map((s) => s.value));

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
      <Card glow className="lg:col-span-2">
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-center">
          <div className="relative shrink-0">
            <Ring value={derived.readiness / 100} size={168} stroke={11} color="#34d399" label={<span className="text-[30px] font-bold">{Math.round(readiness)}<span className="text-[15px]">%</span></span>} sub="readiness" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="kicker">
              <Icon name="chart" size={12} /> Readiness model
            </span>
            <h3 className="mt-2 font-display text-[22px] font-semibold leading-tight text-white">
              {derived.readiness >= 75
                ? 'On pace — keep the drill hour sacred.'
                : derived.readiness >= 45
                  ? 'Structure is holding. Volume is the gap.'
                  : 'Rebuild the habit: 5:30 AM drill, then everything else.'}
            </h3>
            <p className="muted mt-1.5 text-[13px]">
              Weighted 60% checklist completion, 25% question volume against the {Math.round(planned).toLocaleString()} the plan expects
              by week {derived.currentWeek}, and 15% notebook hygiene + lights-out discipline.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <MiniBar label="Checklist" value={derived.completion} color="#6f9bff" note={`${derived.doneCount}/${derived.totalTasks} tasks`} />
              <MiniBar label="Question volume" value={derived.volumeScore} color="#22d3ee" note={`${derived.questions.toLocaleString()} logged`} />
              <MiniBar label="Sleep held" value={derived.sleepPct} color="#9ec1ff" note={`${derived.sleepDays} nights`} />
            </div>
          </div>
          <div className="grid w-full shrink-0 gap-2 sm:grid-cols-2 md:w-[248px]">
            <div className="rounded-2xl border border-glow-400/25 bg-glow-500/[0.09] p-3.5">
              <div className="text-[10px] uppercase tracking-[0.16em] text-glow-200/55">National exam</div>
              <div className="num mt-1 text-[26px] font-bold leading-none text-white">
                {daysLeft > 0 ? daysLeft : 0}
                <span className="ml-1 text-[12px] font-medium text-glow-200/60">days</span>
              </div>
              <div className="mt-1.5 text-[11.5px] text-glow-200/55">{fmtShortDate(exam)} · week {Math.min(24, Math.max(1, Math.ceil((daysLeft < 0 ? 0 : 168 - daysLeft) / 7)))} of 24</div>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3.5">
              <div className="text-[10px] uppercase tracking-[0.16em] text-glow-200/55">Program clock</div>
              <div className="num mt-1 text-[26px] font-bold leading-none text-white">
                {Math.max(1, Math.min(168, derived.dayNumber))}
                <span className="ml-1 text-[12px] font-medium text-glow-200/60">/168 days</span>
              </div>
              <div className="mt-1.5 text-[11.5px] text-glow-200/55">{phase.name} · {week.stage}</div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h4 className="font-display text-[15px] font-semibold text-white">Questions per day</h4>
        <p className="text-[11.5px] text-glow-200/50">Drill hour + evening link + clinic blocks · last 28 days</p>
        <div className="mt-4 flex h-[132px] items-end gap-[3px]">
          {series.map((s, i) => {
            const h = (s.value / peak) * 100;
            const met = s.value >= (week.drillTarget + 12);
            return (
              <div key={s.key} className="group relative flex h-full flex-1 flex-col justify-end" title={`${s.key} · ${s.value} Qs`}>
                <div
                  className={cn('w-full rounded-[3px] transition-all duration-500', met ? 'bg-gradient-to-t from-glow-600/70 to-glow-200' : 'bg-white/[0.14] group-hover:bg-white/25')}
                  style={{ height: `${Math.max(2.5, h)}%`, boxShadow: met ? '0 0 14px -2px rgba(158,193,255,0.55)' : undefined }}
                />
                {i % 7 === 0 ? <span className="mt-1 text-[8px] text-glow-200/35">{fmtShortDate(parseISO(s.key))}</span> : <span className="mt-1 text-[8px] opacity-0">·</span>}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-3 text-[11.5px] text-glow-200/55">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-[2px] bg-glow-300" /> target met</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-[2px] bg-white/20" /> below target</span>
          <span className="ml-auto num">{series.reduce((a, b) => a + b.value, 0)} Qs · avg {Math.round(series.reduce((a, b) => a + b.value, 0) / 28)}</span>
        </div>
      </Card>

      <Card>
        <DrillHeatmap />
      </Card>

      <Card>
        <h4 className="font-display text-[15px] font-semibold text-white">Subject coverage</h4>
        <p className="text-[11.5px] text-glow-200/50">Checklist items tagged to each subject across all 24 weeks</p>
        <div className="mt-3.5 space-y-3">
          {derived.subjectLoad.map((s) => (
            <div key={s.key}>
              <div className="flex items-center justify-between text-[12px]">
                <span className="inline-flex items-center gap-2 font-medium text-glow-100/90">
                  <span className="h-2 w-2 rounded-full" style={{ background: SUBJECTS[s.key].color }} />
                  {SUBJECTS[s.key].name}
                </span>
                <span className="num text-glow-200/50">{s.done}/{s.total}</span>
              </div>
              <Bar value={s.total ? s.done / s.total : 0} color={SUBJECTS[s.key].color} className="mt-1.5" height={5} />
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Stat icon="bolt" value={`${Math.round(questions).toLocaleString()}`} label="Questions logged" color="#6f9bff" />
          <Stat icon="shield" value={`${derived.streak} d`} label="Streak" color="#fbbf24" />
        </div>
      </Card>

      <Card>
        <h4 className="font-display text-[15px] font-semibold text-white">Phase ledger</h4>
        <div className="mt-3 space-y-2.5">
          {PHASES.map((p) => {
            const s = derived.byPhase[p.key];
            const weeks = WEEKS.filter((w) => w.phase === p.key);
            const done = weeks.filter((w) => derived.weekStats[w.n - 1].complete).length;
            return (
              <div key={p.key} className={cn('rounded-xl border p-3', p.key === week.phase ? 'border-white/20 bg-white/[0.05]' : 'border-white/[0.07] bg-white/[0.02]')}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12.5px] font-semibold text-white">{p.name}</span>
                  <span className="num text-[11px] text-glow-200/55">{done}/{weeks.length} weeks</span>
                </div>
                <div className="mt-1 text-[11px] text-glow-200/50">{p.window} · {p.headline}</div>
                <Bar value={s.pct} color={p.accent} className="mt-2" height={5} />
              </div>
            );
          })}
        </div>
        <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
          <div className="label !mb-2">Six-paper syllabus</div>
          <div className="grid gap-1.5">
            {EXAM_SUBJECTS.map((e) => {
              const load = derived.subjectLoad.find((s) => s.key === e.key);
              return (
                <div key={e.key} className="flex items-center gap-2 text-[11.5px]">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: SUBJECTS[e.key].color }} />
                  <span className="w-[74px] shrink-0 font-semibold text-glow-100/90">{SUBJECTS[e.key].short}</span>
                  <span className="min-w-0 flex-1 truncate text-glow-200/50">{e.papers}</span>
                  {load && load.total ? <span className="num text-[10.5px] text-glow-200/45">{Math.round((load.done / load.total) * 100)}%</span> : null}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-display text-[15px] font-semibold text-white">Program totals if executed exactly</h4>
            <p className="text-[11.5px] text-glow-200/55">The number the roadmap is actually asking for over 24 weeks.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Tag color="#6f9bff">{TOTAL_QUESTIONS.toLocaleString()} STEM questions</Tag>
            <Tag color="#fbbf24">{TOTAL_CLINIC_QUESTIONS.toLocaleString()} SAT / English</Tag>
            <Tag color="#34d399">{derived.totalTasks} checkable tasks</Tag>
            <Tag color="#9ec1ff">96 protected mornings</Tag>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          {[
            { l: 'Logged so far', v: derived.questions.toLocaleString(), c: '#6f9bff' },
            { l: 'Plan pace by now', v: Math.round(derived.plannedQuestions).toLocaleString(), c: '#22d3ee' },
            { l: 'Remaining', v: Math.max(0, TOTAL_QUESTIONS + TOTAL_CLINIC_QUESTIONS - derived.questions).toLocaleString(), c: '#a78bfa' },
            { l: 'Nights held', v: `${derived.sleepDays}`, c: '#9ec1ff' },
          ].map((x) => (
            <div key={x.l} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
              <div className="num text-[20px] font-bold leading-none" style={{ color: x.c }}>{x.v}</div>
              <div className="mt-1.5 text-[10.5px] uppercase tracking-[0.14em] text-glow-200/45">{x.l}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function MiniBar({ label, value, color, note }: { label: string; value: number; color: string; note: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-2.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-glow-200/60">{label}</span>
        <span className="num text-glow-100">{Math.round(value * 100)}%</span>
      </div>
      <Bar value={value} color={color} className="mt-2" height={5} />
      <div className="mt-1.5 text-[10.5px] text-glow-200/40">{note}</div>
    </div>
  );
}

/** Used by the footer stamp: date the plan started + the projected finish line. */
export function programWindow(startISO: string) {
  const start = parseISO(startISO);
  return { start, end: addDays(start, 167), startKey: isoDate(start) };
}
