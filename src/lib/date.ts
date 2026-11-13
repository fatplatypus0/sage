/** Tiny local-date helpers. No timezone surprises: everything is keyed as 'YYYY-MM-DD'. */

export const pad = (n: number) => String(n).padStart(2, '0');

export const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayKey = () => isoDate(new Date());

export function parseISO(s: string): Date {
  const [y, m, d] = (s || '').split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  c.setHours(0, 0, 0, 0);
  return c;
}

export const diffDays = (a: Date, b: Date) =>
  Math.round((a.setHours(0, 0, 0, 0), b.setHours(0, 0, 0, 0), (b.getTime() - a.getTime()) / 86400000));

/** 0 = Sunday … 6 = Saturday */
export const dayIndex = (d = new Date()) => d.getDay();

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** ISO-ish week key (YYYY-Www) used for weekly grouping of the drill log */
export function weekKey(d: Date): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${pad(week)}`;
}

export const minutesOfDay = (d = new Date()) => d.getHours() * 60 + d.getMinutes();

export function fmtClock(mins: number): string {
  const m = ((mins % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const mm = m % 60;
  const ampm = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${pad(mm)} ${ampm}`;
}

export function fmtDuration(mins: number): string {
  const m = Math.max(0, Math.round(mins));
  const h = Math.floor(m / 60);
  return h ? `${h}h ${pad(m % 60)}m` : `${m}m`;
}

export function fmtCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export const fmtLongDate = (d: Date) =>
  d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export const fmtShortDate = (d: Date) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export function relativeDay(key: string): string {
  const delta = diffDays(parseISO(todayKey()), parseISO(key));
  if (delta === 0) return 'Today';
  if (delta === 1) return 'Tomorrow';
  if (delta === -1) return 'Yesterday';
  return fmtShortDate(parseISO(key));
}
