import { DAILY_HABITS, DAY_PLAN, WEEKS, phaseOf } from '../data/roadmap';
import { fmtShortDate } from '../lib/date';
import { useStore } from '../lib/store';
import { cn } from './cn';

/**
 * Print-only wall sheet for the current week: real checkbox squares you can tick with a pen,
 * the day map, and the two rules that keep the plan honest. Hidden on screen.
 */
export function WallSheet() {
  const { state, derived } = useStore();
  const week = WEEKS[derived.currentWeek - 1];
  const phase = phaseOf(week.n);
  const di = new Date().getDay();

  return (
    <div className="wall-sheet" aria-hidden="true">
      <div style={{ fontFamily: 'Inter Variable, system-ui, sans-serif', color: '#0b1024', padding: '4mm' }}>
        <div className="mb-3 flex items-end justify-between border-b border-black/25 pb-2">
          <div>
            <div className="font-display text-[19px] font-bold">
              {state.name ? `${state.name} — ` : ''}Week {week.n} of 24
            </div>
            <div style={{ fontSize: '11px' }}>
              {phase.name} · {week.stage} · printed {fmtShortDate(new Date())}
            </div>
          </div>
          <div className="text-right" style={{ fontSize: '11px', lineHeight: 1.35 }}>
            <div>
              Drill target {week.drillTarget}/morning · {week.weeklyQuestions} STEM + 40 clinic questions
            </div>
            <div>Lights out 8:30 PM · up 3:00 AM · weekend 100% free</div>
          </div>
        </div>

        <div style={{ fontSize: '11.5px', marginBottom: '6px', fontWeight: 700 }}>CONCEPT GOAL</div>
        <p style={{ fontSize: '12px', margin: '0 0 10px' }}>{week.concept}</p>

        <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {week.tasks.map((t) => (
            <li key={t.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '12px', marginBottom: '5px' }}>
              <span
                className={cn('inline-block shrink-0 border border-black/60', state.done[t.id] ? 'bg-black/75' : '')}
                style={{ width: '11px', height: '11px', marginTop: '2px' }}
              />
              <span>
                <b>{t.tag}:</b> {t.label}
              </span>
            </li>
          ))}
          {DAILY_HABITS.filter((h) => h.days.includes(di)).map((h) => (
            <li key={h.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '12px', marginBottom: '5px', opacity: 0.8 }}>
              <span className="inline-block shrink-0 border border-black/40" style={{ width: '11px', height: '11px', marginTop: '2px' }} />
              <span>
                <b>Habit:</b> {h.label}
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center" style={{ fontSize: '9px' }}>
          {DAY_PLAN.map((d, i) => {
            const side = i < 2 ? week.sides[0] : i < 4 ? week.sides[1] : null;
            return (
              <div key={d.day} className="border border-black/25 p-1">
                <div style={{ fontWeight: 700 }}>{d.short}</div>
                <div>{side ? side.subject.toUpperCase() : i === 4 ? 'BUFFER' : 'OFF'}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3" style={{ fontSize: '10.5px' }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: '4px' }}>RED-FLAG LINES (6:10–6:30 AM)</div>
            {[0, 1, 2, 3].map((n) => (
              <div key={n} style={{ borderBottom: '1px solid rgba(0,0,0,.35)', height: '17px' }} />
            ))}
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: '4px' }}>GOLDEN RULES</div>
            <ol style={{ margin: 0, paddingLeft: '14px' }}>
              <li>Never skip the 5:30 AM drill.</li>
              <li>Protect the 8:30 PM bedtime.</li>
              <li>Guilt-free weekends — all work ends Thursday 7:30 PM.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
