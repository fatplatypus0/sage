import { useEffect, useState } from 'react';
import { useFocusTrap } from '../lib/focus';
import { Icon } from './ui';
import { useActiveSection } from './Nav';
import { useStore } from '../lib/store';
import { SUBJECTS, WEEKS, phaseOf } from '../data/roadmap';
import { dayIndex, minutesOfDay, todayKey } from '../lib/date';
import { haptic } from '../lib/haptic';
import { cn } from './cn';

/** Phone chrome: a floating tab bar + a one-tap drill logger, so the plan is usable one-handed at 5:30 AM. */

const TABS = [
  { id: 'today', label: 'Deck', icon: 'bolt' },
  { id: 'drill', label: 'Drill', icon: 'target' },
  { id: 'checklist', label: 'Plan', icon: 'check' },
  { id: 'notebook', label: 'Flags', icon: 'flag' },
  { id: 'progress', label: 'Stats', icon: 'chart' },
];

const SHEET_LINKS = [
  { id: 'features', label: 'What SAGE does', icon: 'sparkle' },
  { id: 'shifts', label: 'Daily system', icon: 'calendar' },
  { id: 'mocks', label: 'Mock ledger', icon: 'trophy' },
  { id: 'group', label: 'Study group', icon: 'users' },
  { id: 'toolkit', label: 'Timer & Thursday sync', icon: 'clock' },
  { id: 'settings', label: 'Dates, reminders, backup', icon: 'compass' },
];

export function MobileChrome() {
  const { state, dispatch, derived } = useStore();
  const [sheet, setSheet] = useState(false);
  const sheetRef = useFocusTrap<HTMLDivElement>(sheet);
  const active = useActiveSection(['features', 'today', 'drill', 'checklist', 'shifts', 'notebook', 'mocks', 'group', 'progress', 'toolkit', 'settings']);
  const week = WEEKS[derived.currentWeek - 1];
  const log = state.days[todayKey()];
  const stem = log?.stem ?? 0;
  const di = dayIndex();
  const m = minutesOfDay();
  // The plan has no drill hour on Friday (reading buffer) or at all on the weekend —
  // the bar says so instead of tempting you to log something.
  const drillDay = di >= 1 && di <= 4;
  const rest = di === 0 || di === 6 || (di === 5 && m >= 360);
  const targetMet = stem >= week.drillTarget;
  const showQuickLog = active === 'today';

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheet(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      document.documentElement.style.overscrollBehavior = '';
    };
  }, [sheet]);

  const go = (id: string) => {
    setSheet(false);
    const el = document.getElementById(id);
    if (!el) return;
    // wait a frame so the sheet's scroll-lock is released before we jump
    requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 no-print md:hidden">
        {showQuickLog ? (
          <div className="pointer-events-auto mx-auto mb-2 w-[calc(100%-16px)] max-w-[520px]">
            <div
              className={cn(
                'flex items-center gap-2 rounded-2xl border px-3 py-2 shadow-panel backdrop-blur-xl',
                targetMet || rest ? 'border-mint/35 bg-mint/[0.12]' : 'border-glow-400/30 bg-ink-800/92',
              )}
            >
              <span className={cn('grid h-8 w-8 place-items-center rounded-xl', targetMet ? 'bg-mint/20 text-mint' : 'bg-white/[0.07] text-glow-200')}>
                <Icon name={rest ? 'coffee' : targetMet ? 'check' : 'target'} size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold leading-none text-white">
                  {rest ? 'Zero-drill window' : !drillDay ? 'Friday · reading buffer only' : targetMet ? 'Drill hour complete' : `Drill hour · week ${week.n}`}
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="num text-[11px] text-glow-200/70">
                    {stem}/{week.drillTarget}
                  </span>
                  <span className="h-1 w-14 overflow-hidden rounded-full bg-white/15">
                    <span
                      className="block h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (stem / week.drillTarget) * 100)}%`, background: targetMet ? '#34d399' : '#6f9bff' }}
                    />
                  </span>
                  <span className="truncate text-[11px] text-glow-200/45">{SUBJECTS[week.sides[0].subject].short}</span>
                </div>
              </div>
              {rest ? (
                <span className="shrink-0 text-[11px] text-mint/80">nothing to log ✓</span>
              ) : !drillDay ? (
                <span className="shrink-0 text-[11px] text-glow-200/55">finish leftovers, then stop</span>
              ) : targetMet ? null : (
                <>
                  <button
                    type="button"
                    className="tap grid h-10 place-items-center rounded-xl border border-glow-300/35 bg-glow-500/25 px-3 text-[13px] font-bold text-white active:scale-95"
                    onClick={() => {
                      dispatch({ type: 'bump', day: todayKey(), field: 'stem', delta: 5 });
                      haptic(9);
                    }}
                  >
                    +5
                  </button>
                  <button
                    type="button"
                    aria-label="Mark the drill hour target as met"
                    className="tap grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-white/[0.06] text-glow-100 active:scale-95"
                    onClick={() => {
                      dispatch({ type: 'bump', day: todayKey(), field: 'stem', delta: Math.max(0, week.drillTarget - stem) });
                      haptic(14);
                    }}
                  >
                    <Icon name="check" size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        ) : null}

        <nav
          aria-label="Primary"
          className="pointer-events-auto border-t border-white/[0.09] bg-ink-950/92 pb-safe backdrop-blur-xl"
          style={{ boxShadow: '0 -18px 40px -24px rgba(2,6,25,0.95)' }}
        >
          <div className="mx-auto flex max-w-[520px] items-stretch gap-0.5 px-1.5 py-1">
            {TABS.map((t) => {
              const on = active === t.id;
              const badge = t.id === 'checklist' ? Math.round(derived.completion * 100) : t.id === 'notebook' ? derived.openErrors : 0;
              return (
                <a
                  key={t.id}
                  href={`#${t.id}`}
                  aria-current={on ? 'page' : undefined}
                  className={cn(
                    'tap relative flex flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 transition',
                    on ? 'bg-white/[0.08] text-white' : 'text-glow-200/55',
                  )}
                >
                  {on ? <span className="absolute inset-x-5 -top-1 h-[2px] rounded-full bg-gradient-to-r from-transparent via-glow-200 to-transparent" /> : null}
                  <span className="relative">
                    <Icon name={t.icon} size={20} className={on ? 'text-glow-100' : ''} />
                    {t.id === 'notebook' && badge > 0 ? (
                      <span className="absolute -right-2 -top-1.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-rose px-1 text-[10px] font-bold text-ink-950">{badge}</span>
                    ) : null}
                  </span>
                  <span className="text-[11px] font-semibold leading-none">{t.label}</span>
                </a>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setSheet(true);
                haptic(5);
              }}
              aria-haspopup="dialog"
              aria-expanded={sheet}
              className={cn(
                'tap flex flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 transition',
                sheet ? 'bg-white/[0.08] text-white' : 'text-glow-200/55',
              )}
            >
              <Icon name="menu" size={20} />
              <span className="text-[11px] font-semibold leading-none">More</span>
            </button>
          </div>
        </nav>
      </div>

      {sheet ? (
        <div className="fixed inset-0 z-50 md:hidden no-print" role="dialog" aria-modal="true" aria-label="More sections">
          <button type="button" aria-label="Close menu" onClick={() => setSheet(false)} className="absolute inset-0 bg-ink-950/75 backdrop-blur-sm" />
          <div ref={sheetRef} className="absolute inset-x-0 bottom-0 rounded-t-[26px] border-t border-white/[0.12] bg-ink-850/96 p-4 pb-safe shadow-panel backdrop-blur-2xl" style={{ animation: 'rise 0.32s cubic-bezier(0.22,1,0.36,1) both' }}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />

            <div className="mb-3 grid grid-cols-3 gap-2">
              {[
                { l: 'Plan done', v: `${Math.round(derived.completion * 100)}%` },
                { l: 'Streak', v: `${derived.streak}d` },
                { l: 'Readiness', v: `${derived.readiness}%` },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-2 text-center">
                  <div className="num text-[16px] font-bold leading-none text-white">{s.v}</div>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.08em] text-glow-200/55">{s.l}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-1.5">
              {SHEET_LINKS.map((l) => (
                <button key={l.id} type="button" onClick={() => go(l.id)} className="tap flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-3 py-3 text-left active:scale-[0.99]">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-glow-300/25 bg-white/[0.05] text-glow-200">
                    <Icon name={l.icon} size={17} />
                  </span>
                  <span className="min-w-0 flex-1 text-[14px] font-medium text-glow-100">{l.label}</span>
                  <Icon name="arrow" size={15} className="text-glow-200/40" />
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  setSheet(false);
                  window.print();
                }}
                className="tap mt-1 flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-3 py-3 text-left active:scale-[0.99]"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-glow-300/25 bg-white/[0.05] text-glow-200">
                  <Icon name="printer" size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-medium text-glow-100">Print week {week.n} wall sheet</span>
                  <span className="block text-[11.5px] text-glow-200/45">{phaseOf(week.n).name} · {week.stage}</span>
                </span>
              </button>
            </div>

            <p className="muted mt-3 text-center text-[11.5px] text-glow-200/40">
              Tip: add SAGE to your home screen (Share → Add to Home Screen) for full-screen, offline use.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
