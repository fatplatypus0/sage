import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, EmptyState, Icon, Ring, Tag } from '../components/ui';
import { REASONS, useStore, type Reason, type SessionKind } from '../lib/store';
import { SUBJECTS, WEEKS } from '../data/roadmap';
import { fmtShortDate, parseISO, todayKey } from '../lib/date';
import { haptic } from '../lib/haptic';
import { cn } from '../components/cn';

const MODES: { kind: SessionKind; label: string; note: string; secs: number; field: 'stem' | 'evening' | 'sat' }[] = [
  { kind: 'drill', label: 'Locked drill hour', note: '5:30 – 6:30 AM · 15–20 questions, no reading', secs: 90, field: 'stem' },
  { kind: 'evening', label: 'Evening Gr 12 link', note: '6:15 – 7:30 PM · linked Grade 12 past questions', secs: 150, field: 'evening' },
  { kind: 'clinic', label: 'Thursday clinic', note: '5:30 – 6:50 PM · 20 SAT + 20 English, timed', secs: 60, field: 'sat' },
];

/**
 * The plan's core ritual, actually implemented: a timed question session that writes the
 * day's count and files every miss straight into the Red-Flag notebook. Question content
 * stays on paper — this is the harness, not a question bank.
 */
export function Drill() {
  const { state, dispatch, derived } = useStore();
  const week = WEEKS[derived.currentWeek - 1];
  const open = derived.openSession;
  const [kind, setKind] = useState<SessionKind>('drill');
  const [topic, setTopic] = useState('');
  const [pendingWrong, setPendingWrong] = useState(false);
  const [secs, setSecs] = useState(90);
  const [autoLog, setAutoLog] = useState(true);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const override = state.overrides[String(week.n)] ?? {};
  const mode = MODES.find((m) => m.kind === (open?.kind ?? kind))!;
  const session = open;
  const items = session?.items ?? [];
  const correct = items.filter((i) => i.outcome === 'correct').length;
  const wrong = items.filter((i) => i.outcome === 'wrong').length;
  const skipped = items.filter((i) => i.outcome === 'skipped').length;
  const target = session?.target ?? week.drillTarget;
  const perItem = session?.perItemSecs ?? mode.secs;

  /* per-item countdown: the plan allows ~90 s per multiple-choice question */
  useEffect(() => {
    if (!session) return;
    setSecs(perItem);
    const t = window.setInterval(() => setSecs((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => window.clearInterval(t);
  }, [session?.id, items.length, perItem]);

  const suggestions = useMemo(
    () =>
      week.sides.flatMap((s) =>
        s.units
          .split(/&|·/)
          .map((u) => u.replace(/\(.*?\)/g, '').trim())
          .filter((u) => u.length > 6)
          .slice(0, 2)
          .map((u) => `${SUBJECTS[s.subject].short} · ${u}`),
      ),
    [week.n],
  );

  const start = () => {
    dispatch({
      type: 'startSession',
      week: week.n,
      kind,
      target: kind === 'clinic' ? 40 : week.drillTarget,
      perItemSecs: mode.secs,
      subject: kind === 'drill' ? week.sides[override.swapped ? 1 - sideIndex() : sideIndex()].subject : kind === 'clinic' ? 'english' : undefined,
    });
    haptic(12);
    setTimeout(() => inputRef.current?.focus(), 60);
  };

  const log = (outcome: 'correct' | 'wrong' | 'skipped', reason?: Reason) => {
    if (!session) return;
    dispatch({ type: 'logItem', sessionId: session.id, item: { topic: topic.trim(), outcome, reason, secs: perItem - secs } });
    if (outcome === 'wrong') haptic(18);
    setTopic('');
    setPendingWrong(false);
    setSecs(perItem);
    inputRef.current?.focus();
  };

  const finish = () => {
    if (!session) return;
    dispatch({ type: 'endSession', sessionId: session.id, autoLog, dayKey: todayKey() });
    setAutoLog(true);
  };

  /* ---- live session ---- */
  if (session) {
    const over = secs === 0;
    return (
      <Card glow className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="kicker">
              <Icon name="target" size={12} className="text-glow-300" /> Session in progress · week {session.week}
            </span>
            <h3 className="mt-1.5 font-display text-[20px] font-semibold text-white">{mode.label}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Tag color="#6f9bff">{items.length}/{target} logged</Tag>
            <button type="button" className="btn-tiny" onClick={() => dispatch({ type: 'undoItem', sessionId: session.id, itemId: items[items.length - 1]?.id ?? '' })} disabled={!items.length}>
              <Icon name="reset" size={13} /> Undo last
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[150px_1fr] sm:items-center">
          <div className="flex items-center justify-center gap-4 sm:flex-col">
            <Ring value={target ? Math.min(1, items.length / target) : 0} size={132} stroke={9} color={over ? '#fbbf24' : '#6f9bff'} label={<span className="text-[26px] font-bold">{String(Math.floor(secs / 60)).padStart(1, '0')}:{String(secs % 60).padStart(2, '0')}</span>} sub="per question" />
          </div>

          <div className="min-w-0">
            <label className="label" htmlFor="drill-topic">
              Question topic <span className="normal-case tracking-normal text-glow-200/40">(optional — powers the costliest-topics board)</span>
            </label>
            <div className="flex gap-2">
              <input
                id="drill-topic"
                ref={inputRef}
                list="drill-topics"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') log('correct');
                }}
                placeholder={suggestions[items.length % Math.max(1, suggestions.length)] ?? 'e.g. Gr 11 Projectile range'}
                className="field flex-1"
                maxLength={120}
                autoComplete="off"
              />
              <datalist id="drill-topics">
                {suggestions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            {pendingWrong ? (
              <div className="mt-3 rounded-2xl border border-rose/30 bg-rose/[0.06] p-3">
                <div className="label !mb-2 text-rose/90">Why did you miss it?</div>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {REASONS.map((r) => (
                    <button key={r.key} type="button" onClick={() => log('wrong', r.key)} className="tap min-h-[44px] rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2 text-left text-[12.5px] text-glow-100/90 active:scale-[0.98]">
                      {r.label}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => log('wrong')} className="btn-tiny mt-2">
                  Skip the reason, just file it
                </button>
              </div>
            ) : null}

            <div className="mt-3 grid grid-cols-3 gap-2">
              <button type="button" onClick={() => log('correct')} className="tap flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-2xl border border-mint/35 bg-mint/[0.12] text-white active:scale-95">
                <Icon name="check" size={20} className="text-mint" />
                <span className="text-[13px] font-semibold">Correct</span>
              </button>
              <button type="button" onClick={() => setPendingWrong(true)} className="tap flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-2xl border border-rose/35 bg-rose/[0.1] text-white active:scale-95">
                <Icon name="x" size={20} className="text-rose" />
                <span className="text-[13px] font-semibold">Missed</span>
              </button>
              <button type="button" onClick={() => log('skipped')} className="tap flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-2xl border border-white/12 bg-white/[0.05] text-glow-100 active:scale-95">
                <Icon name="arrow" size={20} />
                <span className="text-[13px] font-semibold">Skipped</span>
              </button>
            </div>
            {over ? (
              <p className="mt-2 flex items-center gap-1.5 text-[12px] text-amber">
                <Icon name="clock" size={13} /> Over 90 seconds — the plan says flag it, move on, and autopsy it later.
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.07] pt-3.5">
          {[
            { l: 'Correct', v: correct, c: '#34d399' },
            { l: 'Missed', v: wrong, c: '#f472b6' },
            { l: 'Skipped', v: skipped, c: '#9ec1ff' },
          ].map((x) => (
            <div key={x.l} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2">
              <div className="num text-[18px] font-bold leading-none" style={{ color: x.c }}>
                {x.v}
              </div>
              <div className="mt-1 text-[10.5px] uppercase tracking-[0.12em] text-glow-200/45">{x.l}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3">
          <button type="button" onClick={() => setAutoLog((v) => !v)} className="tap flex items-center gap-2.5 text-left">
            <span className={cn('checkbox', autoLog && '!border-transparent')} data-checked={autoLog} aria-hidden="true">
              {autoLog ? <Icon name="check" size={12} className="text-ink-950" /> : null}
            </span>
            <span>
              <span className="block text-[13px] font-semibold text-white">File {wrong || 'every'} miss into the Red-Flag notebook</span>
              <span className="block text-[11.5px] text-glow-200/50">6:10 – 6:30 AM only has to add the golden rule, not re-type topics.</span>
            </span>
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => dispatch({ type: 'endSession', sessionId: session.id, autoLog: false, dayKey: todayKey() })} className="btn-tiny">
              Discard
            </button>
            <button type="button" onClick={finish} className="btn-light !py-2.5 text-[13.5px]">
              <Icon name="check" size={15} /> End session {items.length ? `(${items.length})` : ''}
            </button>
          </div>
        </div>
      </Card>
    );
  }

  /* ---- setup ---- */
  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
      <Card glow>
        <span className="kicker">
          <Icon name="bolt" size={12} className="text-amber" /> Start the hour
        </span>
        <h3 className="mt-2 font-display text-[21px] font-semibold leading-tight text-white">
          15 questions before sunrise, then the misses get filed
        </h3>
        <p className="muted mt-1.5 text-[13.5px]">
          Pick the block, run the clock, tap once per question. Ending the session writes today&apos;s count and pushes every miss into the
          notebook with the reason you chose — no re-typing at 6:10 AM.
        </p>

        <div className="mt-4 grid gap-1.5">
          {MODES.map((m) => {
            const on = kind === m.kind;
            const t = m.kind === 'clinic' ? 40 : week.drillTarget;
            return (
              <button
                key={m.kind}
                type="button"
                onClick={() => setKind(m.kind)}
                className={cn(
                  'tap flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition',
                  on ? 'border-glow-400/45 bg-glow-500/[0.12]' : 'border-white/[0.07] bg-white/[0.02] active:scale-[0.995]',
                )}
              >
                <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl border', on ? 'border-glow-300/40 bg-white/10 text-glow-100' : 'border-white/10 bg-white/[0.04] text-glow-300')}>
                  <Icon name={m.kind === 'drill' ? 'target' : m.kind === 'evening' ? 'book' : 'sigma'} size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-semibold text-white">{m.label}</span>
                  <span className="block truncate text-[11.5px] text-glow-200/55">{m.note}</span>
                </span>
                <span className="num shrink-0 text-right text-[12px] text-glow-200/70">
                  {t} × {m.secs}s
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={start} className="btn-light flex-1 !py-3 text-[14px] sm:flex-none">
            <Icon name="play" size={15} /> Start {mode.label.toLowerCase()}
          </button>
          <span className="text-[11.5px] text-glow-200/45">
            Week {week.n} · {SUBJECTS[week.sides[0].subject].short} + {SUBJECTS[week.sides[1].subject].short}
            {override.swapped ? <span className="text-amber"> · sides swapped this week</span> : null}
          </span>
        </div>
        <p className="muted mt-3 text-[12px]">
          The plan&apos;s rule applies: stop reading at 5:30 even if the chapter is 70% done. Leftovers go to the Friday buffer, not to tonight.
        </p>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h4 className="font-display text-[15px] font-semibold text-white">Session history</h4>
          <span className="text-[11px] text-glow-200/50">{derived.loggedItems} questions tagged</span>
        </div>
        <div className="mt-3 space-y-2">
          {state.sessions.length === 0 ? (
            <EmptyState
              icon="target"
              title="No sessions run yet"
              body="Counters can be tapped by hand in the deck, but a session gives you timing, accuracy and auto-filed misses — the three things a paper tally never gives you."
            />
          ) : (
            state.sessions.slice(0, 8).map((sn) => {
              const c = sn.items.filter((i) => i.outcome === 'correct').length;
              const pct = sn.items.length ? c / sn.items.length : 0;
              const mins = sn.endedAt ? Math.max(1, Math.round((sn.endedAt - sn.startedAt) / 60000)) : null;
              return (
                <div key={sn.id} className={cn('flex items-center gap-3 rounded-xl border px-3 py-2.5', sn.endedAt ? 'border-white/[0.07] bg-white/[0.02]' : 'border-amber/35 bg-amber/[0.06]')}>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.05] text-[11px] font-semibold text-glow-100">
                    {sn.items.length}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 text-[12.5px] font-semibold text-glow-100">
                      {MODES.find((m) => m.kind === sn.kind)?.label ?? sn.kind}
                      <span className="text-[11px] font-normal text-glow-200/50">· wk {sn.week} · {fmtShortDate(parseISO(sn.day))}</span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full" style={{ width: `${Math.max(4, Math.min(100, (sn.items.length / sn.target) * 100))}%`, background: pct >= 0.7 ? '#34d399' : '#fbbf24' }} />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="num text-[12px] font-semibold text-white">{Math.round(pct * 100)}%</div>
                    <div className="text-[10.5px] text-glow-200/45">{mins ? `${mins} min` : 'running'}</div>
                  </div>
                  {!sn.endedAt ? (
                    <button type="button" onClick={() => dispatch({ type: 'endSession', sessionId: sn.id, autoLog: false, dayKey: todayKey() })} className="btn-tiny !px-2 !text-[11px]" title="Close this stale session without logging">
                      close
                    </button>
                  ) : (
                    <button type="button" onClick={() => dispatch({ type: 'delSession', sessionId: sn.id })} className="btn-tiny !px-2 !text-[11px]" title="Delete session" aria-label="Delete session">
                      <Icon name="trash" size={12} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
        {state.sessions.length ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
              <div className="num text-[17px] font-bold text-white">{Math.round(derived.accuracy * 100)}%</div>
              <div className="text-[10.5px] uppercase tracking-[0.12em] text-glow-200/45">Session accuracy</div>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
              <div className="num text-[17px] font-bold text-white">{derived.itemsToday}</div>
              <div className="text-[10.5px] uppercase tracking-[0.12em] text-glow-200/45">Logged today</div>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

/** Which side of the 2-day split is live: Mon/Tue → side 0, Wed/Thu → side 1. */
function sideIndex() {
  const di = new Date().getDay();
  return di === 3 || di === 4 ? 1 : 0;
}
