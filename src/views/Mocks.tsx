import { useState } from 'react';
import type { ReactNode } from 'react';
import { SUBJECT_ORDER, SUBJECTS, type SubjectKey } from '../data/roadmap';
import { Card, EmptyState, Icon, Ring, Stat, Tag } from '../components/ui';
import { cn } from '../components/cn';
import { todayKey } from '../lib/date';
import { useStore } from '../lib/store';

const emptyForm = { total: '100', correct: '', blank: '', mins: '', note: '' };

/**
 * The measurement layer. The plan promises a score curve; manual counters can only produce a
 * question tally, so mocks get their own ledger — and Readiness on the deck reads the latest one.
 */
export function Mocks() {
  const { dispatch, derived } = useStore();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [form, setForm] = useState({ ...emptyForm });
  const [subs, setSubs] = useState<Partial<Record<SubjectKey, { q: string; correct: string }>>>({});

  const pct = (function () {
    const t = Number(form.total);
    const c = Number(form.correct);
    return t > 0 && Number.isFinite(c) ? Math.round((c / t) * 100) : null;
  })();

  const sorted = derived.mockSeries;

  const save = () => {
    const total = Math.max(1, Number(form.total) || 0);
    const correct = Math.max(0, Math.min(Number(form.correct) || 0, total));
    const subjects: Partial<Record<SubjectKey, { q: number; correct: number }>> = {};
    for (const k of SUBJECT_ORDER) {
      const v = subs[k];
      if (!v) continue;
      const q = Number(v.q) || 0;
      if (q <= 0) continue;
      subjects[k] = { q, correct: Math.max(0, Math.min(Number(v.correct) || 0, q)) };
    }
    dispatch({
      type: 'addMock',
      mock: {
        week: derived.currentWeek,
        label: label.trim() || (total >= 100 ? 'National mock (100 Q)' : `Timed set · ${total} Q`),
        total,
        correct,
        blank: Math.max(0, Math.min(Number(form.blank) || 0, total - correct)),
        mins: Math.max(0, Number(form.mins) || 0),
        subjects,
        note: form.note.trim() || undefined,
      },
    });
    setLabel('');
    setForm({ ...emptyForm });
    setSubs({});
    setOpen(false);
  };

  const curve = sorted.map((m) => Math.round((m.correct / Math.max(1, m.total)) * 100));
  const best = curve.length ? Math.max(...curve) : 0;
  const latest = sorted[sorted.length - 1];

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon="star4" value={derived.mockCount} label="Mocks logged" hint="2 · 6 · 8 across the phases" />
        <Stat icon="chart" value={derived.mockCount ? `${Math.round(derived.mockAvg * 100)}%` : '—'} label="Average score" hint={best ? `best ${best}%` : 'first one is a baseline'} />
        <Stat
          icon="bolt"
          value={derived.mockCount > 1 ? `${derived.mockDelta >= 0 ? '+' : ''}${Math.round(derived.mockDelta * 100)}` : '—'}
          label="Last delta (pts)"
          hint={derived.mockCount > 1 ? 'vs previous mock' : 'log two to see a trend'}
          color={derived.mockDelta >= 0 ? '#34d399' : '#f472b6'}
        />
        <Stat icon="target" value={derived.mockCount ? `${Math.round(derived.mockLatest * 100)}%` : '—'} label="Feeds readiness" hint="25% of the score" color="#a78bfa" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="muted max-w-xl text-[13px]">
          Scoring rule from the playbook: +1 per correct answer, no negative marking — so a blank is unfinished time, not a wrong answer.
          Log it as a blank.
        </p>
        <button type="button" className="btn-light !py-2.5 text-[13.5px]" onClick={() => setOpen((v) => !v)}>
          <Icon name={open ? 'x' : 'plus'} size={15} /> {open ? 'Close' : 'Log a mock'}
        </button>
      </div>

      {open ? (
        <Card glow>
          <span className="kicker">
            <Icon name="plus" size={12} className="text-glow-300" /> New score · {fmtToday()}
          </span>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Num label="Questions" value={form.total} onChange={(v) => setForm({ ...form, total: v })} />
            <Num label="Correct" value={form.correct} onChange={(v) => setForm({ ...form, correct: v })} placeholder="0" />
            <Num label="Blank" value={form.blank} onChange={(v) => setForm({ ...form, blank: v })} placeholder="0" />
            <Num label="Minutes used" value={form.mins} onChange={(v) => setForm({ ...form, mins: v })} placeholder="90" />
            <label className="block">
              <span className="label">Label</span>
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="National mock #4" className="field mt-1.5 w-full" maxLength={60} />
            </label>
          </div>

          <div className="mt-4">
            <span className="label">Per subject — optional</span>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {SUBJECT_ORDER.map((k) => {
                const v = subs[k];
                return (
                  <div key={k} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[12.5px] font-semibold" style={{ color: SUBJECTS[k].color }}>
                        {SUBJECTS[k].short}
                      </span>
                      <button
                        type="button"
                        className="tap inline-flex min-h-[36px] items-center px-2 text-[12px] text-glow-200/55 hover:text-white"
                        onClick={() =>
                          setSubs((prev) => {
                            const next = { ...prev };
                            if (next[k]) delete next[k];
                            else next[k] = { q: '', correct: '' };
                            return next;
                          })
                        }
                      >
                        {v ? 'remove' : 'add'}
                      </button>
                    </div>
                    {v ? (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <input
                          inputMode="numeric"
                          value={v.correct}
                          onChange={(e) => setSubs({ ...subs, [k]: { ...v, correct: e.target.value } })}
                          placeholder="correct"
                          className="field !min-h-[36px] !px-2 !py-1.5 !text-[13px] text-center"
                          aria-label={`${SUBJECTS[k].short} correct`}
                        />
                        <span className="text-[12px] text-glow-200/40">of</span>
                        <input
                          inputMode="numeric"
                          value={v.q}
                          onChange={(e) => setSubs({ ...subs, [k]: { ...v, q: e.target.value } })}
                          placeholder="total"
                          className="field !min-h-[36px] !px-2 !py-1.5 !text-[13px] text-center"
                          aria-label={`${SUBJECTS[k].short} questions`}
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <label className="block min-w-[220px] flex-1">
              <span className="label">What the score actually says</span>
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="ran out of time on the last 12 chem Qs" className="field mt-1.5 w-full" maxLength={140} />
            </label>
            {pct !== null ? (
              <Ring value={pct / 100} size={56} stroke={6} label={<span className="text-[13px]">{pct}%</span>} />
            ) : null}
            <button type="button" className="btn-light !py-2.5 text-[13.5px]" onClick={save}>
              <Icon name="check" size={15} /> Save score
            </button>
          </div>
        </Card>
      ) : null}

      {curve.length > 1 ? (
        <Card>
          <div className="flex items-center justify-between">
            <h4 className="font-display text-[15px] font-semibold text-white">Score curve</h4>
            <span className="text-[11.5px] text-glow-200/50">
              {curve[0]}% → {curve[curve.length - 1]}% over {curve.length} sittings
            </span>
          </div>
          <Curve values={curve} />
        </Card>
      ) : null}

      {sorted.length ? (
        <ul className="grid gap-3">
          {sorted
            .slice()
            .reverse()
            .map((m) => {
              const p = Math.round((m.correct / Math.max(1, m.total)) * 100);
              const tone = p >= 70 ? '#34d399' : p >= 50 ? '#fbbf24' : '#f472b6';
              return (
                <li key={m.id}>
                  <Card className="!p-4 sm:!p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[15.5px] font-semibold text-white">{m.label}</span>
                          <Tag color={tone}>{p}%</Tag>
                          {m.id === latest?.id ? <Tag color="#a78bfa">drives readiness</Tag> : null}
                        </div>
                        <div className="mt-1 text-[12.5px] text-glow-200/55">
                          week {m.week} · {m.day} · {m.correct}/{m.total} correct
                          {m.blank ? ` · ${m.blank} blank` : ''}
                          {m.mins ? ` · ${m.mins} min (${Math.round((m.mins / Math.max(1, m.total)) * 60)}s per question)` : ''}
                        </div>
                        {m.note ? <p className="mt-2 text-[13.5px] leading-[1.55] text-glow-100/80">“{m.note}”</p> : null}
                      </div>
                      <button
                        type="button"
                        className="btn-tiny !px-2.5 !py-2"
                        aria-label={`Delete ${m.label}`}
                        onClick={() => {
                          if (window.confirm('Delete this score from the ledger?')) dispatch({ type: 'delMock', id: m.id });
                        }}
                      >
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                    {SUBJECT_ORDER.filter((k) => m.subjects[k]).length ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {SUBJECT_ORDER.filter((k) => m.subjects[k]).map((k) => {
                          const v = m.subjects[k]!;
                          const sp = Math.round((v.correct / Math.max(1, v.q)) * 100);
                          return (
                            <div key={k} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2">
                              <div className="flex items-center justify-between text-[12.5px]">
                                <span style={{ color: SUBJECTS[k].color }}>{SUBJECTS[k].short}</span>
                                <span className="num font-semibold text-white">{sp}%</span>
                              </div>
                              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                                <i className="block h-full rounded-full" style={{ width: `${sp}%`, background: SUBJECTS[k].color }} />
                              </div>
                              <div className="mt-1 text-[11px] text-glow-200/45">
                                {v.correct}/{v.q}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </Card>
                </li>
              );
            })}
        </ul>
      ) : (
        <EmptyState
          icon="star4"
          title="No mock scores yet"
          body="Phase 1A closes with two 100-question national mocks, Phase 2 with six, Phase 3 with eight full papers. Log the number here and the Readiness ring on the deck starts moving with it."
          action={
            <button type="button" className="btn-light mt-1" onClick={() => setOpen(true)}>
              <Icon name="plus" size={15} /> Log your first
            </button>
          }
        />
      )}
    </div>
  );
}

function Curve({ values }: { values: number[] }) {
  const pts = values.map((v, i) => ({ x: (i / Math.max(1, values.length - 1)) * 300, y: 66 - (Math.max(0, Math.min(100, v)) / 100) * 58 }));
  const line = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L');
  return (
    <div className="mt-3">
      <svg viewBox="0 0 300 72" className="h-[86px] w-full" role="img" aria-label={`mock score trend ${values.join(' to ')} percent`}>
        <defs>
          <linearGradient id="mockfill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#9ec1ff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#9ec1ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`M0,72 L${line} L300,72 Z`} fill="url(#mockfill)" />
        <path d={`M${line}`} fill="none" stroke="#9ec1ff" strokeWidth="1.8" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="2.8" fill="#e8f0ff" />
            <text x={p.x} y={p.y - 7} textAnchor="middle" fontSize="9" fill="rgba(197,217,255,0.7)">
              {values[i]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function Num({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ''))} placeholder={placeholder} className={cn('field mt-1.5 w-full')} maxLength={4} />
    </label>
  );
}

function fmtToday(): ReactNode {
  return new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) || todayKey();
}
