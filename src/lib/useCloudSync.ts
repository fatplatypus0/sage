import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  autoSyncEnabled,
  cloudConfig,
  consumeRedirect,
  decide,
  dumpLocalBackup,
  pullRow,
  pushRow,
  readSession,
  setAutoSync,
  signInWithEmail,
  signInWithGoogle,
  signOut as clearSession,
  userId,
  type CloudPhase,
} from './cloud';
import type { Dispatch } from 'react';
import type { Action, State } from './store';

/**
 * Glue between the local reducer and the optional cloud mirror. The hook owns all the failure
 * handling so the UI can stay honest: `phase` says exactly why nothing moved.
 */
export type CloudSync = {
  configured: boolean;
  signedIn: boolean;
  who: string | null;
  phase: CloudPhase;
  lastSyncAt: number | null;
  error: string | null;
  pending: number;
  auto: boolean;
  setAuto: (v: boolean) => void;
  signInEmail: (email: string) => Promise<void>;
  signInGoogle: () => void;
  signOut: () => void;
  push: () => Promise<void>;
  sync: () => Promise<void>;
};

const DEBOUNCE_MS = 4000;

export function useCloudSync(state: State, dispatch: Dispatch<Action>): CloudSync {
  const configured = !!cloudConfig();
  const [session, setSession] = useState(() => readSession());
  const [phase, setPhase] = useState<CloudPhase>(() => (!configured ? 'unconfigured' : readSession() ? 'ready' : 'signed-out'));
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [auto, setAuto] = useState(() => autoSyncEnabled());
  const [pendingRev, setPendingRev] = useState<number>(() => (readSession() ? state.rev : 0));
  const live = useRef(state);
  live.current = state;
  const pushed = useRef(0);

  const who = useMemo(() => {
    const s = readSession();
    if (!s) return null;
    try {
      return (JSON.parse(atob(s.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).email as string) ?? userId(s);
    } catch {
      return userId(s);
    }
  }, [session]);

  const sync = useCallback(async () => {
    if (!configured || !readSession()) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setPhase('offline');
      return;
    }
    setPhase('syncing');
    setError(null);
    try {
      const { row, error: pullErr } = await pullRow();
      if (pullErr) {
        setPhase('error');
        setError(pullErr);
        return;
      }
      const decision = decide({ rev: live.current.rev, updatedAt: live.current.updatedAt }, row);
      if (decision === 'pull' && row) {
        dumpLocalBackup(live.current);
        dispatch({ type: 'hydrate', state: row.data });
        pushed.current = row.rev;
        setPendingRev(row.rev);
        setLastSyncAt(Date.now());
        setPhase('synced');
        return;
      }
      if (decision === 'noop') {
        pushed.current = live.current.rev;
        setPendingRev(live.current.rev);
        setLastSyncAt(Date.now());
        setPhase('synced');
        return;
      }
      const res = await pushRow(live.current);
      if (!res.ok) {
        setPhase('error');
        setError(res.error ?? 'push rejected');
        setPendingRev(live.current.rev);
        return;
      }
      pushed.current = live.current.rev;
      setPendingRev(0);
      setLastSyncAt(Date.now());
      setPhase('synced');
    } catch (e) {
      setPhase('error');
      setError(e instanceof Error ? e.message : 'network error');
    }
  }, [configured, dispatch]);

  const push = useCallback(async () => {
    if (!configured || !readSession()) return;
    setPhase('syncing');
    const res = await pushRow(live.current);
    if (res.ok) {
      pushed.current = live.current.rev;
      setPendingRev(0);
      setLastSyncAt(Date.now());
      setPhase('synced');
      setError(null);
    } else {
      setPhase(res.error === 'signed-out' ? 'signed-out' : 'error');
      setError(res.error ?? 'push failed');
      setPendingRev(live.current.rev);
    }
  }, [configured]);

  /* A magic link or Google redirect hands us tokens in the URL fragment — consume them once. */
  useEffect(() => {
    const s = consumeRedirect();
    if (s) {
      setSession(s);
      setPhase('ready');
      void sync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Debounced auto-push while the tab is open. */
  useEffect(() => {
    if (!configured || !session || !auto) return;
    if (state.rev === pushed.current) return;
    setPendingRev(state.rev);
    setPhase((p) => (p === 'syncing' ? p : 'queued'));
    const t = window.setTimeout(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        setPhase('offline');
        return;
      }
      void push();
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [state.rev, configured, session, auto, push]);

  /* First pull on mount when a session already exists, and a flush when the phone comes back. */
  useEffect(() => {
    if (!configured || !readSession()) return;
    void sync();
    const onOnline = () => void sync();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, sync]);

  const signInEmail = useCallback(
    async (email: string) => {
      const r = await signInWithEmail(email);
      setError(r.ok ? null : r.message);
      setPhase(r.ok ? 'syncing' : 'error');
    },
    [],
  );

  const signInGoogle = useCallback(() => {
    const r = signInWithGoogle();
    if (!r.ok) {
      setPhase('error');
      setError(r.message);
    }
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setSession(null);
    setPhase(configured ? 'signed-out' : 'unconfigured');
    setPendingRev(live.current.rev);
    setError(null);
  }, [configured]);

  const toggleAuto = useCallback(
    (v: boolean) => {
      setAutoSync(v);
      setAuto(v);
      if (v && readSession()) void push();
    },
    [push],
  );

  return {
    configured,
    signedIn: !!session,
    who,
    phase,
    lastSyncAt,
    error,
    pending: session && state.rev !== pushed.current ? state.rev - pushed.current : pendingRev ? Math.max(0, pendingRev - pushed.current) : 0,
    auto,
    setAuto: toggleAuto,
    signInEmail,
    signInGoogle,
    signOut,
    push,
    sync,
  };
}
