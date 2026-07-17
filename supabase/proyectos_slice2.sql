-- Slice 2: client portal — add client_email for cheap display without auth admin call at render time
alter table public.projects add column if not exists client_email text;
