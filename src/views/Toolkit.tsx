import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Icon, Tag, Ring, Bar } from '../components/ui';
import { ERROR_PROTOCOL, GOLDEN_RULES, THURSDAY_SYNC } from '../data/roadmap';
import { useStore } from '../lib/store';
import { todayKey } from '../lib/date';
import { cn } from '../components/cn';

const PRESETS = [
  { id: 'concept', label: 'Concept block', mins: 150, note: '3:00 – 5:30 AM · deep read', color: '#6f9bff' },
  { id: 'drill', label: 'Locked drill hour', mins: 60, note: '5:30 – 6:30 AM · 15–20 questions', color: '#9ec1ff' },
  { id: 'log', label: 'Red-flag logging', mins: 20, note: '6:10 – 6:30 AM · three lines per miss', color: '#f472b6' },
  { id: 'evening', label: 'Evening link', mins: 75, note: '6:15 – 7:30 PM · Gr 12 past questions', color: '#22d3ee' },
  { id: 'clinic', label: 'Thu clinic', mins: 80, note: '5:30 – 6:50 PM · 20 SAT + 20 English', color: '#fbbf24' },
];

export function Toolkit() {
  const { state, derived } = useStore();

  return (
    <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
      <Card glow>
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="kicker">
              <Icon name="clock" size={12} className="text-glow-300" /> Shift timer
            </span>
            <h3 className="mt-2 font-display text-[20px] font-semibold text-white">Run the day on the clock, not on mood</h3>
          </div>
          <Tag color="#6f9bff">auto-saved locally</Tag>
        </div>
        <Timer />
        <p className="muted mt-3 text-[12px]">
          Presets mirror the roadmap’s own windows. When the drill-hour timer ends you should already be holding a pen over question 15 —
          the timer is a boundary, not a suggestion.
        </p>
      </Card>

      <div className="grid gap-4">
        <Card>
          <span className="kicker">
            <Icon name="flag" size={12} className="text-rose" /> {ERROR_PROTOCOL.title}
          </span>
          <p className="muted mt-2 text-[13px]">{ERROR_PROTOCOL.lead}</p>
          <div className="mt-3.5 space-y-2">
            {ERROR_PROTOCOL.lines.map((l, i) => (
              <div key={l.k} className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-lg border border-rose/30 bg-rose/10 text-[11px] font-semibold text-rose">{i + 1}</span>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold text-white">{l.k}</div>
                  <div className="mt-0.5 text-[11.5px] leading-snug text-glow-200/60">{l.v}</div>
                </div>
              </div>
            ))}
          </div>
          <a href="#notebook" className="btn-tiny mt-3.5">
            Open the notebook <Icon name="arrow" size={12} />
          </a>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-2.5">
              <div className="text-[10px] uppercase tracking-[0.14em] text-glow-200/45">Open flags</div>
              <div className="num mt-1 text-[18px] font-bold text-white">{derived.openErrors}</div>
              <Bar value={derived.entries ? derived.clearedErrors / derived.entries : 0} color="#34d399" className="mt-2" height={4} />
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-2.5">
              <div className="text-[10px] uppercase tracking-[0.14em] text-glow-200/45">Cleared</div>
              <div className="num mt-1 text-[18px] font-bold text-mint">{derived.clearedErrors}</div>
              <div className="mt-1.5 text-[10.5px] text-glow-200/45">re-solved once, then again 48 h later</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-2">
            <span className="kicker">
              <Icon name="users" size={12} className="text-violet" /> {THURSDAY_SYNC.title}
            </span>
            <Tag color="#a78bfa">{THURSDAY_SYNC.window}</Tag>
          </div>
          <p className="muted mt-2 text-[13px]">{THURSDAY_SYNC.lead}</p>
          <div className="mt-3.5 space-y-2.5">
            {THURSDAY_SYNC.items.map((it) => (
              <div key={it.time} className="relative flex items-start gap-3 overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                <span className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-violet/70 to-transparent" />
                <div className="w-[104px] shrink-0">
                  <div className="num text-[12px] font-semibold text-white">{it.time}</div>
                  <div className="text-[10.5px] uppercase tracking-[0.12em] text-violet/80">{it.dur}</div>
                </div>
                <p className="text-[12.5px] leading-snug text-glow-100/85">{it.what}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-[12px] text-glow-200/65">
            <Icon name="users" size={14} className="text-glow-300" />
            Group of {state.groupSize} · each member owes {derived.currentWeek ? 60 : 60} STEM questions before 7:15 PM verification.
          </div>
        </Card>
      </div>

      <Card className="lg:col-span-2">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="kicker">
              <Icon name="shield" size={12} className="text-mint" /> Non-negotiable golden rules
            </span>
            <h3 className="mt-2 font-display text-[20px] font-semibold text-white">Three rules that hold the architecture together</h3>
          </div>
          <a href="#settings" className="btn-tiny">
            <Icon name="printer" size={12} /> Print as a wall sheet
          </a>
        </div>
        <div className="mt-4 grid gap-2.5 md:grid-cols-3">
          {GOLDEN_RULES.map((r, i) => (
            <div key={r.title} className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 transition hover:border-mint/30 hover:bg-mint/[0.04]">
              <div className="flex items-center gap-2">
                <span className="num grid h-7 w-7 place-items-center rounded-lg border border-mint/30 bg-mint/10 text-[12px] font-semibold text-mint">{i + 1}</span>
                <h4 className="font-display text-[14px] font-semibold text-white">{r.title}</h4>
              </div>
              <p className="mt-2 text-[12.5px] leading-snug text-glow-200/70">{r.body}</p>
              <Icon name="shield" size={54} className="pointer-events-none absolute -bottom-3 -right-2 text-white/[0.035]" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The timer
 * ------------------------------------------------------------------ */

function Timer() {
  const { dispatch } = useStore();
  const [preset, setPreset] = useState(PRESETS[1]);
  const [remaining, setRemaining] = useState(PRESETS[1].mins * 60);
  const [running, setRunning] = useState(false);
  const tick = useRef<number | null>(null);
  const endAt = useRef<number>(0);

  useEffect(() => {
    if (!running) return;
    endAt.current = Date.now() + remaining * 1000;
    tick.current = window.setInterval(() => {
      const left = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        setRunning(false);
        if (tick.current) window.clearInterval(tick.current);
        beep();
      }
    }, 250);
    return () => {
      if (tick.current) window.clearInterval(tick.current);
    };
  }, [running]);

  const total = preset.mins * 60;
  const pct = useMemo(() => 1 - remaining / total, [remaining, total]);
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  const pick = (p: (typeof PRESETS)[number]) => {
    setPreset(p);
    setRunning(false);
    setRemaining(p.mins * 60);
  };

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-[190px_1fr] sm:items-center">
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <Ring value={pct} size={140} stroke={9} color={preset.color} label={<span className="num text-[27px] font-bold tracking-tight">{mm}:{ss}</span>} sub={running ? 'running' : remaining === 0 ? 'done' : 'paused'} />
          {remaining === 0 ? <span className="absolute inset-0 animate-ping rounded-full" style={{ boxShadow: `0 0 0 2px ${preset.color}55` }} /> : null}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setRunning((r) => !r)} className={cn('btn-tiny !px-3 !py-1.5', running && '!border-amber/45 !bg-amber/10 !text-amber')}>
            <Icon name={running ? 'pause' : 'play'} size={13} /> {running ? 'Pause' : 'Start'}
          </button>
          <button type="button" onClick={() => { setRunning(false); setRemaining(total); }} className="btn-tiny !px-2.5 !py-1.5">
            <Icon name="reset" size={13} /> Reset
          </button>
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: 'bump', day: todayKey(), field: 'stem', delta: 5 })}
          className="btn-tiny !border-glow-400/35 !bg-glow-500/10"
        >
          <Icon name="plus" size={12} /> Log 5 solved
        </button>
      </div>

      <div className="grid gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => pick(p)}
            className={cn(
              'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition',
              preset.id === p.id ? 'border-white/22 bg-white/[0.07]' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/16',
            )}
          >
            <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: p.color }} />
            <span className="min-w-0 flex-1">
              <span className="block text-[12.5px] font-semibold text-white">{p.label}</span>
              <span className="block truncate text-[11px] text-glow-200/50">{p.note}</span>
            </span>
            <span className="num shrink-0 text-[12px] text-glow-200/70">{p.mins}m</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function beep() {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 660;
    g.gain.value = 0.05;
    o.connect(g).connect(ctx.destination);
    o.start();
    o.frequency.setValueAtTime(880, ctx.currentTime + 0.18);
    window.setTimeout(() => {
      o.stop();
      ctx.close();
    }, 420);
  } catch {
    /* audio is a bonus, never a requirement */
  }
}
