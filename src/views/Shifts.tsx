import { Card, Icon, Tag } from '../components/ui';
import { DAY_PLAN, SHIFTS, CURRICULUM_SPLIT, PILLARS } from '../data/roadmap';
import { dayIndex } from '../lib/date';
import { useStore } from '../lib/store';
import { cn } from '../components/cn';

const toneColor: Record<string, { bg: string; fg: string; label: string }> = {
  core: { bg: 'rgba(111,155,255,0.16)', fg: '#9ec1ff', label: 'STEM engine' },
  school: { bg: 'rgba(34,211,238,0.14)', fg: '#67e3f7', label: 'Classroom' },
  evening: { bg: 'rgba(167,139,250,0.16)', fg: '#c4b0ff', label: 'Gr 12 + clinic' },
  sleep: { bg: 'rgba(158,193,255,0.12)', fg: '#cfe0ff', label: 'Recovery' },
  rest: { bg: 'rgba(52,211,153,0.14)', fg: '#7fe6bf', label: 'Protected off' },
};

const ROWS = [
  { id: 'morning', time: '3:00 AM', height: '3.5 h' },
  { id: 'drill', time: '5:30 AM', height: '60 min' },
  { id: 'school', time: '8:00 AM', height: 'school' },
  { id: 'evening', time: '5:30 PM', height: '2 h' },
  { id: 'sleep', time: '8:30 PM', height: '6.5 h' },
];

const GRID: Record<string, Record<number, string>> = {
  // week -> which rows are active (0=Sun … 6=Sat)
  morning: { 1: 'core', 2: 'core', 3: 'core', 4: 'core', 5: 'rest' },
  drill: { 1: 'core', 2: 'core', 3: 'core', 4: 'core' },
  school: { 1: 'school', 2: 'school', 3: 'school', 4: 'school', 5: 'school' },
  evening: { 1: 'evening', 2: 'evening', 3: 'evening', 4: 'evening' },
  sleep: { 0: 'sleep', 1: 'sleep', 2: 'sleep', 3: 'sleep', 4: 'sleep' },
};

export function Shifts() {
  const today = dayIndex();
  const { derived } = useStore();
  const week = derived.currentWeek;

  return (
    <div className="grid gap-4">
      <Card glow>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-display text-[20px] font-semibold text-white">The weekly architecture</h3>
            <p className="muted mt-1 max-w-2xl text-[13.5px]">
              Four pre-dawn STEM blocks, one locked question hour, one evening link to Grade 12 — then the books close. Column
              {today === 0 || today === 6 ? ' highlighted' : ` “${DAY_PLAN[today - 1 < 0 ? 0 : today - 1].short}” is today`} for week {week}.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(toneColor).map(([k, v]) => (
              <span key={k} className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] px-2 py-1 text-[10.5px]" style={{ background: v.bg, color: v.fg }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: v.fg }} />
                {v.label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-[11px] text-glow-200/45 sm:hidden">
          <Icon name="arrow" size={13} />
          swipe the grid sideways to see Friday – Sunday
        </div>
        <div className="mt-3 overflow-x-auto scrollbar-none sm:mt-5">
          <div className="min-w-[680px]">
            <div className="grid grid-cols-[92px_repeat(7,1fr)] gap-1.5">
              <div />
              {DAY_PLAN.map((d, i) => (
                <div key={d.day} className={cn('rounded-lg px-2 py-1.5 text-center', i + 1 === today ? 'bg-white/[0.1]' : 'bg-white/[0.03]')}>
                  <div className={cn('font-display text-[12.5px] font-semibold', i + 1 === today ? 'text-white' : 'text-glow-200/70')}>{d.short}</div>
                  <div className="text-[10.5px] uppercase tracking-[0.08em] text-glow-200/50">{i + 1 <= 4 ? 'engine' : i + 1 === 5 ? 'buffer' : 'off'}</div>
                </div>
              ))}

              {ROWS.map((r) => (
                <div key={r.id} className="contents">
                  <div className="flex flex-col justify-center py-1">
                    <span className="num text-[11.5px] font-semibold text-glow-100">{r.time}</span>
                    <span className="text-[10px] text-glow-200/45">{r.height}</span>
                  </div>
                  {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                    const tone = GRID[r.id]?.[d];
                    const isToday = d === today;
                    return (
                      <div
                        key={d}
                        className={cn(
                          'relative h-11 overflow-hidden rounded-lg border transition',
                          tone ? 'border-transparent' : 'border-dashed border-white/[0.07] bg-white/[0.015]',
                          isToday && 'ring-1 ring-white/25',
                        )}
                        style={tone ? { background: toneColor[tone].bg } : undefined}
                      >
                        {tone ? (
                          <span className="absolute inset-x-2 top-1.5 block truncate text-[10px] font-semibold" style={{ color: toneColor[tone].fg }}>
                            {r.id === 'morning' && d === 5 ? 'reading catch-up' : toneColor[tone].label.toLowerCase()}
                          </span>
                        ) : (
                          <span className="absolute inset-0 grid place-items-center text-[10px] text-glow-200/30">{d === 0 || d === 6 ? 'free' : '—'}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {CURRICULUM_SPLIT.map((c) => (
            <div key={c.label} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
              <span className="relative grid h-11 w-11 place-items-center rounded-full" style={{ background: `conic-gradient(${c.color} ${c.value * 3.6}deg, rgba(255,255,255,0.06) 0)` }}>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-ink-900 text-[11px] font-semibold" style={{ color: c.color }}>
                  {c.value}%
                </span>
              </span>
              <div>
                <div className="text-[13px] font-semibold text-glow-100">{c.label}</div>
                <div className="text-[11px] text-glow-200/50">{c.note}</div>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3 rounded-xl border border-mint/25 bg-mint/[0.06] p-3">
            <Icon name="coffee" size={20} className="text-mint" />
            <div>
              <div className="text-[13px] font-semibold text-white">Fri PM – Sun: nothing scheduled</div>
              <div className="text-[11px] text-mint/70">All drills finish Thursday 7:30 PM — guaranteed.</div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {SHIFTS.map((s) => {
          const tone = toneColor[s.tone];
          return (
            <Card key={s.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl border" style={{ borderColor: `${tone.fg}33`, background: tone.bg, color: tone.fg }}>
                    <Icon name={s.tone === 'core' ? 'bolt' : s.tone === 'school' ? 'book' : s.tone === 'evening' ? 'target' : s.tone === 'sleep' ? 'moon' : 'coffee'} size={16} />
                  </span>
                  <div>
                    <div className="font-display text-[14.5px] font-semibold leading-tight text-white">{s.name}</div>
                    <div className="num text-[11px] text-glow-200/55">{s.window}</div>
                  </div>
                </div>
                <Tag color={tone.fg}>{s.days}</Tag>
              </div>
              <p className="text-[12.5px] leading-snug text-glow-100/80">{s.focus}</p>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-2.5">
                <div className="label !mb-1">Output & habits</div>
                <p className="text-[11.5px] leading-snug text-glow-200/65">{s.output}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {PILLARS.map((p) => (
          <Card key={p.no} className="overflow-hidden">
            <div className="absolute -right-6 -top-8 font-display text-[92px] font-bold leading-none text-white/[0.035]">{p.no}</div>
            <div className="relative">
              <span className="kicker">{p.tag}</span>
              <h4 className="mt-2 font-display text-[18px] font-semibold text-white">{p.title}</h4>
              <div className="mt-1 text-[12.5px] font-medium text-glow-300/85">{p.lead}</div>
              <p className="muted mt-2.5 text-[13px]">{p.body}</p>
              <div className="mt-4 flex items-end justify-between border-t border-white/[0.07] pt-3">
                <div>
                  <div className="num text-[24px] font-bold leading-none text-white">{p.metric}</div>
                  <div className="mt-1 text-[10.5px] uppercase tracking-[0.14em] text-glow-200/45">{p.metricLabel}</div>
                </div>
                <Icon name={p.no === '01' ? 'moon' : p.no === '02' ? 'target' : 'coffee'} size={22} className="text-glow-300/50" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
