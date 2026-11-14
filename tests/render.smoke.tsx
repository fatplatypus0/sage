import { readFileSync, existsSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import App from '../src/App';
import { WEEKS, ALL_TASK_IDS, PHASES, SHIFTS, DAILY_HABITS, TOTAL_QUESTIONS, phaseOf } from '../src/data/roadmap';
import { isoDate, diffDays, parseISO, addDays, weekKey } from '../src/lib/date';
import { __test, emptyState } from '../src/lib/store';
import { buildIcs } from '../src/lib/ics';
import { cloudConfig, decodeJwt, decide, isCloudRow, sessionExpired, __test as __cloudTest } from '../src/lib/cloud';

const errs: string[] = [];
/** async assertions (stubbed fetch) register here; the summary waits for all of them */
const pending: Promise<unknown>[] = [];
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

/* ---------- the session runner: the plan's core ritual, reducer level ---------- */
{
  const { reducer } = __test;
  const today = isoDate(new Date());
  let st = emptyState();
  st = reducer(st, { type: 'startSession', week: 3, kind: 'drill', target: 15, perItemSecs: 90, subject: 'physics' });
  const sid = st.sessions[0].id;
  check(st.sessions.length === 1 && !st.sessions[0].endedAt, 'startSession did not open a session');
  check(!!st.sessions[0].subject, 'startSession dropped the subject (costliest board needs it)');
  st = reducer(st, { type: 'logItem', sessionId: sid, item: { topic: 'Projectile range', outcome: 'correct', secs: 61 } });
  st = reducer(st, { type: 'logItem', sessionId: sid, item: { topic: 'Inclined plane', outcome: 'wrong', reason: 'sign-error', secs: 90 } });
  st = reducer(st, { type: 'logItem', sessionId: sid, item: { topic: 'Inclined plane', outcome: 'wrong', reason: 'timed-out', secs: 95 } });
  check(st.sessions[0].items.length === 3, 'logItem lost an item');
  const before = st.entries.length;
  st = reducer(st, { type: 'endSession', sessionId: sid, autoLog: true, dayKey: today });
  const s0 = st.sessions[0];
  check(!!s0.endedAt, 'endSession did not close the session');
  check(s0.autoLogged === true, 'endSession lost the autoLog flag');
  check(st.entries.length === before + 2, `auto-filed misses: expected 2 new entries, got ${st.entries.length - before}`);
  check(st.entries.every((e) => e.topic === 'Inclined plane' && e.reason === 'sign-error' || !e.topic.startsWith('Projectile')), 'a correct answer was filed as a red flag');
  check(st.days[today]?.stem === 3, `session should bank 3 questions, got ${st.days[today]?.stem}`);
  const d = __test.derive(st);
  check(d.loggedItems === 3 && d.accuracy === 1 / 3, `accuracy math wrong: ${d.accuracy}`);
  check(d.costliest[0]?.count === 2 && d.costliest[0]?.topic === 'Inclined plane', 'costliest-topics board is not ranking session misses');
  check(d.openSession === null, 'a closed session must not stay open');
  // a second session that is discarded keeps the counters honest
  st = reducer(st, { type: 'startSession', week: 3, kind: 'clinic', target: 40, perItemSecs: 60 });
  const sid2 = st.sessions[0].id;
  st = reducer(st, { type: 'logItem', sessionId: sid2, item: { topic: 'Synonyms', outcome: 'wrong', secs: 40 } });
  const stemBefore = st.days[today].stem;
  st = reducer(st, { type: 'endSession', sessionId: sid2, autoLog: false, dayKey: today });
  check(st.days[today].stem === stemBefore, 'clinic session must not bump the drill-hour counter');
  check(st.entries.length === before + 2, 'autoLog=false still filed entries');
  st = reducer(st, { type: 'delSession', sessionId: sid2 });
  check(!st.sessions.some((x) => x.id === sid2), 'delSession left the session behind');
}

/* ---------- mocks, roster, overrides, reminders ---------- */
{
  const { reducer, sanitize } = __test;
  let st = emptyState();
  st = reducer(st, { type: 'addMock', mock: { week: 8, label: 'National mock 1', total: 100, correct: 54, blank: 12, mins: 90, subjects: { math: { q: 30, correct: 21 } } } });
  st = reducer(st, { type: 'addMock', mock: { week: 8, label: 'National mock 2', total: 100, correct: 61, blank: 6, mins: 88, subjects: {} } });
  check(st.mocks.length === 2, 'addMock did not persist');
  const d = __test.derive(st);
  check(d.mockCount === 2 && d.mockAvg === 0.575, `mock average wrong: ${d.mockAvg}`);
  check(Math.abs(d.mockDelta - 0.07) < 1e-9, `mock delta wrong: ${d.mockDelta}`);
  check(typeof d.readiness === 'number' && d.readiness >= 0 && d.readiness <= 100, 'readiness left the 0-100 band');
  {
    // a logged mock must move readiness, and volume must still matter
    const withMock = __test.derive({ ...emptyState(), done: Object.fromEntries(ALL_TASK_IDS.map((id) => [id, true])) as Record<string, boolean>, mocks: [{ id: 'm1', day: isoDate(new Date()), week: 24, label: 'x', total: 100, correct: 90, blank: 0, mins: 90, subjects: {} }] });
    check(withMock.mockScore === 1, `mock score should cap at 1 for 90%, got ${withMock.mockScore}`);
    check(withMock.readiness >= __test.derive({ ...emptyState(), done: Object.fromEntries(ALL_TASK_IDS.map((id) => [id, true])) as Record<string, boolean> }).readiness, 'a 90% mock must not lower readiness');
    check(withMock.readiness < 90, `readiness must still punish zero logged questions, got ${withMock.readiness}`);
    check(__test.derive(emptyState()).mockScore === null, 'readiness must not invent a mock component before the first sitting');
  }
  st = reducer(st, { type: 'addPeer', name: 'Abdi' });
  const pid = st.peers[0].id;
  st = reducer(st, { type: 'patchPeer', id: pid, patch: { stem: 60, taught: true, locked: true } });
  check(st.peers[0].stem === 60 && st.peers[0].taught && st.peers[0].locked, 'patchPeer lost a field');
  check(__test.derive(st).peersReady === 1, 'peersReady not counting verified members');
  st = reducer(st, { type: 'addPeer', name: '   ' });
  check(st.peers.length === 1, 'a blank name must not enter the roster');
  st = reducer(st, { type: 'setOverride', week: 5, patch: { swapped: true } });
  st = reducer(st, { type: 'setOverride', week: 5, patch: { swapped: false } });
  check(st.overrides['5'] === undefined, 'an empty override should be deleted, not stored');
  st = reducer(st, { type: 'setRetro', week: 5, text: '   ' });
  check(st.retro['5'] === undefined, 'blank retro should not be stored');
  st = reducer(st, { type: 'setReminder', field: 'wake', value: false });
  st = reducer(st, { type: 'markFired', key: 'wake' });
  check(st.reminders.wake === false && st.reminders.lastFired.wake === isoDate(new Date()), 'reminder flag/fire not recorded');
  const startBefore = st.programStart;
  st = reducer(st, { type: 'shiftStart', days: 7 });
  check(isoDate(addDays(parseISO(startBefore), 7)) === st.programStart, 'shiftStart did not move the plan a week');
  // v5 payloads (no sessions/mocks/peers) must survive the sanitizer untouched
  const legacy = { ...emptyState() } as Record<string, unknown>;
  for (const k of ['sessions', 'mocks', 'peers', 'overrides', 'retro', 'reminders', 'onboarded']) delete legacy[k];
  const fixed = sanitize(legacy as never);
  check(Array.isArray(fixed.sessions) && fixed.sessions.length === 0, 'legacy payload got no empty sessions array');
  check(Array.isArray(fixed.mocks) && fixed.peers.length === 0, 'legacy payload got no empty ledger');
  check(fixed.reminders.windDown === true && fixed.reminders.drill === false, 'reminder defaults wrong for a legacy payload');
  const junk = sanitize({ v: 6, sessions: [null, 3, { items: 'nope' }], mocks: [{ total: 'x' }], peers: { not: 'an array' }, days: 'garbage', done: null } as never);
  check(junk.sessions.length === 1 && Array.isArray(junk.sessions[0].items), 'sanitize left a corrupt session in place');
  check(junk.days && typeof junk.days === 'object' && junk.done && typeof junk.done === 'object', 'sanitize leaked a non-object day/done map');
  const afterReset = reducer(st, { type: 'reset' });
  check(afterReset.name === st.name && afterReset.programStart === st.programStart, 'reset destroyed the user\'s dates');
  check(afterReset.sessions.length === 0 && afterReset.mocks.length === 0 && afterReset.peers.length === 0, 'reset left the new collections behind');
}

/* ---------- .ics export: the schedule, as recurring events ---------- */
{
  const ics = buildIcs({ programStart: '2026-01-12', examDate: '2026-07-03', name: 'Hanna' });
  const lines = ics.split('\r\n');
  check(ics.startsWith('BEGIN:VCALENDAR'), 'ics must start with VCALENDAR');
  check(ics.trimEnd().endsWith('END:VCALENDAR'), 'ics must end with END:VCALENDAR');
  check(!/[^\r]\n/.test(ics), 'ics must be CRLF-terminated');
  check(Math.max(...lines.map((l) => l.length)) <= 75, 'ics lines must be folded to 75 octets');
  const events = lines.filter((l) => l === 'BEGIN:VEVENT').length;
  check(events >= 12 && events <= 40, `unexpected event count: ${events}`);
  check(new Set(lines.filter((l) => l.startsWith('UID:'))).size === events, 'every VEVENT needs a unique UID');
  check(!lines.some((l) => /DTSTART:(?!20\d{6}T\d{6}$)/.test(l)), 'DTSTART must be a floating local basic time');
  check(lines.some((l) => l.includes('BYDAY=SA')), 'Saturday set must appear when the plan starts on a Monday');
  const counts = lines.filter((l) => l.startsWith('RRULE:')).map((l) => Number(/COUNT=(\d+)/.exec(l)?.[1] ?? 0));
  check(counts.every((c) => c >= 1 && c <= 24), `RRULE COUNT out of range: ${counts.join(',')}`);
  const mondayDrill = lines.indexOf('SUMMARY:Locked drill hour · 15 questions');
  check(mondayDrill > 0 && lines[mondayDrill - 3] === 'DTSTART:20260112T053000', 'drill hour must start at 5:30 AM on its own event');
  // a four-day tail: one occurrence each, and no event that would land after the exam
  const tail = buildIcs({ programStart: '2026-06-30', examDate: '2026-07-03', name: '' });
  const tailLines = tail.split('\r\n');
  const tailCounts = tailLines.filter((l) => l.startsWith('RRULE:')).map((l) => Number(/COUNT=(\d+)/.exec(l)?.[1] ?? 0));
  check(tailCounts.length > 0 && tailCounts.every((c) => c === 1), `a 4-day tail should emit single occurrences, got ${tailCounts.join(',')}`);
  check(!tailLines.some((l) => l.includes('BYDAY=SA')), 'nothing may be scheduled past the exam date');
  check(tailLines[5] === 'X-WR-CALNAME:EUEE 24-week plan', 'empty name should not leave a dangling separator');
}

/* ---------- optional cloud sync: revision plumbing + conflict decision ---------- */
{
  const { syncedReducer, sanitize } = __test;
  check(cloudConfig() === null, 'tests must not run against a real Supabase project');
  check(decide({ rev: 0, updatedAt: 0 }, null) === 'push', 'a first-ever device should push');
  check(decide({ rev: 5, updatedAt: 10 }, { rev: 5, updated_at: 10 }) === 'noop', 'identical revisions must not ping-pong');
  check(decide({ rev: 5, updatedAt: 10 }, { rev: 5, updated_at: 11 }) === 'pull', 'a tie is broken by wall clock');
  check(decide({ rev: 4, updatedAt: 9999 }, { rev: 5, updated_at: 1 }) === 'pull', 'the higher revision always wins');
  check(decide({ rev: 6, updatedAt: 1 }, { rev: 5, updated_at: 9999 }) === 'push', 'a newer local device keeps its edits');
  check(decide({ rev: 0, updatedAt: 5 }, { rev: 1, updated_at: 1 }) === 'pull', 'remote rev 1 beats an untouched local 0');

  let st = emptyState();
  st = syncedReducer(st, { type: 'field', key: 'name', value: 'Hanna' });
  check(st.rev === 1 && st.updatedAt > 0, 'an edit must burn exactly one revision');
  st = syncedReducer(st, { type: 'toggleTask', id: 'w1-plan-read' });
  check(st.rev === 2, `revisions must be monotonic, got ${st.rev}`);
  const rejected = syncedReducer(st, { type: 'addPeer', name: '   ' });
  check(rejected === st, 'a rejected action must not burn a revision (it would fake a pending sync)');
  const pulled = syncedReducer(st, { type: 'hydrate', state: { ...st, rev: 42, updatedAt: 7 } });
  const corrupt = syncedReducer(st, {
    type: 'hydrate',
    state: { ...st, rev: 9, sessions: [null as never], mocks: 'nope' as never, done: { 'w1-plan-read': true, bogus: true } } as never,
  });
  check(Array.isArray(corrupt.sessions) && corrupt.sessions.length === 0, 'a corrupt pulled payload must be sanitized, not trusted');
  check(corrupt.mocks.length === 0 && corrupt.done.bogus === undefined, 'hydrate must drop unknown task ids');
  check(corrupt.rev === 9, 'a pull carries the remote revision without bumping it');
  check(pulled.rev === 42 && pulled.updatedAt === 7, 'hydrate must carry the remote revision verbatim');
  const roundTrip = sanitize(JSON.parse(JSON.stringify(pulled)));
  check(roundTrip.rev === 42 && roundTrip.updatedAt === 7, 'rev/updatedAt must survive persistence');
  check(sanitize({ ...emptyState(), rev: undefined, updatedAt: undefined } as never).rev === 0, 'a v5 payload must default to rev 0');
  check(sanitize({ rev: 'abc', updatedAt: 'x', done: {} } as never).updatedAt === 0, 'junk revisions must not poison sync');

  check(isCloudRow({ rev: 1, updated_at: 2, data: { v: 6 } }) === true, 'a valid row must be accepted');
  check(isCloudRow({ rev: '1', updated_at: 2, data: {} }) === false, 'a stringy rev must be rejected');
  check(isCloudRow(null) === false && isCloudRow([]) === false, 'non-objects must be rejected');

  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const tok = `${b64({ alg: 'none' })}.${b64({ sub: 'u-1', email: 'a@b.c', exp: Math.floor(Date.now() / 1000) + 600 })}.sig`;
  const claims = decodeJwt(tok);
  check(claims.sub === 'u-1' && claims.email === 'a@b.c', 'JWT claims are the only identity source — decode must work');
  check(sessionExpired({ access_token: tok, refresh_token: 'r', expires_at: 0 }) === false, 'a token with 10 min left is not expired');
  check(sessionExpired({ access_token: `${b64({ alg: 'none' })}.${b64({ sub: 'u', exp: 1000 })}.s`, refresh_token: 'r', expires_at: 0 }) === true, 'an expired token must trigger a refresh');
  check(decodeJwt('nonsense').sub === undefined, 'a malformed token must decode to nothing, not throw');

  // the HTTP contract, against a stub — this is the layer that fails silently on a real project
  {
    const seen: { url: string; init: any }[] = [];
    const realFetch = globalThis.fetch;
    (globalThis as any).fetch = async (url: string, init: any) => {
      seen.push({ url: String(url), init });
      return { ok: true, status: 200, text: async () => JSON.stringify({ access_token: 'a', refresh_token: 'r', expires_in: 3600, user: { email: 'x@y.z' } }) };
    };
    const cfg = { url: 'https://probe.supabase.co', anon: 'publishable-key' };
    const run = __cloudTest
      .request(cfg, '/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: '{}' })
      .then((r: any) => {
        const h = seen[0].init.headers;
        check(r.ok && r.json.access_token === 'a', 'stubbed auth response must parse');
        check(seen[0].url === 'https://probe.supabase.co/auth/v1/token?grant_type=refresh_token', 'auth endpoint path wrong');
        check(h.apikey === 'publishable-key', 'every request must carry the publishable key');
        check(!('Authorization' in h), 'anonymous calls must not send an Authorization header');
        return __cloudTest.request(cfg, '/rest/v1/sage_progress', { method: 'POST', auth: 'jwt', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: '{}' });
      })
      .then((r: any) => {
        const h = seen[1].init.headers;
        check(r.ok, 'a 200 must map to ok');
        check(h.Authorization === 'Bearer jwt', 'row writes must carry the owner JWT');
        check(String(h['Content-Type']).includes('application/json'), 'PostgREST needs a JSON content type');
        check(String(h.Prefer).includes('merge-duplicates') && String(h.Prefer).includes('representation'), 'upsert needs merge-duplicates + return=representation');
        check(typeof seen[1].init.body === 'string', 'bodies must be pre-serialized strings');
      })
      .finally(() => {
        (globalThis as any).fetch = realFetch;
      });
    pending.push(run);
  }
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
  'Drill hour', 'Mock ledger', 'Study group', 'Costliest-topics board', 'Thursday clinic verifier',
];
for (const m of must) check(html.includes(m), `missing copy: ${m}`);

// a11y + structure
const boxes = (html.match(/role="checkbox"/g) || []).length;
check(boxes > 150, `too few checkboxes rendered: ${boxes}`);
check(html.includes('aria-checked'), 'checkboxes lack aria-checked');
check(!/aria-label=""/.test(html), 'empty aria-label present');
check(html.includes('More sections') === false, 'mobile sheet should not be mounted when closed');
check(html.includes('Set up SAGE') === false, 'onboarding must not ambush the first paint');

// duplicate DOM ids (React useId regression guard for the SVG gradients)
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const dupes = ids.filter((v, i) => ids.indexOf(v) !== i);
check(dupes.length === 0, `duplicate DOM ids: ${[...new Set(dupes)].slice(0, 5).join(', ')}`);

// the new sections are mounted and addressable from the tab bar / nav
for (const id of ['today', 'drill', 'checklist', 'shifts', 'notebook', 'mocks', 'group', 'progress', 'toolkit', 'settings']) {
  check(html.includes(`id="${id}"`), `section #${id} missing from the page`);
}
check(html.includes('The 10 costliest'), 'costliest-topics board missing from the notebook');
check(html.includes('Start the hour') || html.includes('Session in progress'), 'drill runner did not render');
check(html.includes('No mock scores yet') || html.includes('Score curve'), 'mock ledger did not render');
check(html.includes('Clinic status'), 'group roster did not render');
check(html.includes('Cloud sync') && html.includes('local only'), 'settings must state the sync posture plainly');

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

const finish = () => {
  console.log(`weeks ${WEEKS.length} · tasks ${ALL_TASK_IDS.length} · boxes ${boxes} · ids ${ids.length} · html ${(html.length / 1024).toFixed(0)} kB`);
  console.log(errs.length ? 'FAILED:\n - ' + errs.join('\n - ') : 'ALL CHECKS PASSED');
  process.exit(errs.length ? 1 : 0);
};

// CJS output cannot top-level await, so async assertions are collected and flushed here
if (pending.length) void Promise.all(pending).catch(() => undefined).then(() => setTimeout(finish, 0));
else finish();
