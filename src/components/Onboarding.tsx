import { useEffect, useState } from 'react';
import { Card, Icon } from '../components/ui';
import { useFocusTrap } from '../lib/focus';
import { cn } from '../components/cn';
import { addDays, fmtLongDate, isoDate, parseISO } from '../lib/date';
import { useStore } from '../lib/store';

/**
 * Three questions, asked once. Without a start date and a real group size the whole app is
 * guessing at which shift you are in, so the first run has to be answered before the deck opens.
 */
const APP_HASH = /#(today|drill|checklist|shifts|notebook|mocks|group|progress|toolkit|settings)/;

export function Onboarding() {
  const { state, dispatch } = useStore();
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  /* Never ambush the marketing page: the setup asks for its three answers once the
     reader has actually reached the app — by scrolling past the hero or by jumping to a
     deck/checklist anchor. */
  const [show, setShow] = useState(false);
  const panelRef = useFocusTrap<HTMLDivElement>(show);
  useEffect(() => {
    if (show) return;
    const test = () => {
      if (dismissed) return;
      if (window.scrollY > 320 || APP_HASH.test(window.location.hash)) setShow(true);
    };
    test();
    window.addEventListener('scroll', test, { passive: true });
    window.addEventListener('hashchange', test);
    return () => {
      window.removeEventListener('scroll', test);
      window.removeEventListener('hashchange', test);
    };
  }, [show, dismissed]);

  useEffect(() => {
    if (!show) return;
    // Escape does not skip the setup (it would destroy the point) — it collapses the overlay
    // so the reader can look at the plan first; the deck links back here meanwhile.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShow(false);
        setDismissed(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show]);
  const [name, setName] = useState(state.name);
  const [start, setStart] = useState(state.programStart);
  const [group, setGroup] = useState(String(state.groupSize || 6));

  const finish = () => {
    if (name.trim()) dispatch({ type: 'field', key: 'name', value: name.trim().slice(0, 24) });
    dispatch({ type: 'field', key: 'programStart', value: start });
    dispatch({ type: 'field', key: 'groupSize', value: Math.max(1, Math.min(12, Number(group) || 6)) });
    if (state.examDate === isoDate(addDays(parseISO(state.programStart), 168))) {
      dispatch({ type: 'field', key: 'examDate', value: isoDate(addDays(parseISO(start), 168)) });
    }
    dispatch({ type: 'setOnboarded', value: true });
  };

  const exam = isoDate(addDays(parseISO(start), 168));

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-ink-950/92 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Set up SAGE">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-[50%] blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(120,165,255,0.4), transparent 72%)' }} aria-hidden="true" />
      <div ref={panelRef}>
      <Card glow className="relative w-full max-w-[520px] animate-rise">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors', i <= step ? 'bg-glow-200' : 'bg-white/12')} />
          ))}
        </div>

        {step === 0 ? (
          <>
            <span className="kicker mt-4">
              <Icon name="sparkle" size={12} className="text-glow-300" /> Welcome
            </span>
            <h2 className="mt-2 font-display text-[24px] font-semibold leading-tight text-white">
              This is the 24-week EUEE plan, made checkable.
            </h2>
            <p className="muted mt-2 text-[14px] leading-[1.6]">
              Everything here comes from your roadmap: the 3:00 AM wake, the locked 5:30–6:30 drill hour, the two-sided week, the
              Thursday clinic, the red-flag protocol. Three questions and it starts tracking you.
            </p>
            <label className="mt-4 block">
              <span className="label">Who is running this plan?</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your first name (optional)" className="field mt-1.5 w-full" maxLength={24} autoFocus />
            </label>
          </>
        ) : step === 1 ? (
          <>
            <span className="kicker mt-4">
              <Icon name="calendar" size={12} className="text-glow-300" /> Week 1
            </span>
            <h2 className="mt-2 font-display text-[24px] font-semibold leading-tight text-white">When does the plan start?</h2>
            <p className="muted mt-2 text-[14px] leading-[1.6]">
              The date the 3:00 AM alarm first goes off. Every shift, target and “where you should be by now” number hangs off this one
              field — a week already run counts, so set it honestly even if you are starting late.
            </p>
            <label className="mt-4 block">
              <span className="label">First Monday (or today, if you are mid-week)</span>
              <input type="date" value={start} min="2025-01-01" max="2027-12-31" onChange={(e) => setStart(e.target.value)} className="field mt-1.5 w-full" />
            </label>
            <p className="mt-2 text-[12.5px] text-glow-200/55">
              Week 24 then ends {fmtLongDate(parseISO(exam))} — that is used as the exam countdown. Change it in Settings if your sitting
              is a different date.
            </p>
          </>
        ) : (
          <>
            <span className="kicker mt-4">
              <Icon name="users" size={12} className="text-glow-300" /> The group
            </span>
            <h2 className="mt-2 font-display text-[24px] font-semibold leading-tight text-white">Who is doing Thursday with you?</h2>
            <p className="muted mt-2 text-[14px] leading-[1.6]">
              The plan is built for six people rotating between four venues, with you teaching one mini-lesson a fortnight. The number
              sets the group-verification bar; you can add names later in Study group.
            </p>
            <div className="mt-4 flex items-center gap-2">
              {[2, 4, 6, 8].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setGroup(String(n))}
                  className={cn(
                    'tap min-h-[44px] flex-1 rounded-xl border text-[14px] font-semibold transition',
                    group === String(n) ? 'border-glow-400/50 bg-glow-500/20 text-white' : 'border-white/10 bg-white/[0.04] text-glow-100/80',
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="mt-6 flex items-center justify-between gap-2">
          {step > 0 ? (
            <button type="button" className="btn-ghost !py-2.5 text-[13.5px]" onClick={() => setStep((s) => s - 1)}>
              <Icon name="chevron" size={15} className="rotate-90" /> Back
            </button>
          ) : (
            <button type="button" className="btn-ghost !py-2.5 text-[13.5px]" onClick={finish}>
              Skip setup
            </button>
          )}
          <button type="button" className="btn-light !py-2.5 text-[13.5px]" onClick={() => (step < 2 ? setStep(step + 1) : finish())}>
            {step < 2 ? 'Next' : 'Start week 1'}
            <Icon name="arrow" size={15} />
          </button>
        </div>
      </Card>
      </div>
    </div>
  );
}
