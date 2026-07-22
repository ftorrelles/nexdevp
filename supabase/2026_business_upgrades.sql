-- nexdevp — Business upgrades (quote versioning · permissions · dashboard)
-- Run once in the Supabase SQL Editor. Safe to re-run: every statement is idempotent.
--
-- This migration is PURELY ADDITIVE. It never drops or rewrites existing columns,
-- so current flows (leads, quotes, PDF, careers, auth) keep working unchanged.
-- New snapshot columns are nullable; the app falls back to the legacy columns
-- (total_price, hourly_rate, …) whenever a snapshot is absent (old quotes).

-- ─── 1) config_versions ──────────────────────────────────────────────────────
-- Single-row table holding monotonic version counters. Bumped whenever the
-- catalog or pricing settings change, so each quote can freeze the version it
-- was calculated against.
create table if not exists public.config_versions (
  id              int  primary key default 1,
  catalog_version int  not null default 1,
  pricing_version int  not null default 1,
  updated_at      timestamptz not null default now(),
  constraint config_versions_singleton check (id = 1)
);
insert into public.config_versions (id) values (1) on conflict (id) do nothing;

-- ─── 2) quotes — snapshot columns ────────────────────────────────────────────
-- created_by + commission_type already exist in the live DB; we only add the
-- frozen snapshot of everything used to compute the price.
alter table public.quotes
  add column if not exists catalog_version            int,
  add column if not exists pricing_version            int,
  add column if not exists currency                   text,
  add column if not exists hourly_rate_snapshot       numeric(10,2),
  add column if not exists pm_percentage_snapshot     numeric(5,4),
  add column if not exists qa_percentage_snapshot     numeric(5,4),
  add column if not exists cx_percentage_snapshot     numeric(5,4),
  add column if not exists maint_percentage_snapshot  numeric(5,4),
  add column if not exists development_hours_snapshot int,
  add column if not exists pm_hours_snapshot          int,
  add column if not exists qa_hours_snapshot          int,
  add column if not exists contingency_hours_snapshot int,
  add column if not exists subtotal_snapshot          numeric(12,2),
  add column if not exists total_snapshot             numeric(12,2),
  add column if not exists annual_maintenance_snapshot numeric(12,2),
  add column if not exists selected_items_snapshot    jsonb,
  add column if not exists calculation_snapshot       jsonb,
  add column if not exists approved_by                uuid references auth.users(id) on delete set null,
  add column if not exists approved_at                timestamptz,
  add column if not exists sent_at                    timestamptz;

-- ─── 3) quote_items — snapshot columns ───────────────────────────────────────
-- name / size / hours already exist. Add the rest so an item keeps its identity
-- even if the catalog row it came from is later edited or deleted.
alter table public.quote_items
  add column if not exists description     text,
  add column if not exists category        text,
  add column if not exists calculated_price numeric(12,2),
  add column if not exists is_custom       boolean not null default false,
  add column if not exists catalog_version int;

-- ─── 4) leads — created_by ───────────────────────────────────────────────────
-- Lets a vendor own "leads created by him", independent of assignment.
alter table public.leads
  add column if not exists created_by uuid references auth.users(id) on delete set null;

create index if not exists idx_leads_created_by on public.leads(created_by);
create index if not exists idx_leads_assigned_to on public.leads(assigned_to);

-- ─── 5) lead_activities ──────────────────────────────────────────────────────
-- Activity / contact log per lead. The first activity whose type is a contact
-- type (contacted/call/whatsapp/email) marks the first response for the
-- average-response-time metric.
create table if not exists public.lead_activities (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references public.leads(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete set null,
  type       text not null,   -- 'note' | 'contacted' | 'call' | 'whatsapp' | 'email' | 'status_change' | 'quote_sent'
  notes      text,
  created_at timestamptz not null default now()
);
create index if not exists idx_lead_activities_lead on public.lead_activities(lead_id);
create index if not exists idx_lead_activities_created on public.lead_activities(created_at);

-- ─── 6) quote_commissions ────────────────────────────────────────────────────
-- Frozen commission snapshot. Generated when a quote becomes 'accepted'.
create table if not exists public.quote_commissions (
  id                            uuid primary key default gen_random_uuid(),
  quote_id                      uuid not null references public.quotes(id) on delete cascade,
  lead_id                       uuid references public.leads(id) on delete set null,
  vendor_id                     uuid references auth.users(id) on delete set null,
  commission_type               text not null,   -- 'nexdevp_pool' | 'own_lead'
  commission_percentage_snapshot numeric(5,4) not null,
  quote_total_snapshot          numeric(12,2) not null,
  commission_amount_snapshot    numeric(12,2) not null,
  currency                      text not null default 'EUR',
  status                        text not null default 'pending'
                                check (status in ('pending','approved','paid','cancelled')),
  created_at                    timestamptz not null default now(),
  approved_at                   timestamptz,
  paid_at                       timestamptz,
  -- one active commission per quote
  unique (quote_id)
);
create index if not exists idx_quote_commissions_quote  on public.quote_commissions(quote_id);
create index if not exists idx_quote_commissions_vendor on public.quote_commissions(vendor_id);
create index if not exists idx_quote_commissions_status on public.quote_commissions(status);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
alter table public.config_versions  enable row level security;
alter table public.lead_activities  enable row level security;
alter table public.quote_commissions enable row level security;

-- Staff (owner/supervisor/vendor) can read/write through RLS. Per-vendor
-- isolation is additionally enforced in the API layer (src/lib/permissions.ts),
-- because reads go through the service_role client which bypasses RLS. RLS here
-- is defense-in-depth for any future direct client access.
do $$ begin
  if not exists (select 1 from pg_policies where tablename='config_versions' and policyname='staff_read') then
    create policy staff_read on public.config_versions
      for select using (auth.jwt() -> 'app_metadata' ->> 'role' in ('owner','supervisor','vendor'));
  end if;
  if not exists (select 1 from pg_policies where tablename='config_versions' and policyname='owner_write') then
    create policy owner_write on public.config_versions
      for all using (auth.jwt() -> 'app_metadata' ->> 'role' = 'owner');
  end if;

  if not exists (select 1 from pg_policies where tablename='lead_activities' and policyname='staff_all') then
    create policy staff_all on public.lead_activities
      for all using (auth.jwt() -> 'app_metadata' ->> 'role' in ('owner','supervisor','vendor'));
  end if;

  if not exists (select 1 from pg_policies where tablename='quote_commissions' and policyname='staff_read') then
    create policy staff_read on public.quote_commissions
      for select using (auth.jwt() -> 'app_metadata' ->> 'role' in ('owner','supervisor','vendor'));
  end if;
  if not exists (select 1 from pg_policies where tablename='quote_commissions' and policyname='staff_write') then
    create policy staff_write on public.quote_commissions
      for all using (auth.jwt() -> 'app_metadata' ->> 'role' in ('owner','supervisor'));
  end if;
end $$;

-- Service role bypass (server-side API routes)
grant all privileges on public.config_versions   to service_role;
grant all privileges on public.lead_activities    to service_role;
grant all privileges on public.quote_commissions  to service_role;

-- ─── Backfill: freeze a snapshot for existing quotes ──────────────────────────
-- Existing quotes keep working via legacy-column fallback, but we backfill the
-- currency + headline snapshot so historical dashboard metrics are consistent.
update public.quotes q
set
  currency            = coalesce(q.currency, case q.region when 'españa' then 'EUR' else 'USD' end),
  hourly_rate_snapshot = coalesce(q.hourly_rate_snapshot, q.hourly_rate),
  total_snapshot      = coalesce(q.total_snapshot, q.total_price),
  catalog_version     = coalesce(q.catalog_version, (select catalog_version from public.config_versions where id = 1)),
  pricing_version     = coalesce(q.pricing_version, (select pricing_version from public.config_versions where id = 1))
where q.total_snapshot is null or q.currency is null;
