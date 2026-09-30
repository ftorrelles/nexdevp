-- Lead attribution: first-touch source (utm_*, ad click ids, external referrer,
-- landing path) captured on the public site. Nullable; older leads simply have none.
-- Safe to re-run.
alter table public.leads add column if not exists attribution jsonb;

-- Make PostgREST pick up the new column right away (avoids a stale schema cache).
notify pgrst, 'reload schema';
