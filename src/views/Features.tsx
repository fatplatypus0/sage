import { Card, Icon } from '../components/ui';
import { useStore } from '../lib/store';
import { TOTAL_CLINIC_QUESTIONS, TOTAL_QUESTIONS, WEEKS } from '../data/roadmap';

const FEATURES = [
  { icon: 'check', t: '24-week-perfect checklist', s: 'Every week of the roadmap expands into tickable tasks: two deep-read blocks, the locked drill hour, the Grade 12 evening link, the Thursday clinic and the sleep contract.', c: '#6f9bff' },
  { icon: 'target', t: '15 → 20 question counters', s: 'Tap +5 as you finish questions. The counter knows Phase 1 wants 15 a morning and Phase 2 wants 20, and tracks the 60-question weekly floor the Thursday sync verifies.', c: '#22d3ee' },
  { icon: 'moon', t: 'Sleep contract, enforced', s: '8:30 PM lights-out and 3:00 AM wake are logged as a pair. Six and a half protected hours per night is a plan requirement, not a vibe — the streak counter treats it like one.', c: '#9ec1ff' },
  { icon: 'flag', t: 'Red-flag error notebook', s: 'The plan’s 6:10–6:30 AM ritual, digitised: topic & year, why you missed it, and the one-line golden rule. Auto-flagged entries older than 48 hours become the Phase 2 re-solve queue.', c: '#f472b6' },
  { icon: 'bolt', t: 'Live shift awareness', s: 'Open the deck at 4:12 AM and it shows the concept block in progress with the countdown to 5:30 AM. On Saturday it shows exactly one thing: zero drills, guilt-free.', c: '#fbbf24' },
  { icon: 'chart', t: 'Readiness score', s: 'One number blending checklist completion, question volume against the pace the plan expects by now, notebook hygiene and nights held. Copied into the group thread in a click.', c: '#a78bfa' },
  { icon: 'calendar', t: 'Phase gates & milestones', s: 'The Week 8 midpoint audit, the Week 14 diagnostic gate, and the Weeks 20–24 past-paper sprint (2015–2023 E.C.) all arrive as their own checkable items — no drift.', c: '#34d399' },
  { icon: 'printer', t: 'Offline, printable, yours', s: 'Everything lives in this browser: JSON export/import to move devices, a copied sync summary for Thursday, and a wall sheet you can print and tick with a pen.', c: '#c5d9ff' },
];

export function Features() {
  const { derived } = useStore();
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {FEATURES.map((f) => (
        <Card key={f.t} className="group flex flex-col gap-2.5 !p-4 transition duration-500 hover:-translate-y-0.5 hover:border-white/16">
          <span className="grid h-9 w-9 place-items-center rounded-xl border" style={{ borderColor: `${f.c}33`, background: `${f.c}12`, color: f.c }}>
            <Icon name={f.icon} size={16} />
          </span>
          <h4 className="font-display text-[14.5px] font-semibold leading-tight text-white">{f.t}</h4>
          <p className="text-[12.5px] leading-snug text-glow-200/60">{f.s}</p>
        </Card>
      ))}

      <div className="sm:col-span-2 lg:col-span-4">
        <div className="grid gap-3 rounded-[20px] border border-white/[0.07] bg-gradient-to-r from-glow-500/[0.09] via-white/[0.03] to-transparent p-4 sm:grid-cols-4">
          {[
            { v: '24', l: 'weeks, Mon–Thu only', s: `${WEEKS.length} roadmap weeks · 168 days` },
            { v: TOTAL_QUESTIONS.toLocaleString(), l: 'STEM questions', s: `plus ${TOTAL_CLINIC_QUESTIONS.toLocaleString()} SAT / English clinic questions` },
            { v: `${derived.totalTasks}`, l: 'checkable tasks', s: 'auto-generated from the plan itself' },
            { v: '2.5', l: 'days off, guaranteed', s: 'Friday afternoon → Sunday night' },
          ].map((s) => (
            <div key={s.l} className="flex flex-col gap-0.5 border-l border-white/[0.09] pl-3.5 first:border-l-0 first:pl-0 sm:border-l-0 sm:pl-0">
              <span className="num text-[24px] font-bold leading-none text-white sm:text-[28px]">{s.v}</span>
              <span className="text-[11.5px] font-semibold uppercase tracking-[0.13em] text-glow-300/80">{s.l}</span>
              <span className="text-[11px] text-glow-200/45">{s.s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
