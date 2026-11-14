# SAGE — EUEE 24-Week Master Command Center

**Sleep Architecture for the Ethiopian University Entrance Examination.**
SAGE is a web app built from `EUEE_6_Month_Master_Roadmap_V5_Pro.pdf`: the 24-week, sleep-protected,
weekend-free study playbook, turned into a living checklist instead of a document nobody reopens.

> 80% Grades 9–11 core · 20% Grade 12 revision · Thu SAT/English clinic ·
> zero Friday-afternoon or weekend drills · 6.5 h protected sleep.

---

## What is in the box

| Area | What it does |
| --- | --- |
| **Command deck (`#today`)** | Knows what time it is. Shows the live shift (concept block → locked drill hour → school → evening link → 8:30 PM gate → zero-drill weekend) with a countdown to the next boundary, plus today's counters and the week's checklist. |
| **24-week checklist (`#checklist`)** | Every roadmap week expanded into tickable tasks: two deep-read blocks, the 5:30 AM drill hour, red-flag logging, the Grade 12 evening link, the Thursday clinic, the sleep contract and the Friday buffer. Phase / subject filters, full-text search, per-week rings, a 24-week board view, and milestone gates (Week 8 audit, Week 14 diagnostic, Weeks 20–24 paper sets). |
| **Daily system (`#shifts`)** | The playbook's shift table as a weekly grid, the 80/20 curriculum split, and the three pillars (biological optimization, the Equalizer & split, zero Friday afternoons). |
| **Error notebook (`#notebook`)** | The Red-Flag protocol, digitised: *topic & year → why I missed it → the golden rule*. Cause taxonomy with fixes, a re-solve queue, 48-hour staleness flags, 28-day drill heatmap and CSV export. |
| **Drill runner (`#drill`)** | The locked 5:30–6:30 AM hour as a real session: ~90 s per question on a countdown ring, one tap per question (correct / missed+reason / skipped), undo, live count against the week’s target. Ending it writes the day’s counter **and** auto-files every miss into the notebook with its reason — replacing the 6:10 AM typing nobody keeps doing. |
| **Mock ledger (`#mocks`)** | Every 100-question national sitting: score, blanks, minutes, per-subject split. Keeps the score curve and the point-on-point delta, and feeds the readiness score — so the headline number is no longer purely a measure of how much you ticked. |
| **Study group (`#group`)** | The Thursday clinic made verifiable: roster of six, rotating venue, per-member questions hit + mini-lesson taught + venue locked. Under four verified it tells you to run the fallback pairs; the week’s retro, side swap and catch-up block are recorded beside it. |
| **Progress (`#progress`)** | Readiness score (50% checklist · 20% question volume vs. the pace the plan expects · 15% notebook hygiene + lights-out · 15% last mock score once one exists; falls back to 60/25/15 before the first sitting), questions-per-day chart, subject coverage, phase ledger, six-paper syllabus, exam countdown. |
| **Toolkit (`#toolkit`)** | Shift timer with the plan's own windows (150 m concept, 60 m drill hour, 20 m red-flag log, 75 m evening link, 80 m clinic), the Thursday-night sync agenda, and the non-negotiable golden rules. |
| **Setup (`#settings`)** | Week-1 start date, exam date, group size → everything else derives from those. Three boundary reminders (3:00 AM wake, 5:30 AM lock, 8:25 PM lights-out) using the Notification API where permission is granted and a full-screen nudge otherwise — acknowledging one ticks the habit for you. JSON export/import to move devices, a copied Thursday sync summary, a printable wall sheet, a 7-day plan shift for lost weeks, and a scoped reset. |

Progress persists in `localStorage` under `sage.euee.v5`. **No accounts, no backend, no tracking** — the
print sheet and the JSON backup are how you carry the plan between devices.

### Optional: cloud sync (opt-in, per device)

If a group wants the same plan on a phone and a dorm laptop, the app can mirror itself to a Supabase project —
*on top of* local storage, never instead of it. It is off by default and costs nothing to ignore: with no env vars
set, Settings says plainly “local only”, no request is ever made, and `Settings → Cloud sync` documents the switch.

To turn it on for a deployment:

1. Create a Supabase project, run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor (one row per user,
   row-level security so a user can only read/write their own row — there is no anonymous policy at all).
2. Copy the project URL and the *publishable* anon key into `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
   or into Vercel’s environment variables, then enable email/Google providers in Supabase → Auth.
3. In Settings → Cloud sync, sign in with a magic link or Google. Nothing uploads until a session exists in *that* browser.

Sync is deliberately boring: `rev` counts every data-changing action, a debounced push mirrors the state, and on a
conflict the higher revision wins wholesale while the losing device keeps a local snapshot (last three) it can
re-import. No merge algorithm, no server logic, no second source of truth. `useCloudSync` fails silently into
“queued / offline” states — a dead network never blocks a tick.

## Built for the phone in your hand at 5:30 AM

The plan is executed in bed, in a dorm room, on a phone — so the phone is the primary target, not an afterthought:

- **App-style tab bar** (Deck · Drill · Plan · Flags · Stats · More) with the active section tracked by scroll position, a red
  badge for open red flags, and safe-area padding for notched phones. `More` is a bottom sheet carrying the remaining
  sections, the print sheet and the live readiness numbers.
- **Floating drill logger** above the tab bar while you are on the deck: `+5` and a fill-to-target button, with a
  haptic tick, so the 5:30 AM hour can be logged with one thumb.
- **44px tap targets** on every counter, checkbox and chip; `touch-action: manipulation` kills the double-tap delay;
  16px inputs stop iOS from zoom-jumping on focus.
- **Swipe rails** for the day strip and the filter chips instead of cramped grids, with scroll snapping; the shift
  grid keeps a horizontal scroll plus an explicit hint.
- **Installable and offline**: manifest + generated icons (incl. maskable), `apple-touch-icon`, dark `theme-color`,
  `viewport-fit=cover`, and a service worker that registers only in production so `vite dev` stays honest. Open it
  once and the plan works on bad wifi.
- **Modal overlays are auditable**: every `aria-modal` layer (the More sheet, the alarm nudge, first-run setup) carries an
  Escape path, a `useFocusTrap` so Tab cannot walk into the page behind it, and — when bottom-anchored — the home-indicator
  safe area. The linter fails if any of the three disappears.
- `npm run lint:mobile` is a guardrail, not a wish: it fails the check when a sub-32px button, 9px copy, hover-only
  reveal, `100vh`, a stray bottom-fixed layer, a modal without Escape or focus trap, or a dangling anchor comes back.
  See `scripts/mobile-lint.mjs`.

## Stack

- [Vite](https://vitejs.dev) + React 18 + TypeScript (strict)
- Tailwind CSS 3 with a custom token set (`ink` void navy, `glow` periwinkle, subject accents)
- **Space Grotesk** (display) + **Inter Variable** (body), bundled locally via `@fontsource` — no runtime font requests
- Zero chart/UI dependencies: rings, bars, heatmaps and the bar chart are hand-rolled SVG/CSS

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run check        # typecheck + mobile lint + render smoke test
npm run build        # static bundle in dist/ (icons + manifest + sw included)
npm run preview      # serve the production bundle
npm run icons        # regenerate PWA icons from the mark in scripts/gen-icons.mjs
```

Deploy `dist/` to any static host (Netlify, GitHub Pages, Vercel, a school server). No env vars, no API.
`vercel.json` is committed (Vite preset, immutable `/assets`, `no-cache` for `sw.js` so an update reaches phones on the next
load), and `.github/workflows/ci.yml` runs `npm run check && npm run build` on every push to `main` and every pull request —
the same three gates the local `npm run check` enforces, so a phone-hostile pattern cannot reach a deploy.

If the 24 weeks start mid-plan, export **Settings → Export .ics calendar** instead of re-typing the grid: one recurring event
per shift and weekday (the morning core splits into the concept read and the locked drill hour), `COUNT` bounded by your exam
date, nothing scheduled past it.

## How the plan maps to code

`src/data/roadmap.ts` is the single source of truth — phases, the 11 weekly blocks, every Grade 9–11
unit string, drill targets, evening links, Thursday clinics, shift windows, protocols and golden rules all
come from the PDF. Individual weeks (and their ~8 tasks each, 194 in total) are **generated** from those
blocks, so editing a block updates the checklist, the deck, the counters and the stats at once.

```
src/
  data/roadmap.ts      the plan, as data (phases · blocks → 24 weeks · shifts · protocols · habits)
  lib/store.tsx        reducer + localStorage persistence (v6) + all derived metrics
  lib/date.ts          local-date helpers (day keys, week keys, shift math)
  lib/reminders.ts     the three boundary times, the notification contract, the firing window
  lib/print.ts         scoped "print the wall sheet only"
  lib/haptic.ts        optional vibration
  components/          nav, mobile chrome (tab bar + quick log), hero + live deck, alarm layer,
                       first-run setup, starfield/arc backdrop, wall sheet, UI atoms, icons
  views/               Today · Drill · Checklist · Shifts · Notebook · Mocks · Roster ·
                       Stats · Toolkit · Settings
scripts/               gen-icons.mjs · mobile-lint.mjs
tests/render.smoke.tsx SSR smoke test: plan data, ids, PWA wiring, a11y + reducer-level
                       coverage of the session runner, ledger, roster, overrides and sanitizer
```

`tests/render.smoke.tsx` renders the whole tree in Node and asserts the invariants that are
easy to break from a data edit: 24 weeks, unique week-namespaced task ids, phase spans,
15 → 20 question ramp, no duplicate DOM ids, every `href="#x"` reachable, and every manifest
icon present on disk. It also drives the reducer directly — open a session, log items, end it and assert the day
counter moved and the misses were filed; check mock deltas, readiness weighting, override cleanup and that a legacy
v5 payload survives `sanitize()` with the new collections defaulted.

## Design notes

The visual language follows the reference: a `#020619` void, a star field, one enormous glowing "planet
limb" arc whose crest sits just under the navigation, glass panels with a light-spilling top edge,
pill buttons (solid light primary / bordered dark secondary), tight Space Grotesk headings with a
periwinkle gradient accent, and a product shot that is live data rather than a mock-up.

Respect for the plan's own constraints drove a few calls: the weekend renders as *nothing scheduled*
instead of an empty-to-do list, the sleep contract is a first-class toggle pair rather than a footnote,
and the counters default to `+5` because logging 15 questions one tap at a time is how habits die.
