/**
 * Static guardrails for phone usability — fails `npm run check` when a change reintroduces
 * a touch-hostile pattern. Cheap by design: regex over source, no browser needed.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(process.cwd(), 'src');
const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const f = join(dir, e);
    if (statSync(f).isDirectory()) walk(f);
    else if (/\.(tsx|ts|css)$/.test(f)) files.push(f);
  }
})(root);

const problems = [];
const warn = (file, line, why) => problems.push(`${relative(process.cwd(), file)}:${line} — ${why}`);
const lineOf = (src, idx) => src.slice(0, idx).split('\n').length;
const openingTag = (src, from) => {
  const end = src.indexOf('>', from);
  return src.slice(from, end === -1 ? from + 700 : end + 1);
};

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');

  // 1) every tappable <button> must reach >= ~32px somewhere (className often lives on another line)
  for (const m of src.matchAll(/<button\b/g)) {
    const tag = openingTag(src, m.index);
    if (/pointer-events-none|sr-only/.test(tag)) continue;
    const heights = [...tag.matchAll(/(?:[\s'"`{])(?:[a-z]+:)?h-(\d+(?:\.\d+)?)/g)].map((h) => Number(h[1]));
    const pads = [...tag.matchAll(/py-(\d+(?:\.\d+)?)/g)].map((p) => Number(p[1]));
    const tallestPx = Math.max(0, ...heights.map((h) => h * 4), ...pads.map((p) => 16 + p * 4));
    if (heights.length && tallestPx < 32) warn(file, lineOf(src, m.index), 'tappable button under ~32px at its largest breakpoint');
  }

  // 2) inputs that would trigger the iOS focus-zoom, and other per-line smells
  lines.forEach((l, i) => {
    const n = i + 1;
    if (/text-\[(8|9)(\.5)?px\]/.test(l) && !/aria-hidden|opacity-0/.test(l)) warn(file, n, 'copy rendered at <=9.5px');
    if (/className=[^\n]*text-\[1[012](\.5)?px\][^\n]*(?:input|textarea)/.test(l)) warn(file, n, 'input below 13px risks iOS auto-zoom');
    if (/fixed/.test(l) && /bottom-0/.test(l) && /className/.test(l) && !/md:hidden|hidden md:/.test(l))
      warn(file, n, 'bottom-fixed layer without an md:hidden escape hatch — may collide with the phone tab bar');
    if (/group-hover:visible|hover:opacity-100/.test(l)) warn(file, n, 'hover-only reveal — needs a tap/focus path too');
    if (/\b100vh\b/.test(l)) warn(file, n, 'use dvh — 100vh overflows past the mobile URL bar');
    const wide = /\bw-\[(\d{4,})px\]/.exec(l);
    if (wide && Number(wide[1]) >= 1300 && !l.includes('max-w') && !/overflow-hidden/.test(src))
      warn(file, n, 'very wide fixed element without an overflow-hidden ancestor');
  });

  // 3) hover-driven interaction with no keyboard/tap equivalent
  if (/onMouseEnter/.test(src) && !/onFocus/.test(src)) warn(file, 1, 'onMouseEnter without a focus/tap equivalent');

  // 4) anchor jumps need an id, and ids must be unique enough to be targetable
  for (const m of src.matchAll(/href={`#([a-z-]+)`}/g)) {
    if (!new RegExp(`id=\\{?[a-z"]*"?${m[1]}`).test(src) && !src.includes(`id="${m[1]}"`) && !src.includes('id={`week-')) {
      warn(file, lineOf(src, m.index), `anchor #${m[1]} has no matching id in this file (ok if the id lives elsewhere)`);
    }
  }
}

if (problems.length) {
  console.error(`mobile-lint: ${problems.length} issue(s)\n - ` + problems.join('\n - '));
  process.exit(1);
}
console.log(`mobile-lint: clean across ${files.length} files`);
