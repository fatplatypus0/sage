-- SAGE · optional cloud mirror
--
-- One row per user: the entire localStorage payload, plus the revision counter the client
-- uses to decide which device wins. Run this in the Supabase SQL editor (or
-- `supabase db push`) *before* setting the VITE_SUPABASE_* env vars.

create table if not exists public.sage_progress (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  rev         bigint  not null default 0,
  updated_at  bigint  not null default 0,
  data        jsonb   not null,
  constraint sage_progress_rev_nonneg check (rev >= 0)
);

alter table public.sage_progress enable row level security;

-- Owner-only. No policy for anon: a signed-out visitor can neither read nor write,
-- which is what keeps "no account, no tracking" true even on a synced deployment.
drop policy if exists "own row select" on public.sage_progress;
create policy "own row select" on public.sage_progress
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "own row upsert" on public.sage_progress;
create policy "own row upsert" on public.sage_progress
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "own row update" on public.sage_progress;
create policy "own row update" on public.sage_progress
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- The client sends an UPSERT (merge-duplicates), which PostgREST implements as an
-- INSERT ... ON CONFLICT; without an update policy a re-push fails silently.
drop policy if exists "own row delete" on public.sage_progress;
create policy "own row delete" on public.sage_progress
  for delete to authenticated using ((select auth.uid()) = user_id);

comment on table public.sage_progress is 'SAGE (EUEE 24-week plan) per-user progress mirror; local storage remains the source of truth.';
