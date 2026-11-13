import { useRef, useState } from 'react';
import { Card, Icon, Tag } from '../components/ui';
import { emptyState, useStore, type State } from '../lib/store';
import { addDays, fmtLongDate, fmtShortDate, parseISO } from '../lib/date';
import { DAY_PLAN, PHASES, WEEKS, phaseOf } from '../data/roadmap';
import { cn } from '../components/cn';

export function Settings() {
  const { state, dispatch, derived, storageOk } = useStore();
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const file = useRef<HTMLInputElement | null>(null);

  const flash = (m: string) => {
    setMsg(m);
    window.setTimeout(() => setMsg(null), 2600);
  };

  const start = parseISO(state.programStart);
  const projectedEnd = addDays(start, 167);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sage-progress-week-${derived.currentWeek}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    flash('Backup downloaded — keep it with your error notebook.');
  };

  const importJson = (f: File) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const parsed = JSON.parse(String(r.result)) as State;
        dispatch({ type: 'import', state: parsed });
        flash('Progress restored from backup.');
      } catch {
        flash('That file could not be read — export a fresh backup and try again.');
      }
    };
    r.readAsText(f);
  };

  const copySummary = async () => {
    const lines = [
      `SAGE · EUEE 24-week status — ${fmtLongDate(new Date())}`,
      `${state.name ? state.name + ' · ' : ''}Week ${derived.currentWeek} (${phaseOf(derived.currentWeek).name})`,
      `Checklist: ${derived.doneCount}/${derived.totalTasks} tasks (${Math.round(derived.completion * 100)}%)`,
      `Questions logged: ${derived.questions.toLocaleString()} of ${derived.plannedQuestions.toLocaleString()} expected by now`,
      `Streak: ${derived.streak} days · Lights-out held: ${derived.sleepDays} nights`,
      `Red flags: ${derived.openErrors} open, ${derived.clearedErrors} cleared`,
      `Readiness score: ${derived.readiness}%`,
      `Next: ${WEEKS[derived.currentWeek - 1].tasks.filter((t) => !state.done[t.id]).slice(0, 3).map((t) => t.label).join(' · ') || 'week is clear — rest well'}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      flash('Thursday group-sync summary copied.');
    } catch {
      flash('Clipboard blocked by the browser — use the JSON backup instead.');
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
      <Card glow>
        <span className="kicker">
          <Icon name="compass" size={12} className="text-glow-300" /> Program clock
        </span>
        <h3 className="mt-2 font-display text-[20px] font-semibold text-white">Tell SAGE when your 24 weeks start</h3>
        <p className="muted mt-1.5 text-[13px]">
          The Command Deck uses these dates to decide which week you are in, which subjects belong to today, and how much sleep you have
          left before the alarm.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="label">Who is running this plan?</span>
            <input
              className="field"
              placeholder="Optional — shown in the greeting and the printed wall sheet"
              value={state.name}
              maxLength={40}
              onChange={(e) => dispatch({ type: 'field', key: 'name', value: e.target.value })}
            />
          </label>
          <label>
            <span className="label">Week 1 begins</span>
            <input type="date" className="field" value={state.programStart} onChange={(e) => dispatch({ type: 'field', key: 'programStart', value: e.target.value || state.programStart })} />
          </label>
          <label>
            <span className="label">National exam day</span>
            <input type="date" className="field" value={state.examDate} onChange={(e) => dispatch({ type: 'field', key: 'examDate', value: e.target.value || state.examDate })} />
          </label>
          <label>
            <span className="label">Study group size</span>
            <input
              type="number"
              min={1}
              max={40}
              className="field"
              value={state.groupSize}
              onChange={(e) => dispatch({ type: 'field', key: 'groupSize', value: Math.max(1, Math.min(40, Number(e.target.value) || 1)) })}
            />
          </label>
          <div className="flex flex-col justify-end">
            <span className="label">Projected finish</span>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-glow-100">
              {fmtShortDate(projectedEnd)} <span className="text-glow-200/45">· week 24 close-out</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className={cn('flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[12px]', storageOk ? 'border-mint/25 bg-mint/[0.05] text-mint' : 'border-amber/30 bg-amber/[0.06] text-amber')}>
            <Icon name={storageOk ? 'shield' : 'eye'} size={14} />
            {storageOk ? 'Saved in this browser (localStorage)' : 'Storage blocked — progress lives only until refresh'}
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-[12px] text-glow-200/70">
            <Icon name="calendar" size={14} className="text-glow-300" />
            {derived.daysToExam >= 0 ? `${derived.daysToExam} days to the exam` : 'Exam window passed — rest, then re-run the sprint'}
          </div>
        </div>
      </Card>

      <div className="grid gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <h4 className="font-display text-[15px] font-semibold text-white">Backup & hand-off</h4>
            {msg ? <span className="text-[11.5px] text-mint">{msg}</span> : <Tag>{derived.completeWeeks}/24 weeks</Tag>}
          </div>
          <p className="muted mt-1.5 text-[12.5px]">
            Move your progress between the dorm machine and your phone, paste it into the Thursday group thread, or keep a copy with the
            physical notebook.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-tiny" onClick={exportJson}>
              <Icon name="download" size={13} /> Export JSON
            </button>
            <button type="button" className="btn-tiny" onClick={() => file.current?.click()}>
              <Icon name="upload" size={13} /> Import JSON
            </button>
            <input
              ref={file}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importJson(f);
                e.target.value = '';
              }}
            />
            <button type="button" className="btn-tiny" onClick={copySummary}>
              <Icon name="quote" size={13} /> Copy sync summary
            </button>
            <button type="button" className="btn-tiny" onClick={() => window.print()}>
              <Icon name="printer" size={13} /> Print wall sheet
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-4">
            {!confirmReset ? (
              <button type="button" className="btn-tiny !border-white/10" onClick={() => setConfirmReset(true)}>
                <Icon name="reset" size={13} /> Reset all progress
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-rose/35 bg-rose/[0.07] px-3 py-2">
                <span className="text-[12px] text-glow-100">Erase every tick, counter and notebook entry?</span>
                <button
                  type="button"
                  className="btn-tiny !border-rose/50 !bg-rose/15 !text-rose"
                  onClick={() => {
                    dispatch({ type: 'reset' });
                    setConfirmReset(false);
                    flash('Fresh start — Week 1, nothing checked.');
                  }}
                >
                  Yes, reset
                </button>
                <button type="button" className="btn-tiny" onClick={() => setConfirmReset(false)}>
                  Keep my data
                </button>
              </div>
            )}
            <span className="text-[11px] text-glow-200/40">Dates and name are kept.</span>
          </div>
        </Card>

        <Card>
          <h4 className="font-display text-[15px] font-semibold text-white">Phase map</h4>
          <div className="mt-3 space-y-2">
            {PHASES.map((p) => {
              const on = p.key === phaseOf(derived.currentWeek).key;
              return (
                <a
                  key={p.key}
                  href="#checklist"
                  className={cn(
                    'flex items-start gap-3 rounded-xl border p-3 transition',
                    on ? 'border-white/20 bg-white/[0.06]' : 'border-white/[0.07] bg-white/[0.02] hover:border-white/16',
                  )}
                >
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: p.accent }} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-semibold text-white">{p.name}</span>
                      <span className="num text-[11px] text-glow-200/50">{p.window}</span>
                      {on ? <Tag color={p.accent}>current</Tag> : null}
                    </span>
                    <span className="mt-0.5 block text-[11.5px] leading-snug text-glow-200/55">{p.headline}</span>
                  </span>
                  <Icon name="arrow" size={14} className="mt-1 text-glow-200/40" />
                </a>
              );
            })}
          </div>
        </Card>
      </div>

      <PrintSheet />
    </div>
  );
}

/** Print-only week sheet: open on any week, tick boxes with a pen. */
function PrintSheet() {
  const { state, derived } = useStore();
  const week = WEEKS[derived.currentWeek - 1];
  return (
    <div className="hidden print:col-span-2 print:block print:w-full" aria-hidden="true">
      <div className="mb-3 flex items-end justify-between border-b border-black/20 pb-2">
        <div>
          <div className="font-display text-[18px] font-bold">{state.name ? `${state.name} · ` : ''}SAGE wall sheet — Week {week.n} of 24</div>
          <div className="text-[11px]">{phaseOf(week.n).name} · {week.stage} · printed {fmtShortDate(new Date())}</div>
        </div>
        <div className="text-right text-[11px]">
          <div>Drill target: {week.drillTarget}/day · {week.weeklyQuestions} STEM + 40 clinic</div>
          <div>Lights out 8:30 PM · up 3:00 AM · weekend 100% free</div>
        </div>
      </div>
      <ol className="space-y-1.5">
        {week.tasks.map((t) => (
          <li key={t.id} className="flex items-start gap-2 text-[12px]">
            <span className={cn('mt-[2px] inline-block h-3 w-3 border border-black/50', state.done[t.id] ? 'bg-black/70' : '')} />
            <span>
              <b>{t.tag}:</b> {t.label}
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[9px]">
        {DAY_PLAN.map((d, i) => (
          <div key={d.day} className="border border-black/20 p-1">
            <div className="font-bold">{d.short}</div>
            <div>{i < 2 ? 'A subj' : i < 4 ? 'B subj' : i === 4 ? 'buffer' : 'off'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const blank = emptyState;
