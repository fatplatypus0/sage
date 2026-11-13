import { Starfield } from './Background';
import { Icon } from './ui';
import { useStore } from '../lib/store';
import { WEEKS } from '../data/roadmap';
import { fmtLongDate } from '../lib/date';

export function Footer() {
  const { state, derived } = useStore();
  return (
    <footer className="relative mt-8 overflow-hidden border-t border-white/[0.07]">
      <Starfield count={40} className="opacity-50" />
      <div className="shell relative py-12">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-[9px] bg-gradient-to-b from-white to-glow-300 text-ink-950">
                <Icon name="sparkle" size={15} />
              </span>
              <span className="font-display text-[15px] font-bold uppercase tracking-[0.14em] text-white">Sage</span>
            </div>
            <p className="muted mt-3 max-w-sm text-[13px]">
              Sleep Architecture for the Ethiopian University Entrance Examination — a build of the EUEE 6-Month Group Study Master
              Roadmap, V5.0 Pro. 24 weeks · Grades 9–11 core at 80% · sleep-protected Mon–Thu drills · 100% free weekends.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5 text-[11px] text-glow-200/50">
              <span className="pill !py-1">Week {derived.currentWeek} of 24</span>
              <span className="pill !py-1">{fmtLongDate(new Date())}</span>
              {state.name ? <span className="pill !py-1">{state.name}</span> : null}
            </div>
          </div>

          <div>
            <div className="label">The deck</div>
            <ul className="grid gap-1.5 text-[13px] text-glow-200/65">
              {[
                ['today', 'Command deck'],
                ['checklist', '24-week checklist'],
                ['shifts', 'Daily system'],
                ['notebook', 'Error notebook'],
                ['progress', 'Progress & readiness'],
                ['settings', 'Settings & backup'],
              ].map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`} className="transition hover:text-white">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="label">Non-negotiables</div>
            <ul className="grid gap-1.5 text-[13px] text-glow-200/65">
              <li className="flex items-center gap-2"><Icon name="moon" size={13} className="text-glow-300" /> Lights out 8:30 PM</li>
              <li className="flex items-center gap-2"><Icon name="alarm" size={13} className="text-glow-300" /> Up at 3:00 AM</li>
              <li className="flex items-center gap-2"><Icon name="target" size={13} className="text-glow-300" /> Never skip the drill hour</li>
              <li className="flex items-center gap-2"><Icon name="coffee" size={13} className="text-mint" /> Weekends stay free</li>
            </ul>
            <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
              <div className="text-[11px] uppercase tracking-[0.14em] text-glow-200/45">Current unit map</div>
              <div className="mt-1.5 space-y-1 text-[12px] text-glow-100/85">
                {WEEKS[derived.currentWeek - 1].sides.map((s) => (
                  <div key={s.label} className="truncate">
                    <span className="text-glow-200/50">{s.label.split('—')[0].trim()}</span> {s.short}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="hr-glow my-8" />

        <div className="flex flex-wrap items-center justify-between gap-3 text-[11.5px] text-glow-200/40">
          <span>Built for one study group, in one browser. No accounts, no servers, no tracking — your progress never leaves this device.</span>
          <span className="inline-flex items-center gap-2">
            <Icon name="star4" size={12} className="text-glow-300/60" />
            Roadmap V5.0 Pro · Confidential group copy
          </span>
        </div>
      </div>
    </footer>
  );
}
