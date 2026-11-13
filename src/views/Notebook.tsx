import { useMemo, useState } from 'react';
import { Card, Icon, Tag, EmptyState, Bar } from '../components/ui';
import { REASONS, useStore, type Reason } from '../lib/store';
import { SUBJECTS, SUBJECT_ORDER, type SubjectKey } from '../data/roadmap';
import { addDays, fmtShortDate, isoDate, parseISO, todayKey, weekKey } from '../lib/date';
import { cn } from '../components/cn';

export function Notebook() {
  const { state, dispatch, derived } = useStore();
  const [subject, setSubject] = useState<SubjectKey>('math');
  const [topic, setTopic] = useState('');
  const [year, setYear] = useState('');
  const [reason, setReason] = useState<Reason>('formula-gap');
  const [rule, setRule] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [filterSubject, setFilterSubject] = useState<SubjectKey | 'all'>('all');
  const [onlyOpen, setOnlyOpen] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    dispatch({
      type: 'addEntry',
      entry: { week: derived.currentWeek, subject, topic: topic.trim(), year: year.trim(), reason, rule: rule.trim(), cleared: false },
    });
    setTopic('');
    setYear('');
    setRule('');
  };

  const entries = useMemo(() => {
    return state.entries.filter((en) => (filterSubject === 'all' || en.subject === filterSubject) && (!onlyOpen || !en.cleared));
  }, [state.entries, filterSubject, onlyOpen]);

  const reasonCounts = useMemo(() => {
    const map = new Map<Reason, number>();
    for (const e of state.entries) map.set(e.reason, (map.get(e.reason) ?? 0) + 1);
    return REASONS.map((r) => ({ ...r, count: map.get(r.key) ?? 0 })).sort((a, b) => b.count - a.count);
  }, [state.entries]);

  const stale = state.entries.filter((e) => !e.cleared && parseISO(e.created) < addDays(new Date(), -2)).length;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
      <Card glow>
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="kicker">
              <Icon name="flag" size={12} className="text-rose" /> Red-flag protocol · 6:10 – 6:30 AM
            </span>
            <h3 className="mt-2 font-display text-[20px] font-semibold text-white">Log a miss in three lines</h3>
          </div>
          <Tag color="#f472b6">wk {derived.currentWeek}</Tag>
        </div>
        <p className="muted mt-1.5 text-[13px]">
          Solving {WEEK_TARGET(derived.currentWeek)} questions a day only works if you never repeat the same mistake twice. Name the
          topic, admit the cause, and write the one-line rule that solves it in 30 seconds next time.
        </p>

        <form onSubmit={submit} className="mt-4 grid gap-3">
          <div className="flex flex-wrap gap-1.5">
            {SUBJECT_ORDER.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSubject(s)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition',
                  subject === s ? 'border-white/25 text-white' : 'border-white/[0.08] text-glow-200/55 hover:text-white',
                )}
                style={subject === s ? { background: `${SUBJECTS[s].color}22`, borderColor: `${SUBJECTS[s].color}66` } : undefined}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: SUBJECTS[s].color }} />
                {SUBJECTS[s].short}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-[1.6fr_1fr]">
            <label>
              <span className="label">1 · Topic & year</span>
              <input
                className="field"
                placeholder="Gr 11 Physics — projectile range"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={120}
              />
            </label>
            <label>
              <span className="label">Exam year (E.C.)</span>
              <input className="field" placeholder="2019 E.C. · Sec. B Q14" value={year} onChange={(e) => setYear(e.target.value)} maxLength={24} />
            </label>
          </div>

          <div>
            <span className="label">2 · Why I missed it</span>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {REASONS.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setReason(r.key)}
                  className={cn(
                    'rounded-xl border px-2.5 py-2 text-left text-[11.5px] transition',
                    reason === r.key ? 'border-glow-400/50 bg-glow-500/15 text-white' : 'border-white/[0.08] bg-white/[0.02] text-glow-200/60 hover:border-white/20',
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 flex items-start gap-1.5 text-[11.5px] text-glow-300/75">
              <Icon name="bolt" size={12} className="mt-[3px]" />
              {REASONS.find((r) => r.key === reason)?.fix}
            </p>
          </div>

          <label>
            <span className="label">3 · The golden rule</span>
            <textarea
              className="field min-h-[74px] resize-y leading-snug"
              placeholder="R = v²·sin(2θ)/g — maximise at 45°, then check units before committing the bubble."
              value={rule}
              onChange={(e) => setRule(e.target.value)}
              maxLength={400}
            />
          </label>

          <div className="flex items-center gap-2">
            <button type="submit" className="btn-light !py-2 text-[13px]">
              <Icon name="plus" size={14} /> Add red flag
            </button>
            <span className="text-[11.5px] text-glow-200/45">Saved to this browser · {state.entries.length} total</span>
            {stale > 0 ? (
              <button type="button" onClick={() => { setOnlyOpen(true); setFilterSubject('all'); }} className="btn-tiny !border-rose/40 !bg-rose/10 !text-rose">
                <Icon name="clock" size={12} /> {stale} older than 48 h
              </button>
            ) : null}
          </div>
        </form>
      </Card>

      <div className="grid gap-4">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h4 className="font-display text-[15px] font-semibold text-white">Notebook</h4>
              <span className="text-[11px] text-glow-200/45">
                {derived.openErrors} open · {derived.clearedErrors} cleared
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setOnlyOpen((v) => !v)}
                className={cn('btn-tiny', onlyOpen && '!border-mint/40 !bg-mint/10 !text-mint')}
              >
                <Icon name="eye" size={12} /> {onlyOpen ? 'Open only' : 'All states'}
              </button>
              <select
                className="field !w-auto !py-1 text-[12px]"
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value as SubjectKey | 'all')}
                aria-label="Filter notebook by subject"
              >
                <option value="all">All subjects</option>
                {SUBJECT_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {SUBJECTS[s].name}
                  </option>
                ))}
              </select>
              <button type="button" className="btn-tiny" onClick={exportCsv}>
                <Icon name="download" size={12} /> CSV
              </button>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {entries.length === 0 ? (
              <EmptyState
                icon="flag"
                title={state.entries.length ? 'Nothing matches this filter' : 'The notebook is clean'}
                body={
                  state.entries.length
                    ? 'Switch the subject filter or show cleared entries to see the rest of the log.'
                    : 'Every missed question from the 5:30 AM drill hour belongs here — topic, cause, and the one-line fix. An empty notebook on Week 3 means the drill hour was skipped, not that you are flawless.'
                }
              />
            ) : (
              (showAll ? entries : entries.slice(0, 6)).map((e) => (
                <article
                  key={e.id}
                  className={cn(
                    'group relative overflow-hidden rounded-xl border p-3 transition',
                    e.cleared ? 'border-mint/20 bg-mint/[0.04]' : 'border-white/[0.08] bg-white/[0.025] hover:border-white/16',
                  )}
                >
                  <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: SUBJECTS[e.subject].color, opacity: e.cleared ? 0.35 : 0.9 }} />
                  <div className="flex items-start gap-3 pl-1.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-semibold text-white">{e.topic}</span>
                        {e.year ? <span className="text-[11px] text-glow-200/50">{e.year}</span> : null}
                        <Tag color={SUBJECTS[e.subject].color}>{SUBJECTS[e.subject].short}</Tag>
                        <Tag>wk {e.week} · {fmtShortDate(parseISO(e.created))}</Tag>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px]">
                        <span className="inline-flex items-center gap-1 text-rose/85">
                          <Icon name="x" size={11} /> {REASONS.find((r) => r.key === e.reason)?.label}
                        </span>
                        {e.rule ? <span className="text-glow-200/70">↳ {e.rule}</span> : <span className="text-glow-200/35">↳ no golden rule yet</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => dispatch({ type: 'patchEntry', id: e.id, patch: { cleared: !e.cleared } })}
                        className={cn('grid h-7 w-7 place-items-center rounded-lg border transition', e.cleared ? 'border-mint/50 bg-mint/15 text-mint' : 'border-white/12 hover:border-mint/50 hover:text-mint')}
                        aria-label={e.cleared ? 'Reopen entry' : 'Mark cleared after re-solving'}
                        title={e.cleared ? 'Reopen' : 'Mark cleared (re-solved)'}
                      >
                        <Icon name="check" size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => dispatch({ type: 'delEntry', id: e.id })}
                        className="grid h-7 w-7 place-items-center rounded-lg border border-white/12 text-glow-200/50 transition hover:border-rose/50 hover:text-rose"
                        aria-label="Delete entry"
                        title="Delete"
                      >
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          {entries.length > 6 ? (
            <button type="button" className="btn-tiny mt-3" onClick={() => setShowAll((v) => !v)}>
              <Icon name="chevron" size={12} className={cn('transition', showAll && 'rotate-180')} />
              {showAll ? 'Collapse' : `Show ${entries.length - 6} more`}
            </button>
          ) : null}
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <h4 className="font-display text-[14px] font-semibold text-white">Failure causes</h4>
            <p className="mt-0.5 text-[11.5px] text-glow-200/50">Attack the biggest bucket first.</p>
            <div className="mt-3 space-y-2.5">
              {reasonCounts.map((r) => (
                <div key={r.key}>
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="text-glow-100/85">{r.label}</span>
                    <span className="num text-glow-200/50">{r.count}</span>
                  </div>
                  <Bar value={state.entries.length ? r.count / Math.max(1, state.entries[0] ? Math.max(...reasonCounts.map((x) => x.count)) : 1) : 0} color="#f472b6" className="mt-1" height={4} />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h4 className="font-display text-[14px] font-semibold text-white">Re-solve queue</h4>
            <p className="mt-0.5 text-[11.5px] text-glow-200/50">Phase 2 exists to erase this list.</p>
            <div className="mt-3 space-y-2">
              {state.entries.filter((e) => !e.cleared).slice(0, 5).map((e) => (
                <div key={e.id} className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-2.5 py-2 text-[12px]">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: SUBJECTS[e.subject].color }} />
                  <span className="min-w-0 flex-1 truncate text-glow-100/85">{e.topic}</span>
                  <span className="num text-[10.5px] text-glow-200/45">wk {e.week}</span>
                </div>
              ))}
              {state.entries.filter((e) => !e.cleared).length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/[0.12] px-3 py-4 text-center text-[12px] text-glow-200/50">
                  Queue empty. Re-audit at Week 8 and Week 14 group checkpoints.
                </div>
              ) : (
                <div className="pt-1 text-[11.5px] text-glow-200/50">
                  +{state.entries.filter((e) => !e.cleared).length - Math.min(5, state.entries.filter((e) => !e.cleared).length)} more · every Phase 1 miss must be re-solved in weeks 15–17.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  function exportCsv() {
    const head = 'created,week,subject,topic,exam_year,reason,golden_rule,cleared';
    const rows = entries.map((e) =>
      [
        e.created,
        e.week,
        SUBJECTS[e.subject].name,
        `"${e.topic.replace(/"/g, '""')}"`,
        `"${(e.year ?? '').replace(/"/g, '""')}"`,
        REASONS.find((r) => r.key === e.reason)?.label ?? e.reason,
        `"${(e.rule ?? '').replace(/"/g, '""')}"`,
        e.cleared ? 'yes' : 'no',
      ].join(','),
    );
    download('sage-red-flag-notebook.csv', [head, ...rows].join('\n'), 'text/csv');
  }
}

const WEEK_TARGET = (n: number) => (n <= 14 ? 15 : n <= 19 ? 20 : 45);

function download(name: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/* ------------------------------------------------------------------ *
 * 28-day drill heatmap — exported for the Stats view
 * ------------------------------------------------------------------ */

export function DrillHeatmap({ compact = false }: { compact?: boolean }) {
  const { state } = useStore();
  const days = useMemo(() => {
    const out: { key: string; total: number; log: NonNullable<ReturnType<typeof pick>> }[] = [];
    for (let i = 27; i >= 0; i--) {
      const d = addDays(new Date(), -i);
      const key = isoDate(d);
      const log = pick(state.days[key]);
      out.push({ key, total: log.stem + log.evening + log.sat + log.eng, log });
    }
    return out;
  }, [state.days]);

  const max = Math.max(45, ...days.map((d) => d.total));
  const byWeek = new Map<string, number>();
  for (const d of days) byWeek.set(weekKey(parseISO(d.key)), (byWeek.get(weekKey(parseISO(d.key))) ?? 0) + d.total);

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h4 className="font-display text-[14px] font-semibold text-white">Last 28 days</h4>
          <p className="text-[11.5px] text-glow-200/50">Colour = questions logged that day · green ring = lights-out held</p>
        </div>
        <div className="text-right">
          <div className="num text-[18px] font-semibold text-white">{days.reduce((a, d) => a + d.total, 0).toLocaleString()}</div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-glow-200/45">Qs / 4 weeks</div>
        </div>
      </div>
      <div className={cn('mt-3 grid grid-cols-7 gap-1.5', compact && 'gap-1')}>
        {days.map((d) => {
          const p = d.total / max;
          const on = d.total >= 45;
          return (
            <div
              key={d.key}
              title={`${d.key} · ${d.total} Qs (drill ${d.log.stem} · link ${d.log.evening} · SAT ${d.log.sat} · Eng ${d.log.eng})${d.log.lightsOut ? ' · lights out ✓' : ''}`}
              className={cn('relative aspect-square rounded-[7px] border transition', d.log.lightsOut ? 'border-mint/45' : 'border-white/[0.07]')}
              style={{ background: `rgba(111,155,255,${0.05 + p * 0.75})`, boxShadow: on ? '0 0 14px -4px rgba(158,193,255,0.9)' : undefined }}
            >
              <span className="absolute inset-x-0 bottom-0.5 text-center text-[8.5px] tabular-nums text-white/45">{Number(d.key.slice(8))}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {[...byWeek.entries()].slice(-2).map(([wk, q]) => (
          <div key={wk} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2">
            <span className="num text-[11px] text-glow-200/50">{wk}</span>
            <Bar value={q / 100} color="#6f9bff" className="flex-1" height={5} />
            <span className="num text-[12.5px] font-semibold text-white">{q}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function pick(d?: { stem: number; evening: number; sat: number; eng: number; lightsOut: boolean }) {
  return d ?? { stem: 0, evening: 0, sat: 0, eng: 0, lightsOut: false };
}

export function todayDrillTotal(stateDays: Record<string, { stem: number; evening: number; sat: number; eng: number }>) {
  const l = stateDays[todayKey()];
  return l ? l.stem + l.evening + l.sat + l.eng : 0;
}
