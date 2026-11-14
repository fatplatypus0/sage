/**
 * The plan as a calendar the student's own phone can hold.
 *
 * The app's reminders are a courtesy the browser can lose; a recurring weekly event survives
 * a dead service worker, a closed tab and a phone restart. The file is generated from
 * `SHIFTS` — never a parallel copy of the schedule — with one recurring VEVENT per (shift,
 * weekday) so 24 weeks cost a dozen small records instead of hundreds.
 */
import { SHIFTS } from '../data/roadmap';
import { addDays, diffDays, pad, parseISO } from './date';
import type { Shift } from '../data/roadmap';

const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

/** The plan's own minute grid, read from the shift table rather than hardcoded. */
type Piece = { key: string; title: string; note: string; start: number; end: number; tone: Shift['tone'] };

function piecesOf(s: Shift): Piece[] {
  if (s.tone === 'core') {
    // The morning shift is two commitments: the slow concept read, then the locked hour.
    const drillStart = Math.max(s.start, s.end - 60);
    return [
      { key: 'concept', title: `${s.name.replace(' Shift', '')} — concept read`, note: 'Stop reading at 5:30 even if the chapter is 70% done. Leftovers belong to Friday, not tonight.', start: s.start, end: drillStart, tone: s.tone },
      { key: 'drill', title: 'Locked drill hour · 15 questions', note: 'No reading. 15 topic-matched EUEE questions, then the red-flag log (6:10–6:30 AM).', start: drillStart, end: s.end, tone: s.tone },
    ];
  }
  return [{ key: s.id, title: s.name, note: s.output || s.focus, start: s.start, end: s.end, tone: s.tone }];
}

const stamp = (d: Date, mins: number) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(Math.floor(mins / 60))}${pad(mins % 60)}00`;

const esc = (t: string) => t.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');

/** RFC 5545 wants lines folded at 75 octets; a space marks the continuation. */
function fold(line: string): string {
  if (line.length <= 74) return line;
  const out: string[] = [];
  let rest = line;
  out.push(rest.slice(0, 74));
  rest = rest.slice(74);
  while (rest.length > 73) {
    out.push(' ' + rest.slice(0, 73));
    rest = rest.slice(73);
  }
  if (rest) out.push(' ' + rest);
  return out.join('\r\n');
}

export function buildIcs(opts: { programStart: string; examDate: string; name?: string }): string {
  const start = parseISO(opts.programStart);
  const exam = parseISO(opts.examDate);
  const spanDays = Math.max(7, diffDays(start, exam) + 1);
  const weeks = Math.max(1, Math.min(24, Math.round(spanDays / 7)));
  const uid = `sage-${opts.programStart}`;
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SAGE//EUEE 24-Week Master Roadmap//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:EUEE 24-week plan' + (opts.name ? ` · ${opts.name}` : ''),
    'X-WR-CALDESC:SAGE — the roadmap’s own shift grid as recurring events. Weekend blocks are intentionally absent.',
  ];

  for (const s of SHIFTS) {
    if (s.tone === 'sleep') continue; // the wake-up is already the concept block
    for (const day of s.dayMask) {
      // first date on/after the plan start that falls on this weekday
      const offset = (day - start.getDay() + 7) % 7;
      const first = addDays(start, offset);
      if (first > exam) continue;
      const count = Math.max(1, Math.min(weeks, Math.round(diffDays(first, exam) / 7) + 1));
      for (const p of piecesOf(s)) {
        lines.push(
          'BEGIN:VEVENT',
          `UID:${uid}-${s.id}-${day}-${p.key}@sage.euee`,
          `DTSTAMP:${stamp(first, 0)}`,
          `DTSTART:${stamp(first, p.start)}`,
          `DTEND:${stamp(first, p.end)}`,
          `RRULE:FREQ=WEEKLY;BYDAY=${BYDAY[day]};COUNT=${count}`,
          `SUMMARY:${esc(p.title)}`,
          `DESCRIPTION:${esc(p.note)}`,
          'TRANSP:TRANSPARENT',
          'END:VEVENT',
        );
      }
    }
  }

  lines.push('END:VCALENDAR');
  // CRLF is required by RFC 5545, and every line gets folded to 75 octets so strict importers
  // (Outlook, older Android calendar providers) do not reject the file.
  return lines.map(fold).join('\r\n') + '\r\n';
}

export function downloadIcs(opts: { programStart: string; examDate: string; name?: string }) {
  const blob = new Blob([buildIcs(opts)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sage-euee-plan-${opts.programStart}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
