import { readFileSync, existsSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import App from '../src/App';
import { WEEKS, ALL_TASK_IDS, PHASES, SHIFTS, DAILY_HABITS, TOTAL_QUESTIONS, phaseOf } from '../src/data/roadmap';
import { isoDate, diffDays, parseISO, addDays, weekKey } from '../src/lib/date';

const errs: string[] = [];
const check = (cond: unknown, msg: string) => {
  if (!cond) errs.push(msg);
};

/* ---------- data integrity ---------- */
check(WEEKS.length === 24, `weeks=${WEEKS.length}`);
check(new Set(ALL_TASK_IDS).size === ALL_TASK_IDS.length, 'duplicate task ids');
check(ALL_TASK_IDS.length >= 180, `task count too low: ${ALL_TASK_IDS.length}`);
for (const w of WEEKS) {
  check(w.tasks.length >= 7, `week ${w.n}: ${w.tasks.length} tasks`);
  check(w.tasks.every((t) => t.label.length > 12), `week ${w.n}: a task label looks truncated`);
  check(!!phaseOf(w.n), `week ${w.n}: no phase`);
  check(w.drillTarget > 0 && w.weeklyQuestions > 0, `week ${w.n}: zero targets`);
  // every task id must be namespaced by its own week (no cross-week collisions)
  check(w.tasks.every((t) => t.id.startsWith(`w${w.n}-`)), `week ${w.n}: task id not namespaced`);
}
for (const p of PHASES) {
  const n = WEEKS.filter((w) => w.phase === p.key).length;
  check(n === p.weeks[1] - p.weeks[0] + 1, `${p.key}: ${n} weeks != span`);
}
check(SHIFTS.length === 6, 'shifts changed');
check(TOTAL_QUESTIONS === 2720, `total questions drifted: ${TOTAL_QUESTIONS}`);
// Phase 1 must ramp 15/day, Phase 2 20/day
check(WEEKS.slice(0, 14).every((w) => w.drillTarget === 15), 'phase 1 drill target not 15');
check(WEEKS.slice(14, 19).every((w) => w.drillTarget === 20), 'phase 2 drill target not 20');
check(DAILY_HABITS.every((h) => h.days.length > 0 && h.days.every((d) => d >= 0 && d <= 6)), 'habit day mask invalid');

/* ---------- date helpers ---------- */
{
  const a = new Date(2026, 10, 13, 22, 30);
  const b = new Date(2026, 10, 14, 1, 0);
  const before = a.toString();
  check(diffDays(a, b) === 1, 'diffDays should count calendar days, not clock hours');
  check(a.toString() === before, 'diffDays mutated its argument');
  check(isoDate(b) === '2026-11-14', 'isoDate is not local-time');
  check(isoDate(addDays(parseISO('2026-01-01'), 0)) === '2026-01-01', 'parseISO/addDays round-trip broken');
  check(/^\d{4}-W\d{2}$/.test(weekKey(b)), `weekKey malformed: ${weekKey(b)}`);
}

/* ---------- render the whole tree ---------- */
let html = '';
try {
  html = renderToString(<App />);
} catch (e) {
  console.error('RENDER FAILED:', e);
  process.exit(1);
}

const must = [
  'Own the EUEE With', '3 AM Precision', 'SAGE · Command Deck', '24-week checklist', 'Red-flag',
  'Thursday', 'Phase 1 · Part A', 'Phase 3 · Sprint', 'Protected Sleep Gate', 'Zero-Drill Window',
  'Shift timer', 'Le Chatelier', 'Krebs', 'bubble sheets', 'guilt-free', 'Habits ·', 'swipe',
];
for (const m of must) check(html.includes(m), `missing copy: ${m}`);

// a11y + structure
const boxes = (html.match(/role="checkbox"/g) || []).length;
check(boxes > 150, `too few checkboxes rendered: ${boxes}`);
check(html.includes('aria-checked'), 'checkboxes lack aria-checked');
check(!/aria-label=""/.test(html), 'empty aria-label present');
check(html.includes('role="dialog"') === false, 'mobile sheet should not be mounted when closed');

// duplicate DOM ids (React useId regression guard for the SVG gradients)
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const dupes = ids.filter((v, i) => ids.indexOf(v) !== i);
check(dupes.length === 0, `duplicate DOM ids: ${[...new Set(dupes)].slice(0, 5).join(', ')}`);

// mobile chrome must exist and be phone-scoped
check(/md:hidden/.test(html) && html.includes('aria-haspopup="dialog"'), 'mobile tab bar missing');
check(html.includes('wall-sheet'), 'print wall sheet missing from the shell');


/* ---------- PWA wiring: every referenced asset must actually exist ---------- */
{
  const head = readFileSync('index.html', 'utf8');
  check(/viewport-fit=cover/.test(head), 'viewport lacks viewport-fit=cover (safe-area insets will not work)');
  check(/name="theme-color"/.test(head), 'no theme-color meta — status bar will flash white on Android');
  check(/rel="manifest"/.test(head), 'no manifest link');
  check(/apple-touch-icon/.test(head), 'no apple-touch-icon (iOS home screen shows a screenshot)');
  // absolute paths are served from public/ in dev and copied to dist/ on build
  const assetExists = (src: string) => existsSync('./public' + src) || existsSync('./dist' + src);
  for (const m of head.matchAll(/href="(\/[^"]+\.(?:png|svg|webmanifest))"/g)) {
    check(assetExists(m[1]), `index.html references a missing public/ asset: ${m[1]}`);
  }
  const man = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));
  check(man.display === 'standalone', 'manifest is not standalone');
  check(!!man.theme_color && !!man.background_color, 'manifest missing theme/background color');
  for (const icon of man.icons) {
    check(assetExists(icon.src), `manifest icon missing: ${icon.src}`);
    check(!!icon.sizes && !!icon.type, `manifest icon missing sizes/type: ${icon.src}`);
  }
  check(man.icons.some((i: { purpose?: string }) => i.purpose === 'maskable'), 'no maskable icon (Android will crop the logo)');
  check(existsSync('public/sw.js'), 'service worker file missing');
  check(/import\.meta\.env\.PROD/.test(readFileSync('src/main.tsx', 'utf8')), 'SW must not register in dev (breaks HMR)');
}

// no raw markup leakage
check(!html.includes('undefined'), 'rendered "undefined" somewhere');
check(!html.includes('[object Object]'), 'rendered an object');

console.log(`weeks ${WEEKS.length} · tasks ${ALL_TASK_IDS.length} · boxes ${boxes} · ids ${ids.length} · html ${(html.length / 1024).toFixed(0)} kB`);
console.log(errs.length ? 'FAILED:\n - ' + errs.join('\n - ') : 'ALL CHECKS PASSED');
process.exit(errs.length ? 1 : 0);
