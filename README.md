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
| **Progress (`#progress`)** | Readiness score (60% checklist · 25% question volume vs. the pace the plan expects by now · 15% notebook hygiene + lights-out discipline), questions-per-day chart, subject coverage, phase ledger, six-paper syllabus, exam countdown. |
| **Toolkit (`#toolkit`)** | Shift timer with the plan's own windows (150 m concept, 60 m drill hour, 20 m red-flag log, 75 m evening link, 80 m clinic), the Thursday-night sync agenda, and the non-negotiable golden rules. |
| **Setup (`#settings`)** | Week-1 start date, exam date, group size → everything else derives from those. JSON export/import to move devices, a copied Thursday sync summary, a printable wall sheet, and a scoped reset. |

Progress persists in `localStorage` under `sage.euee.v5`. **No accounts, no backend, no tracking** — the
print sheet and the JSON backup are how you carry the plan between devices.

## Stack

- [Vite](https://vitejs.dev) + React 18 + TypeScript (strict)
- Tailwind CSS 3 with a custom token set (`ink` void navy, `glow` periwinkle, subject accents)
- **Space Grotesk** (display) + **Inter Variable** (body), bundled locally via `@fontsource` — no runtime font requests
- Zero chart/UI dependencies: rings, bars, heatmaps and the bar chart are hand-rolled SVG/CSS

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # tsc --noEmit
npm run build      # static bundle in dist/
npm run preview    # serve the production bundle
```

Deploy `dist/` to any static host (Netlify, GitHub Pages, Vercel, a school server). No env vars, no API.

## How the plan maps to code

`src/data/roadmap.ts` is the single source of truth — phases, the 11 weekly blocks, every Grade 9–11
unit string, drill targets, evening links, Thursday clinics, shift windows, protocols and golden rules all
come from the PDF. Individual weeks (and their ~8 tasks each, 194 in total) are **generated** from those
blocks, so editing a block updates the checklist, the deck, the counters and the stats at once.

```
src/
  data/roadmap.ts      the plan, as data (phases · blocks → 24 weeks · shifts · protocols)
  lib/store.tsx        reducer + localStorage persistence + all derived metrics
  lib/date.ts          local-date helpers (day keys, week keys, shift math)
  components/          nav, hero + live deck, starfield/arc backdrop, UI atoms, icons
  views/               Today · Checklist · Shifts · Notebook · Stats · Toolkit · Settings
```

## Design notes

The visual language follows the reference: a `#020619` void, a star field, one enormous glowing "planet
limb" arc whose crest sits just under the navigation, glass panels with a light-spilling top edge,
pill buttons (solid light primary / bordered dark secondary), tight Space Grotesk headings with a
periwinkle gradient accent, and a product shot that is live data rather than a mock-up.

Respect for the plan's own constraints drove a few calls: the weekend renders as *nothing scheduled*
instead of an empty-to-do list, the sleep contract is a first-class toggle pair rather than a footnote,
and the counters default to `+5` because logging 15 questions one tap at a time is how habits die.
