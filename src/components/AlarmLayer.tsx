import { useEffect, useMemo, useState } from 'react';
import { REMINDERS, inWindow, notify, reminderApplies, type ReminderKey } from '../lib/reminders';
import { todayKey } from '../lib/date';
import { useNow, useStore } from '../lib/store';
import { WEEKS } from '../data/roadmap';
import { Icon } from './ui';
import { haptic } from '../lib/haptic';
import { cn } from './cn';

/**
 * Watches the three hard boundaries of the day. When one is due it (a) fires a system
 * notification if permission was granted and (b) raises a full-screen nudge that logs the
 * habit when acknowledged — so the reminder does the bookkeeping instead of just beeping.
 */
export function AlarmLayer({ onOpenDrill }: { onOpenDrill?: () => void }) {
  const now = useNow(30000);
  const { state, dispatch, derived } = useStore();
  const [pending, setPending] = useState<ReminderKey | null>(null);
  const week = WEEKS[derived.currentWeek - 1];

  const due = useMemo(() => {
    if (!reminderApplies('wake', now)) return null;
    for (const key of ['wake', 'drill', 'windDown'] as ReminderKey[]) {
      if (!state.reminders[key]) continue;
      if (state.reminders.lastFired[key] === todayKey()) continue;
      if (inWindow(now, REMINDERS[key].mins)) return key;
    }
    return null;
  }, [now.getHours(), now.getMinutes(), state.reminders]);

  useEffect(() => {
    if (!due) return;
    const r = REMINDERS[due];
    const body = due === 'drill' ? `${week.drillTarget} questions, then file every miss by 6:30.` : r.body;
    notify(r.title, body, due);
    dispatch({ type: 'markFired', key: due });
    setPending(due);
    haptic(60);
  }, [due]);

  useEffect(() => {
    if (!pending) return;
    const t = window.setTimeout(() => setPending(null), 90000);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPending(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [pending]);

  if (!pending) return null;
  const r = REMINDERS[pending];

  return (
    <div className="fixed inset-0 z-[60] no-print md:hidden" role="alertdialog" aria-modal="true" aria-label={r.title}>
      <div className="absolute inset-0 bg-ink-950/95 backdrop-blur-md" />
      <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
        <span className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(86,136,255,0.3), transparent 70%)' }} />
        <span className="relative grid h-16 w-16 animate-breathe place-items-center rounded-3xl border border-glow-300/30 bg-white/[0.07] text-glow-100">
          <Icon name={pending === 'wake' ? 'alarm' : pending === 'drill' ? 'target' : 'moon'} size={30} />
        </span>
        <div className="relative mt-5 text-[11.5px] uppercase tracking-[0.2em] text-glow-300/70">{r.label} · week {week.n}</div>
        <h2 className="relative mt-2 font-display text-[26px] font-semibold leading-tight text-white">{r.title}</h2>
        <p className="muted relative mt-2 max-w-sm text-[14px]">{r.body}</p>
        <div className="relative mt-7 grid w-full max-w-xs gap-2">
          {pending === 'drill' ? (
            <button
              type="button"
              className="btn-light !py-3.5"
              onClick={() => {
                setPending(null);
                onOpenDrill?.();
              }}
            >
              <Icon name="play" size={16} /> {r.cta}
            </button>
          ) : (
            <button
              type="button"
              className="btn-light !py-3.5"
              onClick={() => {
                if (r.habit) dispatch({ type: 'flag', day: todayKey(), field: r.habit, value: true });
                setPending(null);
              }}
            >
              <Icon name="check" size={16} /> {r.cta}
            </button>
          )}
          <button type="button" onClick={() => setPending(null)} className="btn-ghost !py-3">
            Not now
          </button>
        </div>
        <p className={cn('muted relative mt-5 text-[11.5px] text-glow-200/40')}>
          {state.reminders[pending] ? 'This nudge fires once per day.' : 'Turn it on again in Settings → Reminders.'}
        </p>
      </div>
    </div>
  );
}
