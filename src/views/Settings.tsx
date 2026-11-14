import { useRef, useState } from 'react';
import { Card, Icon, Tag } from '../components/ui';
import { useStore, type State } from '../lib/store';
import { addDays, fmtLongDate, fmtShortDate, parseISO } from '../lib/date';
import { printWallSheet } from '../lib/print';
import { downloadIcs } from '../lib/ics';
import { REMINDERS, notificationPermission, requestNotifications, type ReminderKey } from '../lib/reminders';
import { PHASES, WEEKS, phaseOf } from '../data/roadmap';
import { cn } from '../components/cn';

export function Settings() {
  const { state, dispatch, derived, storageOk, cloud } = useStore();
  const phaseLabel =
    cloud.phase === 'unconfigured'
      ? 'local only'
      : cloud.phase === 'signed-out'
        ? 'not connected'
        : cloud.phase === 'syncing'
          ? 'syncing…'
          : cloud.phase === 'queued'
            ? 'queued'
            : cloud.phase === 'offline'
              ? 'offline — queued'
              : cloud.phase === 'error'
                ? 'needs attention'
                : 'in sync';
  const phaseTone =
    cloud.phase === 'synced'
      ? 'border-mint/35 text-mint'
      : cloud.phase === 'error'
        ? 'border-rose/40 text-rose'
        : cloud.phase === 'unconfigured' || cloud.phase === 'signed-out'
          ? 'border-white/12 text-glow-200/60'
          : 'border-glow-300/30 text-glow-100';
  const [msg, setMsg] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [perm, setPerm] = useState(() => notificationPermission());
  const permLabel = perm === 'unsupported' ? 'In-app only' : perm === 'granted' ? 'Notifications on' : 'Allow notifications';
  const permission = () => notificationPermission();
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
        <Card glow={cloud.configured && cloud.signedIn}>
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-display text-[15px] font-semibold text-white">Cloud sync</h4>
            <span className={cn('pill !py-1 !text-[10.5px]', phaseTone)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', cloud.phase === 'synced' ? 'bg-mint' : cloud.phase === 'error' ? 'bg-rose' : 'bg-glow-300')} />
              {phaseLabel}
            </span>
          </div>
          {!cloud.configured ? (
            <>
              <p className="muted mt-1.5 text-[12.5px] leading-[1.55]">
                This build has no sync endpoint wired, and that is the default: <strong className="text-glow-100">SAGE needs no account</strong>. Your
                ticks live in this browser, and the JSON export below is how they move between devices.
              </p>
              <p className="mt-2 text-[12px] leading-[1.55] text-glow-200/55">
                If you want phone ↔ laptop sync anyway, drop a Supabase URL and publishable key into{" "}
                <code className="rounded bg-white/[0.06] px-1">VITE_SUPABASE_URL</code> /{" "}
                <code className="rounded bg-white/[0.06] px-1">VITE_SUPABASE_ANON_KEY</code> and set{" "}
                <code className="rounded bg-white/[0.06] px-1">supabase/schema.sql</code> — the app then mirrors on top of local storage, never
                instead of it.
              </p>
            </>
          ) : cloud.signedIn ? (
            <>
              <p className="muted mt-1.5 text-[12.5px]">
                Syncing as <span className="text-glow-100">{cloud.who ?? 'this device'}</span> · revision {state.rev}
                {cloud.pending > 0 ? ` · ${cloud.pending} change${cloud.pending === 1 ? '' : 's'} waiting` : ''}
                {cloud.lastSyncAt ? ` · last sync ${new Date(cloud.lastSyncAt).toLocaleTimeString()}` : ''}
              </p>
              <label className="mt-3 flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5">
                <input type="checkbox" checked={cloud.auto} onChange={(e) => cloud.setAuto(e.target.checked)} className="h-4 w-4 accent-[#6f9bff]" />
                <span className="text-[12.5px] text-glow-100/85">Mirror automatically a few seconds after each change</span>
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="btn-tiny" onClick={() => void cloud.push()}>
                  <Icon name="upload" size={13} /> Push now
                </button>
                <button type="button" className="btn-tiny" onClick={() => void cloud.sync()}>
                  <Icon name="reset" size={13} /> Pull &amp; merge
                </button>
                <button type="button" className="btn-tiny" onClick={cloud.signOut}>
                  <Icon name="x" size={13} /> Disconnect
                </button>
              </div>
              <p className="muted mt-2.5 text-[11.5px] leading-[1.5]">
                Conflicts are resolved by revision, not by merging — the device with the newer revision wins, and the one that loses keeps a
                local snapshot of the last three restores, so a losing device can still be re-imported.
              </p>
            </>
          ) : (
            <>
              <p className="muted mt-1.5 text-[12.5px]">
                Optional, and reversible at any time: connect a Supabase account and the plan mirrors itself between the dorm laptop and the
                phone you tick at 5:30 AM. Nothing you do here depends on it.
              </p>
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <label className="min-w-[190px] flex-1">
                  <span className="label">Email for a magic link</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="field mt-1.5 w-full"
                    autoComplete="email"
                  />
                </label>
                <button type="button" className="btn-light !py-2.5 text-[13.5px]" onClick={() => void cloud.signInEmail(email)}>
                  <Icon name="arrow" size={15} /> Send link
                </button>
                <button type="button" className="btn-ghost !py-2.5 text-[13.5px]" onClick={cloud.signInGoogle}>
                  <Icon name="shield" size={15} /> Google
                </button>
              </div>
            </>
          )}
          {cloud.error ? <p className="mt-2.5 text-[11.5px] text-rose">{cloud.error}</p> : null}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h4 className="font-display text-[15px] font-semibold text-white">Backup & hand-off</h4>
            {msg ? <span className="text-[11.5px] text-mint">{msg}</span> : <Tag>{derived.completeWeeks}/24 weeks</Tag>}
          </div>
          <p className="muted mt-1.5 text-[12.5px]">
            Move your progress between the dorm machine and your phone, paste it into the Thursday group thread, or put the shift grid
            itself into your phone calendar so the 3:00 AM block survives a closed tab.
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
            <button type="button" className="btn-tiny" onClick={printWallSheet}>
              <Icon name="printer" size={13} /> Print wall sheet
            </button>
            <button
              type="button"
              className="btn-tiny"
              onClick={() => {
                downloadIcs({ programStart: state.programStart, examDate: state.examDate, name: state.name });
                flash('Calendar file downloaded — open it to add the 24 weeks to your phone.');
              }}
            >
              <Icon name="calendar" size={13} /> Export .ics calendar
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-4">
            {!confirmReset ? (
              <button type="button" className="btn-tiny !border-white/10" onClick={() => setConfirmReset(true)}>
                <Icon name="reset" size={13} /> Reset all progress
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-rose/35 bg-rose/[0.07] px-3 py-2">
                <span className="text-[12px] text-glow-100">
                  Erase every tick, counter and notebook entry{cloud.signedIn && cloud.auto ? ' — and, on the next sync, every device mirrored to your account' : ''}?
                </span>
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
          <div className="flex items-center justify-between">
            <h4 className="font-display text-[15px] font-semibold text-white">Boundaries &amp; reminders</h4>
            <button type="button" className="btn-tiny" onClick={() => void requestNotifications().then(() => setPerm(permission()))}>
              <Icon name="alarm" size={13} /> {permLabel}
            </button>
          </div>
          <p className="muted mt-1.5 text-[12.5px]">
            Three times the plan cannot survive without. On a phone, an acknowledged nudge ticks the habit for you; the alarm still has
            to be yours.
          </p>
          <div className="mt-3 grid gap-1.5">
            {(Object.keys(REMINDERS) as ReminderKey[]).map((k) => {
              const on = state.reminders[k];
              return (
                <button
                  key={k}
                  type="button"
                  role="switch"
                  aria-checked={on}
                  onClick={() => dispatch({ type: 'setReminder', field: k, value: !on })}
                  className={cn(
                    'tap flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition',
                    on ? 'border-glow-400/45 bg-glow-500/15' : 'border-white/10 bg-white/[0.03]',
                  )}
                >
                  <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg border', on ? 'border-glow-300/40 bg-white/10 text-glow-100' : 'border-white/10 bg-white/[0.04] text-glow-300/60')}>
                    <Icon name={k === 'wake' ? 'alarm' : k === 'drill' ? 'target' : 'moon'} size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-white">{REMINDERS[k].label} · {REMINDERS[k].title.split('—')[1]?.trim() ?? REMINDERS[k].title}</span>
                    <span className="block truncate text-[11.5px] text-glow-200/50">{REMINDERS[k].body}</span>
                  </span>
                  <span className={cn('checkbox shrink-0', on && '!border-transparent')} data-checked={on} aria-hidden="true">
                    {on ? <Icon name="check" size={12} className="text-ink-950" /> : null}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="muted mt-2.5 text-[11.5px]">
            Weekdays only — Friday drops the drill nudge, the weekend drops everything but the 3:00 AM wake for Saturday’s 40 questions.
          </p>
        </Card>

        {derived.scheduleSlip > 0 ? (
          <Card className="!border-amber/35 !bg-amber/[0.06]">
            <span className="kicker">
              <Icon name="flag" size={12} className="text-amber" /> Schedule pressure
            </span>
            <h4 className="mt-2 font-display text-[16px] font-semibold text-white">
              {derived.weeksLeftInPlan} weeks of plan, {derived.calendarWeeksLeft} weeks of calendar
            </h4>
            <p className="muted mt-1.5 text-[13px] leading-[1.55]">
              You are {derived.scheduleSlip} week{derived.scheduleSlip === 1 ? '' : 's'} behind the grid. The plan’s own answer is not to
              add hours: re-book the start so the remaining weeks land before the exam, then let the Sunday catch-up block absorb what is
              behind.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn-tiny" onClick={() => dispatch({ type: 'shiftStart', days: 7 })}>
                <Icon name="reset" size={13} /> Slide the plan 7 days later
              </button>
              <button type="button" className="btn-tiny" onClick={() => dispatch({ type: 'shiftStart', days: -7 })}>
                <Icon name="arrow" size={13} /> Pull it 7 days earlier
              </button>
              <a href="#group" className="btn-tiny">
                Book a catch-up block
              </a>
            </div>
          </Card>
        ) : null}

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

    </div>
  );
}

