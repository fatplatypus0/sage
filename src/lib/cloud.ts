/**
 * Optional cloud sync — written against Supabase's HTTP APIs directly (GoTrue + PostgREST) so
 * the app gains sync without adding a 60 kB SDK to a phone-first bundle.
 *
 * Non-negotiable design rules, in order:
 *  1. Local-first. localStorage stays the source of truth; the cloud is a mirror. Every failure
 *     path here degrades to "local only" and never blocks a render or a save.
 *  2. Opt-in per device. Nothing is sent unless VITE_SUPABASE_URL/_KEY are set AND a session
 *     exists in this browser. Signed-out users keep the exact previous behaviour.
 *  3. Last write wins, by revision counter. Two devices editing offline cannot merge a reducer,
 *     so the higher `rev` (tie-broken by `updatedAt`) wins wholesale and the loser keeps a local
 *     copy until it re-pushes. The loser's file is exported, never silently dropped.
 */
import { STORAGE_KEY, type State } from './store';

export type CloudRow = { user_id: string; rev: number; updated_at: number; data: State };
export type CloudPhase =
  | 'unconfigured'
  | 'signed-out'
  | 'ready'
  | 'syncing'
  | 'synced'
  | 'queued'
  | 'offline'
  | 'error';

export type CloudSession = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  email?: string;
  provider?: string;
};

const SESSION_KEY = 'sage.cloud.session';
const AUTO_KEY = 'sage.cloud.auto';

export function cloudConfig(): { url: string; anon: string } | null {
  // static property access so Vite inlines the values at build time; the SSR smoke test replaces
  // the whole `import.meta.env` object, where both are simply undefined
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
  const url = String(env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '');
  const anon = String(env.VITE_SUPABASE_ANON_KEY ?? '');
  if (!url || !anon || !/^https?:\/\//.test(url)) return null;
  return { url, anon };
}

export function readSession(): CloudSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as CloudSession;
    if (!s?.access_token || !s?.refresh_token) return null;
    return s;
  } catch {
    return null;
  }
}

export function writeSession(s: CloudSession | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (s) window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* private mode: sync stays unavailable, the plan keeps working */
  }
}

export function autoSyncEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(AUTO_KEY) === '1';
}

export function setAutoSync(on: boolean): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AUTO_KEY, on ? '1' : '0');
}

/** sub + email + expiry, straight from the JWT — no token introspection needed. */
export function decodeJwt(token: string): { sub?: string; email?: string; exp?: number } {
  try {
    const part = token.split('.')[1];
    if (!part) return {};
    const json = decodeURIComponent(
      atob(part.replace(/-/g, '+').replace(/_/g, '/'))
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export function userId(s: CloudSession | null): string | null {
  if (!s) return null;
  return decodeJwt(s.access_token).sub ?? null;
}

export function sessionExpired(s: CloudSession | null): boolean {
  if (!s) return true;
  const exp = decodeJwt(s.access_token).exp;
  if (!exp) return true;
  return exp * 1000 < Date.now() + 30_000;
}

async function request(
  cfg: { url: string; anon: string },
  path: string,
  init: RequestInit & { auth?: string } = {},
): Promise<{ ok: boolean; status: number; json: any; text: string }> {
  const { auth, ...rest } = init;
  const res = await fetch(cfg.url + path, {
    ...rest,
    headers: {
      apikey: cfg.anon,
      'Content-Type': 'application/json',
      ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      ...(rest.headers as Record<string, string>),
    },
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, json, text };
}

/** Store tokens handed back by a magic-link redirect and strip the fragment from the URL. */
export function consumeRedirect(): CloudSession | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash;
  if (!hash.includes('access_token')) return null;
  const p = new URLSearchParams(hash.replace(/^#/, ''));
  const access_token = p.get('access_token');
  const refresh_token = p.get('refresh_token');
  if (!access_token || !refresh_token) return null;
  const s: CloudSession = {
    access_token,
    refresh_token,
    expires_at: Date.now() + Number(p.get('expires_in') ?? 3600) * 1000,
    provider: p.get('provider') ?? undefined,
  };
  writeSession(s);
  // the token must not stay in history where a shared family tablet could re-open it
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  return s;
}

export async function refreshSession(cfg: { url: string; anon: string }, s: CloudSession): Promise<CloudSession | null> {
  const r = await request(cfg, '/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: s.refresh_token }),
  });
  if (!r.ok || !r.json?.access_token) return null;
  const next: CloudSession = {
    access_token: r.json.access_token,
    refresh_token: r.json.refresh_token ?? s.refresh_token,
    expires_at: Date.now() + Number(r.json.expires_in ?? 3600) * 1000,
    email: r.json.user?.email ?? s.email,
    provider: s.provider,
  };
  writeSession(next);
  return next;
}

async function validToken(cfg: { url: string; anon: string }): Promise<string | null> {
  let s = readSession();
  if (!s) return null;
  if (sessionExpired(s)) s = await refreshSession(cfg, s);
  return s?.access_token ?? null;
}

export async function signInWithEmail(email: string): Promise<{ ok: boolean; message: string }> {
  const cfg = cloudConfig();
  const clean = email.trim().toLowerCase();
  if (!cfg) return { ok: false, message: 'Cloud sync is not configured on this deployment.' };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) return { ok: false, message: 'That email address does not look right.' };
  const r = await request(cfg, '/auth/v1/otp', {
    method: 'POST',
    body: JSON.stringify({ email: clean, options: { email_redirect_to: `${window.location.origin}${window.location.pathname}` } }),
  });
  if (!r.ok) return { ok: false, message: r.json?.error_description ?? r.json?.msg ?? 'Supabase refused the request.' };
  return { ok: true, message: `Magic link sent to ${clean}. Open it on this device to start syncing.` };
}

export function signInWithGoogle(): { ok: boolean; message: string } {
  const cfg = cloudConfig();
  if (!cfg) return { ok: false, message: 'Cloud sync is not configured on this deployment.' };
  const url = new URL(cfg.url + '/auth/v1/authorize');
  url.searchParams.set('provider', 'google');
  url.searchParams.set('redirect_to', window.location.origin + window.location.pathname);
  window.location.assign(url.toString());
  return { ok: true, message: 'Opening Google…' };
}

export function signOut(): void {
  writeSession(null);
}

export type SyncDecision = 'push' | 'pull' | 'noop';

/** Pure so it can be tested without a network: which side of the wire wins. */
export function decide(local: Pick<State, 'rev' | 'updatedAt'>, remote: { rev: number; updated_at: number } | null): SyncDecision {
  if (!remote) return 'push';
  if (remote.rev > local.rev) return 'pull';
  if (remote.rev === local.rev) return remote.updated_at > local.updatedAt ? 'pull' : 'noop';
  return 'push';
}

/** Anything we push must survive sanitize() on the way back in — so validate before trusting it. */
export function isCloudRow(v: unknown): v is { rev: number; updated_at: number; data: State } {
  if (!v || typeof v !== 'object') return false;
  const r = v as Record<string, unknown>;
  return typeof r.rev === 'number' && typeof r.updated_at === 'number' && !!r.data && typeof r.data === 'object';
}

export async function pullRow(): Promise<{ row: CloudRow | null; error?: string }> {
  const cfg = cloudConfig();
  if (!cfg) return { row: null, error: 'unconfigured' };
  const token = await validToken(cfg);
  if (!token) return { row: null, error: 'signed-out' };
  const sub = userId(readSession());
  if (!sub) return { row: null, error: 'bad-token' };
  const r = await request(
    cfg,
    `/rest/v1/sage_progress?select=rev,updated_at,data,user_id&user_id=eq.${encodeURIComponent(sub)}&limit=1`,
    { auth: token, headers: { Accept: 'application/vnd.pgrst.object+json' } },
  );
  // 406/PGRST116 is PostgREST's "no rows" answer for a single-object request
  if (r.status === 406 || (!r.ok && r.json?.code === 'PGRST116')) return { row: null };
  if (!r.ok) return { row: null, error: r.json?.message ?? r.text.slice(0, 160) };
  const body = r.json;
  if (!isCloudRow(body)) return { row: null, error: 'unexpected shape' };
  return { row: { user_id: sub, rev: body.rev, updated_at: body.updated_at, data: body.data } };
}

export async function pushRow(state: State): Promise<{ ok: boolean; error?: string; rev?: number }> {
  const cfg = cloudConfig();
  if (!cfg) return { ok: false, error: 'unconfigured' };
  const token = await validToken(cfg);
  if (!token) return { ok: false, error: 'signed-out' };
  const sub = userId(readSession());
  if (!sub) return { ok: false, error: 'bad-token' };
  const r = await request(cfg, '/rest/v1/sage_progress', {
    method: 'POST',
    auth: token,
    headers: { Prefer: 'resolution=merge-duplicates,return=representation', 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: sub, rev: state.rev, updated_at: state.updatedAt, data: state }),
  });
  if (!r.ok) return { ok: false, error: r.json?.message ?? r.text.slice(0, 160) };
  return { ok: true, rev: state.rev };
}

/** Seam for the smoke test: proves the PostgREST/GoTrue contract (headers, verbs, error mapping)
 * without a live project. Nothing in the app should use it. */
export const __test = { request };

/** Snapshot the row we are about to overwrite, so a losing device can still recover its week. */
export function dumpLocalBackup(state: State): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${STORAGE_KEY}.pre-sync.${Date.now()}`, JSON.stringify(state));
    const keys = Object.keys(window.localStorage)
      .filter((k) => k.startsWith(`${STORAGE_KEY}.pre-sync.`))
      .sort();
    for (const k of keys.slice(0, Math.max(0, keys.length - 3))) window.localStorage.removeItem(k);
  } catch {
    /* quota: the sync still stands, only the rollback copy is lost */
  }
}

export function lastBackupKey(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return Object.keys(window.localStorage).filter((k) => k.startsWith(`${STORAGE_KEY}.pre-sync.`)).sort().pop() ?? null;
  } catch {
    return null;
  }
}
