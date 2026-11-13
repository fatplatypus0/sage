/**
 * SAGE — source of truth for the EUEE 24-Week Master Study Playbook (V5.0 Pro).
 * Transcribed from `EUEE_6_Month_Master_Roadmap_V5_Pro.pdf`.
 *
 * Everything the UI renders (checklist, roadmap, shifts, notebook, stats) is derived
 * from this file so the plan and the product can never drift apart.
 */

export type SubjectKey = 'math' | 'physics' | 'chem' | 'bio' | 'sat' | 'english';

export type Subject = {
  key: SubjectKey;
  name: string;
  short: string;
  /** hex accent used for chips, rings and bars */
  color: string;
  /** tailwind-ish rgba glow */
  glow: string;
};

export const SUBJECTS: Record<SubjectKey, Subject> = {
  math: { key: 'math', name: 'Mathematics', short: 'Math', color: '#6f9bff', glow: 'rgba(111,155,255,0.28)' },
  physics: { key: 'physics', name: 'Physics', short: 'Physics', color: '#a78bfa', glow: 'rgba(167,139,250,0.28)' },
  chem: { key: 'chem', name: 'Chemistry', short: 'Chem', color: '#22d3ee', glow: 'rgba(34,211,238,0.26)' },
  bio: { key: 'bio', name: 'Biology', short: 'Biology', color: '#34d399', glow: 'rgba(52,211,153,0.26)' },
  sat: { key: 'sat', name: 'SAT Reasoning', short: 'SAT', color: '#fbbf24', glow: 'rgba(251,191,36,0.24)' },
  english: { key: 'english', name: 'English', short: 'English', color: '#f472b6', glow: 'rgba(244,114,182,0.24)' },
};

export const SUBJECT_ORDER: SubjectKey[] = ['math', 'physics', 'chem', 'bio', 'sat', 'english'];

export type PhaseKey = 'p1a' | 'p1b' | 'p2' | 'p3';

export type Phase = {
  key: PhaseKey;
  name: string;
  kicker: string;
  window: string;
  weeks: [number, number];
  headline: string;
  blurb: string;
  accent: string;
};

export const PHASES: Phase[] = [
  {
    key: 'p1a',
    name: 'Phase 1 · Part A',
    kicker: 'Foundations',
    window: 'Weeks 1 – 8',
    weeks: [1, 8],
    headline: 'Core Grades 9–11 STEM foundations',
    blurb:
      '80% of the morning engine runs on Grades 9, 10 & 11 textbook units that Grade 12 classes never re-teach. Every morning ends with the locked 15-question drill hour.',
    accent: '#6f9bff',
  },
  {
    key: 'p1b',
    name: 'Phase 1 · Part B',
    kicker: 'Completion',
    window: 'Weeks 9 – 14',
    weeks: [9, 14],
    headline: 'Finishing the high-yield Grade 11 units',
    blurb:
      'Trigonometry, organic chemistry, energy & momentum, genetics, conics and kinetics — the last heavyweight Gr 9–11 blocks, closed out with a comprehensive Phase 1 diagnostic.',
    accent: '#22d3ee',
  },
  {
    key: 'p2',
    name: 'Phase 2 · Mastery',
    kicker: 'Consolidation',
    window: 'Weeks 15 – 19',
    weeks: [15, 19],
    headline: 'Weak-spot consolidation & error eradication',
    blurb:
      'Re-solve every missed question from the Phase 1 Red-Flag notebook, fill the secondary Grade 9–11 gaps, and push the daily drill from 15 to 20 mixed past questions.',
    accent: '#a78bfa',
  },
  {
    key: 'p3',
    name: 'Phase 3 · Sprint',
    kicker: 'Exam stamina',
    window: 'Weeks 20 – 24',
    weeks: [20, 24],
    headline: '100% EUEE past-paper sprint & full simulation',
    blurb:
      'Zero new textbook reading. Strict timed full papers (2015 – 2023 E.C.), trap-distractor autopsies, bubble sheets and two 100-question mocks per week until exam day.',
    accent: '#fbbf24',
  },
];

export const phaseOf = (week: number): Phase =>
  PHASES.find((p) => week >= p.weeks[0] && week <= p.weeks[1]) ?? PHASES[0];

/* ------------------------------------------------------------------ *
 * Weekly blocks — each entry covers the week range printed in the PDF
 * ------------------------------------------------------------------ */

export type Side = { subject: SubjectKey; label: string; units: string; short: string };

export type Block = {
  id: string;
  from: number;
  to: number;
  stage: string;
  sides: [Side, Side];
  concept: string;
  drill: string;
  drillTarget: number;
  evening: string;
  thursday: string;
  milestone?: string;
  /** sprint weeks carry an explicit paper set instead of textbook reading */
  paperSet?: string;
  mode: 'foundation' | 'sprint' | 'mock';
  weeklyQuestions: number;
};

export const BLOCKS: Block[] = [
  {
    id: 'b1',
    from: 1,
    to: 2,
    stage: 'Launch',
    sides: [
      {
        subject: 'math',
        label: 'Mon / Tue — Math',
        units: 'Gr 9 Unit 2 (Solution Sets of Equations) & Gr 10 Unit 2 (Polynomial Functions)',
        short: 'Gr 9 U2 Solution Sets + Gr 10 U2 Polynomials',
      },
      {
        subject: 'chem',
        label: 'Wed / Thu — Chem',
        units: 'Gr 9 Unit 2 (Chemical Symbols & Formulas) & Gr 10 Unit 1 (Stoichiometry)',
        short: 'Gr 9 U2 Symbols/Formulas + Gr 10 U1 Stoichiometry',
      },
    ],
    concept: 'Remainder & Factor theorems, synthetic division, limiting reactants, percentage yield.',
    drill: '15 EUEE questions every morning (30 Math + 30 Chem per week) — log every error.',
    drillTarget: 15,
    evening: 'Link polynomials with Gr 12 Sequences & Series — 10 past questions per evening.',
    thursday: '20 SAT Quantitative + 20 English Grammar/Usage questions, timed.',
    weeklyQuestions: 60,
    mode: 'foundation',
  },
  {
    id: 'b2',
    from: 3,
    to: 4,
    stage: 'Core',
    sides: [
      {
        subject: 'physics',
        label: 'Mon / Tue — Physics',
        units: 'Gr 9 Unit 3 (Motion in 1D) & Gr 10 Unit 1 (Vector Quantities & Resolution)',
        short: 'Gr 9 U3 Motion in 1D + Gr 10 U1 Vectors',
      },
      {
        subject: 'bio',
        label: 'Wed / Thu — Biology',
        units: 'Gr 9 Unit 2 (Cell Biology) & Gr 10 Unit 1 (Biomolecules: Carbs, Lipids, Proteins)',
        short: 'Gr 9 U2 Cell Biology + Gr 10 U1 Biomolecules',
      },
    ],
    concept: 'Vector addition, relative-velocity graphs, osmosis/diffusion, enzyme kinetics.',
    drill: '15 EUEE questions daily on kinematics, vectors and cellular structures.',
    drillTarget: 15,
    evening: 'Link with Gr 12 Kinematics & Cell Physiology — 10–15 past questions per evening.',
    thursday: '20 SAT Analytical Reasoning + 20 English Vocabulary/Context + group check-in.',
    weeklyQuestions: 60,
    mode: 'foundation',
  },
  {
    id: 'b3',
    from: 5,
    to: 6,
    stage: 'Core',
    sides: [
      {
        subject: 'math',
        label: 'Mon / Tue — Math',
        units: 'Gr 10 Unit 3 (Exponential & Logarithmic Functions and Equations)',
        short: 'Gr 10 U3 Exponential & Logarithmic functions',
      },
      {
        subject: 'chem',
        label: 'Wed / Thu — Chem',
        units: 'Gr 10 Unit 2 & Gr 11 Unit 5 (Chemical Equilibrium, Le Chatelier’s Principle)',
        short: 'Gr 10 U2 + Gr 11 U5 Chemical equilibrium',
      },
    ],
    concept: 'Logarithm laws, mantissa/characteristic, Kc & Kp equilibrium shifts.',
    drill: '15 EUEE questions daily combining log equations with equilibrium calculations.',
    drillTarget: 15,
    evening: 'Link directly with Gr 12 Acid–Base equilibria, pH & buffers — 15 questions per evening.',
    thursday: 'English Reading Comprehension passages + SAT Sentence Completion.',
    weeklyQuestions: 60,
    mode: 'foundation',
  },
  {
    id: 'b4',
    from: 7,
    to: 8,
    stage: 'Midpoint',
    sides: [
      {
        subject: 'physics',
        label: 'Mon / Tue — Physics',
        units: 'Gr 11 Unit 3 (2D Projectile Motion, Circular Motion & Newton’s Laws)',
        short: 'Gr 11 U3 Projectile, circular motion & Newton’s laws',
      },
      {
        subject: 'bio',
        label: 'Wed / Thu — Biology',
        units: 'Gr 10 Unit 3 (Human Biology, Digestion, Breathing & Cellular Respiration)',
        short: 'Gr 10 U3 Human biology & cellular respiration',
      },
    ],
    concept: 'Inclined planes, pulley tension, projectile range/height, ATP — glycolysis & Krebs cycle.',
    drill: '15 EUEE questions daily on dynamics and human physiology.',
    drillTarget: 15,
    evening: 'Link with Gr 12 Rotational Dynamics & Nervous/Endocrine systems.',
    thursday: 'SAT Data Interpretation (graphs/tables) + 8-week Error Notebook group audit.',
    milestone: 'Midpoint checkpoint: re-solve every Week 1–7 Red-Flag entry before Monday.',
    weeklyQuestions: 60,
    mode: 'foundation',
  },
  {
    id: 'b5',
    from: 9,
    to: 10,
    stage: 'Upper',
    sides: [
      {
        subject: 'math',
        label: 'Mon / Tue — Math',
        units: 'Gr 10 Unit 5 & Gr 11 Unit 2 (Trigonometry & Rational Functions)',
        short: 'Gr 10 U5 + Gr 11 U2 Trigonometry & rational functions',
      },
      {
        subject: 'chem',
        label: 'Wed / Thu — Chem',
        units: 'Gr 10 Unit 1 & Gr 11 Unit 6 (Hydrocarbons & Organic Chemistry Basics)',
        short: 'Gr 10 U1 + Gr 11 U6 Hydrocarbons & organic basics',
      },
    ],
    concept: 'Trig identities, vertical & oblique asymptotes, IUPAC organic nomenclature.',
    drill: '15 trig and organic functional-group questions every morning.',
    drillTarget: 15,
    evening: 'Link with Gr 12 Aldehydes, Ketones, Esters & Polymers.',
    thursday: 'SAT Verbal Analogies/Antonyms + English Dialogue & Communicative questions.',
    weeklyQuestions: 60,
    mode: 'foundation',
  },
  {
    id: 'b6',
    from: 11,
    to: 12,
    stage: 'Upper',
    sides: [
      {
        subject: 'physics',
        label: 'Mon / Tue — Physics',
        units: 'Gr 11 Unit 4 (Work, Energy, Power, Collisions & Momentum)',
        short: 'Gr 11 U4 Work, energy, momentum & collisions',
      },
      {
        subject: 'bio',
        label: 'Wed / Thu — Biology',
        units: 'Gr 10 Unit 2 & Gr 11 Unit 4 (Heredity, Mitosis/Meiosis & Mendelian Genetics)',
        short: 'Gr 10 U2 + Gr 11 U4 Heredity & Mendelian genetics',
      },
    ],
    concept: 'Elastic vs inelastic collisions, work–energy theorem, Punnett-square pedigrees.',
    drill: '15 energy-conservation and genetics-probability questions daily.',
    drillTarget: 15,
    evening: 'Link with Gr 12 Molecular Genetics — DNA/RNA synthesis.',
    thursday: 'School mid-term prep buffer + blind formula-sheet recall (all 6 subjects).',
    weeklyQuestions: 60,
    mode: 'foundation',
  },
  {
    id: 'b7',
    from: 13,
    to: 14,
    stage: 'Finale',
    sides: [
      {
        subject: 'math',
        label: 'Mon / Tue — Math',
        units: 'Gr 10 Unit 4 & Gr 11 Unit 4/7 (Coordinate Geometry, Conics & Vectors)',
        short: 'Gr 10 U4 + Gr 11 U4/7 Conics & vectors',
      },
      {
        subject: 'chem',
        label: 'Wed / Thu — Chem',
        units: 'Gr 11 Unit 3 & 4 (Chemical Bonding, VSEPR, Thermodynamics & Kinetics)',
        short: 'Gr 11 U3/4 Bonding, VSEPR, thermo & kinetics',
      },
    ],
    concept: 'Circles, parabolas, ellipses, dot/cross products, enthalpy (ΔH) and rate laws.',
    drill: '15 conics, molecular-geometry and kinetics questions daily.',
    drillTarget: 15,
    evening: 'Phase 1 milestone: sit the comprehensive Gr 9–11 diagnostic quiz (Mon–Thu evenings).',
    thursday: 'Every member audits their full Phase 1 Error Notebook and ranks the 10 worst topics.',
    milestone: 'Phase 1 gate: diagnostic ≥ 70% on both Phase 1 halves before entering Phase 2.',
    weeklyQuestions: 60,
    mode: 'foundation',
  },
  {
    id: 'b8',
    from: 15,
    to: 17,
    stage: 'Math / Physics repair',
    sides: [
      {
        subject: 'math',
        label: 'Mon / Tue — Math consolidation',
        units: 'Matrices, Determinants, Complex Numbers, Statistics & Probability (Gr 9–11)',
        short: 'Matrices, determinants, complex numbers, stats & probability',
      },
      {
        subject: 'physics',
        label: 'Wed / Thu — Physics consolidation',
        units: 'Electrostatics, Capacitors, Current Electricity, Heat & Waves (Gr 9–11)',
        short: 'Electrostatics, capacitors, current electricity, heat & waves',
      },
    ],
    concept: 'Re-solve every missed Math/Physics question sitting in the Phase 1 Red-Flag notebook.',
    drill: 'Boost to 20 mixed Gr 9–11 past questions per morning.',
    drillTarget: 20,
    evening: 'School exam window + Gr 12 Calculus (limits, derivatives, integrals) & Electromagnetism.',
    thursday: 'Timed 45-question SAT Quantitative & Verbal challenge.',
    weeklyQuestions: 80,
    mode: 'foundation',
  },
  {
    id: 'b9',
    from: 18,
    to: 19,
    stage: 'Chem / Bio repair',
    sides: [
      {
        subject: 'chem',
        label: 'Mon / Tue — Chem consolidation',
        units: 'Quantum Atomic Models, Periodic Trends & States of Matter / Gas Laws (Gr 9–11)',
        short: 'Quantum atomic models, periodic trends, gas laws',
      },
      {
        subject: 'bio',
        label: 'Wed / Thu — Bio consolidation',
        units: 'Plant Biology, Microorganisms, Taxonomy, Ecology & Biomes (Gr 9–11)',
        short: 'Plant biology, microorganisms, taxonomy, ecology & biomes',
      },
    ],
    concept: 'Master all reaction mechanisms, gas-law formulas and hand-drawn biological diagrams.',
    drill: '20 mixed Chem/Bio past questions per morning.',
    drillTarget: 20,
    evening: 'Link with Gr 12 Electrochemistry (galvanic & electrolytic cells) and Evolution.',
    thursday: 'Full 60-question English EUEE section simulation, strictly timed.',
    weeklyQuestions: 80,
    mode: 'foundation',
  },
  {
    id: 'b10',
    from: 20,
    to: 22,
    stage: 'Past-paper sprint',
    sides: [
      {
        subject: 'math',
        label: 'Mon — full Mathematics papers',
        units: 'Official EUEE Mathematics past papers, timed under exam conditions',
        short: 'Full Mathematics EUEE papers',
      },
      {
        subject: 'physics',
        label: 'Tue — full Physics papers',
        units: 'Official EUEE Physics past papers, timed under exam conditions',
        short: 'Full Physics EUEE papers',
      },
    ],
    concept: 'Zero new textbook reading. Solve half paper #1 (40–50 Qs) in 90 minutes, then spend 90 minutes dissecting every wrong choice and trap distractor.',
    drill: 'Morning shift = half paper #1 under strict timing · evening shift = half paper #2 + rapid error review.',
    drillTarget: 45,
    evening: 'Wed — full Chemistry paper · Thu — full Biology paper, then group comparison of the week’s hardest questions.',
    thursday: 'Full timed SAT + English section, then Thursday Sprint Sync.',
    weeklyQuestions: 360,
    mode: 'sprint',
  },
  {
    id: 'b11',
    from: 23,
    to: 24,
    stage: 'Final polish',
    sides: [
      {
        subject: 'math',
        label: 'Mock block A — Mon / Tue',
        units: 'Full 100-question national mock (Math · Phys · Chem · Bio · English · SAT) on bubble sheets',
        short: 'Full 100-question mock, all 6 subjects, bubble sheets',
      },
      {
        subject: 'physics',
        label: 'Mock block B — Wed / Thu',
        units: 'Second full mock under real national exam conditions + strict time limits',
        short: 'Second full mock under real exam conditions',
      },
    ],
    concept: 'Simulate real national exam conditions across all 6 EUEE subjects with bubble sheets and strict time limits.',
    drill: 'Two full 100-question mocks per week; remaining morning hours for calm formula, diagram and definition recall.',
    drillTarget: 50,
    evening: 'No new material. Formula polishing, diagram redraws, definition recall — then close the books.',
    thursday: 'Final group readiness check: everyone confirms the 8:30 PM bedtime held all week.',
    milestone: 'Walk into the national exam rested, sharp and 100% prepared — zero late-night cramming.',
    weeklyQuestions: 200,
    mode: 'mock',
  },
];

/* ------------------------------------------------------------------ *
 * Expand blocks → 24 concrete weeks, each with its own checklist
 * ------------------------------------------------------------------ */

export type Task = {
  id: string;
  label: string;
  tag: string;
  subject?: SubjectKey;
};

export type Week = {
  n: number;
  blockId: string;
  phase: PhaseKey;
  stage: string;
  rangeLabel: string;
  label: string;
  sides: [Side, Side];
  concept: string;
  drill: string;
  drillTarget: number;
  evening: string;
  thursday: string;
  milestone?: string;
  mode: Block['mode'];
  weeklyQuestions: number;
  focus: string;
  tasks: Task[];
};

const SPRINT_PAPERS: Record<number, string> = {
  20: 'Paper set A — 2015 & 2016 E.C. (4 subjects)',
  21: 'Paper set B — 2017, 2018 & 2019 E.C. (4 subjects)',
  22: 'Paper set C — 2020, 2021, 2022 & 2023 E.C. (4 subjects)',
};

function tasksFor(block: Block, week: number): Task[] {
  const [a, b] = block.sides;
  const id = (s: string) => `w${week}-${s}`;

  if (block.mode === 'foundation') {
    const t: Task[] = [
      {
        id: id('read-a'),
        tag: a.label,
        subject: a.subject,
        label: `3:00–5:30 AM deep read: ${a.short}`,
      },
      {
        id: id('read-b'),
        tag: b.label,
        subject: b.subject,
        label: `3:00–5:30 AM deep read: ${b.short}`,
      },
      {
        id: id('drill'),
        tag: 'Locked drill hour',
        label: `5:30–6:30 AM · ${block.drillTarget} questions × 4 mornings = ${block.drillTarget * 4} solved`,
      },
      { id: id('errors'), tag: 'Red-flag log', label: '6:10–6:30 AM · every miss logged: topic & year · why · golden rule' },
      { id: id('evening'), tag: 'Evening Gr 12 link', label: block.evening },
      { id: id('thu'), tag: 'Thursday clinic', subject: 'sat', label: block.thursday },
      { id: id('sleep'), tag: 'Sleep contract', label: '4 × lights-out 8:30 PM · phone off, bag packed, 6.5 h protected' },
      { id: id('fri'), tag: 'Friday buffer', label: '3:00–6:00 AM leftover reading only if needed · zero drills Fri PM – Sun' },
    ];
    if (block.milestone) t.push({ id: id('milestone'), tag: 'Milestone', label: block.milestone });
    return t;
  }

  if (block.mode === 'sprint') {
    return [
      { id: id('p1'), tag: 'Morning shift', label: `${SPRINT_PAPERS[week] ?? 'Official EUEE papers'} — half paper #1 in 90 min` },
      { id: id('autopsy'), tag: 'Trap autopsy', label: '90 min analysing every wrong choice + trap distractor, in red ink' },
      { id: id('p2'), tag: 'Evening shift', label: 'Half paper #2 (40–50 Qs) + rapid error review, 5:30–7:30 PM' },
      { id: id('rotate'), tag: 'Rotation', label: 'Mon Math · Tue Physics · Wed Chemistry · Thu Biology — no deviations' },
      { id: id('errors'), tag: 'Red-flag log', label: 'Log each miss with the 3-line format; re-solve it 48 h later' },
      { id: id('thu'), tag: 'Thu sprint sync', subject: 'sat', label: block.thursday },
      { id: id('sleep'), tag: 'Sleep contract', label: '8:30 PM lights-out — stamina on exam day is built here, not at midnight' },
      { id: id('fri'), tag: 'Friday buffer', label: block.milestone ?? block.evening },
    ];
  }

  return [
    { id: id('mock1'), tag: 'Mock exam 1', label: 'Full 100-question mock, bubble sheet, strict national timing' },
    { id: id('mock2'), tag: 'Mock exam 2', label: 'Second full mock + same-day score breakdown by subject' },
    { id: id('recall'), tag: 'Calm recall', label: 'Formula sheet, diagram redraws and definition recall — no new material' },
    { id: id('autopsy'), tag: 'Trap autopsy', label: 'Re-solve every missed mock question; rank the 10 costliest topics' },
    { id: id('thu'), tag: 'Thu readiness', label: block.thursday },
    { id: id('sleep'), tag: 'Sleep contract', label: 'Protect 8:30 PM rigorously — zero late-night cramming from Week 23' },
    { id: id('fri'), tag: 'Friday buffer', label: block.milestone ?? block.evening },
  ];
}

export const WEEKS: Week[] = BLOCKS.flatMap((block) =>
  Array.from({ length: block.to - block.from + 1 }, (_, i) => {
    const n = block.from + i;
    const [a, b] = block.sides;
    return {
      n,
      blockId: block.id,
      phase: phaseOf(n).key,
      stage: block.stage,
      rangeLabel: `Weeks ${block.from} – ${block.to}`,
      label: `Week ${n}`,
      sides: block.sides,
      concept: block.concept,
      drill: block.drill,
      drillTarget: block.drillTarget,
      evening: block.evening,
      thursday: block.thursday,
      milestone: block.milestone,
      mode: block.mode,
      weeklyQuestions: block.weeklyQuestions,
      focus:
        block.mode === 'foundation'
          ? `${a.short} · ${b.short}`
          : block.mode === 'sprint'
            ? 'Full timed EUEE papers'
            : 'Full mock simulation & formula polish',
      tasks: tasksFor(block, n),
    } satisfies Week;
  }),
);

export const ALL_TASK_IDS: string[] = WEEKS.flatMap((w) => w.tasks.map((t) => t.id));
export const TASK_INDEX: Record<string, { week: number; task: Task }> = (() => {
  const map: Record<string, { week: number; task: Task }> = {};
  for (const w of WEEKS) for (const t of w.tasks) map[t.id] = { week: w.n, task: t };
  return map;
})();

/* ------------------------------------------------------------------ *
 * Daily shift architecture (Mon – Thu, plus the Friday buffer)
 * ------------------------------------------------------------------ */

export type Shift = {
  id: string;
  window: string;
  start: number; // minutes from 00:00
  end: number;
  name: string;
  days: string;
  focus: string;
  output: string;
  tone: 'core' | 'school' | 'evening' | 'rest' | 'sleep';
  /** minutes-from-midnight boundaries used for the live "you are here" marker */
  dayMask: number[]; // 0 = Sun … 6 = Sat
};

export const SHIFTS: Shift[] = [
  {
    id: 'morning',
    window: '3:00 – 6:30 AM',
    start: 180,
    end: 390,
    name: 'Morning Core Shift',
    days: 'Mon – Thu',
    focus: 'Grades 9, 10 & 11 core STEM units — 80% of all self-study effort. Two consecutive mornings per subject kills switching fatigue.',
    output:
      '3:00–5:30 AM concept block (slower readers deep-read the textbook, faster readers skim + reference books) · 5:30–6:30 AM locked drill hour: 15 topic-matched EUEE questions + error log.',
    tone: 'core',
    dayMask: [1, 2, 3, 4],
  },
  {
    id: 'school',
    window: 'Classroom hours',
    start: 480,
    end: 1020,
    name: 'School Hours',
    days: 'Mon – Fri',
    focus: 'Grade 12 primary instruction. Your teachers are the Grade 12 source — you never teach yourself Grade 12 from scratch at night.',
    output: 'Sit in the front / active zone and ask clarifying questions · finish routine school worksheets during free periods so the evening shift stays clear.',
    tone: 'school',
    dayMask: [1, 2, 3, 4, 5],
  },
  {
    id: 'evening',
    window: '5:30 – 7:30 PM',
    start: 1050,
    end: 1170,
    name: 'Early Evening Shift',
    days: 'Mon – Thu',
    focus: '20% effort: school homework + Grade 12 EUEE revision linked to the morning STEM topic. Thursday becomes the SAT & English clinic.',
    output:
      'Mon–Wed: 45 min homework/mid-terms + 75 min → 10–15 linked Grade 12 EUEE questions. Thursday: 20 SAT + 20 English past questions (80 min) + 40-min group peer check-in. Hard stop 7:30 PM.',
    tone: 'evening',
    dayMask: [1, 2, 3, 4],
  },
  {
    id: 'sleep',
    window: '8:30 PM lights-out',
    start: 1230,
    end: 1440,
    name: 'Protected Sleep Gate',
    days: 'Mon – Thu',
    focus: 'Phone off, bag packed, lights out at 8:30 PM for a 3:00 AM wake — 6.5 hours of REM-protected consolidation.',
    output: 'Studying past 8:30 PM is a net loss: it borrows tomorrow’s focus at 3:00 AM and destroys retention.',
    tone: 'sleep',
    dayMask: [1, 2, 3, 4],
  },
  {
    id: 'friday',
    window: '3:00 – 6:00 AM',
    start: 180,
    end: 360,
    name: 'Friday Reading Buffer',
    days: 'Friday only',
    focus: 'Slower readers finish any leftover Mon–Thu textbook reading before school. No new units, no drills.',
    output: 'Everything owed to the group is settled here, so Friday afternoon can stay 100% free.',
    tone: 'rest',
    dayMask: [5],
  },
  {
    id: 'weekend',
    window: 'Fri PM – Sun night',
    start: 720,
    end: 1440,
    name: 'Zero-Drill Window',
    days: 'Fri afternoon – Sun',
    focus: '100% protected rest: family, spiritual life, sleep-in, football, nothing academic.',
    output: 'All weekly question drills are finished by Thursday 7:30 PM. Guilt-free by design — the engine only works because this window is sacred.',
    tone: 'rest',
    dayMask: [0, 5, 6],
  },
];

export const DAY_PLAN: { day: string; short: string; subjectLine: string; note: string }[] = [
  { day: 'Monday', short: 'Mon', subjectLine: 'Subject 1 · Math / Physics', note: 'Opens the week: deep read + 15-question drill hour' },
  { day: 'Tuesday', short: 'Tue', subjectLine: 'Subject 1 · Math / Physics', note: 'Second consecutive morning on the same subject' },
  { day: 'Wednesday', short: 'Wed', subjectLine: 'Subject 2 · Chem / Biology', note: 'Switch pair; evening = Gr 12 link' },
  { day: 'Thursday', short: 'Thu', subjectLine: 'Subject 2 · Chem / Biology', note: 'Clinic night: 20 SAT + 20 English + group sync, 5:30–7:30 PM' },
  { day: 'Friday', short: 'Fri', subjectLine: 'Reading buffer only', note: '3:00–6:00 AM leftovers · after school = 100% free' },
  { day: 'Saturday', short: 'Sat', subjectLine: 'Off limits', note: 'No group drills, no assignments, no guilt' },
  { day: 'Sunday', short: 'Sun', subjectLine: 'Off limits', note: 'Rest, family, spiritual life, mental recharge' },
];

/* ------------------------------------------------------------------ *
 * Pillars, protocols & golden rules
 * ------------------------------------------------------------------ */

export const PILLARS = [
  {
    no: '01',
    tag: 'Pillar 1',
    title: 'Biological Optimization',
    lead: '6.5 hours of protected deep sleep',
    body: 'Evening study runs 5:30 – 7:30 PM with a strict lights-out at 8:30 PM. Waking at 3:00 AM fully rested is what gives you REM memory consolidation for complex STEM formulas — not an extra hour of bleary reading at midnight.',
    metric: '6.5 h',
    metricLabel: 'protected sleep / night',
  },
  {
    no: '02',
    tag: 'Pillar 2',
    title: 'The Equalizer & Split',
    lead: '2-day subject split + locked drill hour',
    body: 'Mon/Tue take Math or Physics; Wed/Thu take Chemistry or Biology. From 5:30 – 6:30 AM every member stops reading and solves 15 topic-matched EUEE questions, then logs each mistake in the Red-Flag notebook.',
    metric: '60',
    metricLabel: 'STEM questions / week',
  },
  {
    no: '03',
    tag: 'Pillar 3',
    title: 'Zero Friday Afternoons',
    lead: '100% free Friday afternoon & weekend',
    body: 'The SAT & English clinic lives on Thursday evening. Slower readers catch up Friday morning 3:00 – 6:00 AM. From Friday after school through Sunday night the plan asks for nothing — rest is part of the architecture, not a reward.',
    metric: '2.5',
    metricLabel: 'days off, guaranteed',
  },
];

export const ERROR_PROTOCOL = {
  title: 'The Red-Flag Error Notebook',
  lead: 'Solving 15 questions a day only works if you never repeat the same mistake twice. Every morning 6:10 – 6:30 AM, log each miss in exactly three lines.',
  lines: [
    { k: 'Topic & Year', v: 'e.g. Gr 11 Physics Projectile (2019 E.C.)' },
    { k: 'Why I Missed It', v: 'Formula gap · sign error · misread trap' },
    { k: 'The Golden Rule', v: 'The one-line rule or formula that solves it in 30 seconds next time' },
  ],
};

export const THURSDAY_SYNC = {
  title: 'Thursday Night Sync',
  window: '5:30 – 7:30 PM',
  lead: 'Because Friday afternoons and weekends are off-limits for drills, Thursday evening closes out the whole study week.',
  items: [
    { time: '5:30 – 6:50 PM', dur: '80 min', what: 'Timed 20 SAT + 20 English EUEE drill.' },
    { time: '6:50 – 7:15 PM', dur: '25 min', what: 'Each member teaches the shortcut to their 2 hardest STEM questions of the week.' },
    { time: '7:15 – 7:30 PM', dur: '15 min', what: 'Verify everyone hit 60 STEM questions, then lock next week’s units.' },
  ],
};

export const GOLDEN_RULES = [
  {
    title: 'Never skip the 5:30 AM drill',
    body: 'Even if a slower reader only finished 70% of the chapter, everyone stops reading at 5:30 AM and solves the 15 questions. Leftover pages move to the Friday 3:00–6:00 AM buffer.',
  },
  {
    title: 'Protect the 8:30 PM bedtime',
    body: 'Studying past 8:30 PM ruins your 3:00 AM focus and destroys memory retention. The bedtime is a hard system constraint, not a preference.',
  },
  {
    title: 'Guilt-free weekends',
    body: 'Because you execute relentlessly Mon–Thu, Friday afternoon through Sunday is 100% yours. No hidden worksheets, no "just one section".',
  },
];

export const CURRICULUM_SPLIT = [
  { label: 'Grades 9–11 core STEM', value: 80, note: 'Morning engine, 3:00 – 6:30 AM Mon–Thu', color: '#6f9bff' },
  { label: 'Grade 12 revision link', value: 20, note: 'Evening shift + classroom mastery, Mon–Thu PM', color: '#22d3ee' },
];

export const EXAM_SUBJECTS: { key: SubjectKey; papers: string }[] = [
  { key: 'math', papers: 'Full EUEE papers · Week 20–22 Mondays' },
  { key: 'physics', papers: 'Full EUEE papers · Week 20–22 Tuesdays' },
  { key: 'chem', papers: 'Full EUEE papers · Week 20–22 Wednesdays' },
  { key: 'bio', papers: 'Full EUEE papers · Week 20–22 Thursdays' },
  { key: 'english', papers: '60-question section sim · Week 18–19 + Thu clinic' },
  { key: 'sat', papers: '20 + 20 timed drill · every Thursday evening' },
];

/* Derived totals used by the copy and the stat tiles. */
export const TOTAL_QUESTIONS = BLOCKS.reduce((sum, b) => sum + b.weeklyQuestions * (b.to - b.from + 1), 0);
export const TOTAL_CLINIC_QUESTIONS = 24 * 40;
export const PROGRAM_DAYS = 24 * 7;
