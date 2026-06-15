-- nexdevp — Cotizador (Quote Calculator) setup
-- Run once in the Supabase SQL Editor.
-- Safe to re-run: every statement is idempotent.

-- ─── 1) pricing_settings ────────────────────────────────────────────────────
-- Region rates and overhead percentages. Editable from the CRM admin later.
create table if not exists public.pricing_settings (
  id          uuid primary key default gen_random_uuid(),
  region      text not null unique,          -- 'españa' | 'eeuu' | 'latam'
  currency    text not null,                 -- 'EUR' | 'USD'
  hourly_rate numeric(10,2) not null,
  overhead_pm numeric(5,4) not null default 0.12,   -- project management %
  overhead_qa numeric(5,4) not null default 0.15,   -- testing / QA %
  overhead_cx numeric(5,4) not null default 0.10,   -- contingency %
  maint_rate  numeric(5,4) not null default 0.175,  -- annual maintenance % of build
  updated_at  timestamptz not null default now()
);

-- ─── 2) quote_size_map ──────────────────────────────────────────────────────
-- T-shirt sizes to hours. One row per size, editable.
create table if not exists public.quote_size_map (
  size        text primary key,  -- 'S' | 'M' | 'L' | 'XL'
  hours       int  not null,
  description text not null
);

-- ─── 3) quote_catalog ───────────────────────────────────────────────────────
-- Master list of use-case line items (the 26 items from the Excel).
create table if not exists public.quote_catalog (
  id          uuid primary key default gen_random_uuid(),
  category    text not null,   -- 'desarrollo' | 'marketing' | 'chatbot'
  size        text not null references public.quote_size_map(size),
  name        text not null,
  description text,
  sort_order  int  not null default 0,
  active      boolean not null default true
);

-- ─── 4) quote_templates ─────────────────────────────────────────────────────
-- Which catalog items a tipo+producto combination pre-loads.
create table if not exists public.quote_templates (
  id           uuid primary key default gen_random_uuid(),
  tipo         text not null,    -- 'desarrollo' | 'marketing' | 'chatbot'
  product      text not null,    -- 'landing' | 'pwa' | 'software' | 'mvp' | 'agente-ia' | 'crm' | 'ecommerce' | 'web'
  catalog_id   uuid not null references public.quote_catalog(id) on delete cascade,
  sort_order   int  not null default 0,
  unique (tipo, product, catalog_id)
);

-- ─── 5) quotes ──────────────────────────────────────────────────────────────
-- A saved quote. lead_id is nullable (standalone mode).
create table if not exists public.quotes (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid references public.leads(id) on delete set null,
  title        text not null,
  region       text not null references public.pricing_settings(region),
  hourly_rate  numeric(10,2) not null,
  tipo         text not null,
  product      text not null,
  addons       text[] not null default '{}',
  status       text not null default 'draft'   -- 'draft' | 'sent' | 'accepted' | 'rejected'
                check (status in ('draft','sent','accepted','rejected')),
  total_hours  int  not null default 0,
  total_price  numeric(12,2) not null default 0,
  maint_month  numeric(10,2) not null default 0,
  notes        text,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─── 6) quote_items ─────────────────────────────────────────────────────────
-- Individual line items / phases of a quote (editable after generation).
create table if not exists public.quote_items (
  id           uuid primary key default gen_random_uuid(),
  quote_id     uuid not null references public.quotes(id) on delete cascade,
  catalog_id   uuid references public.quote_catalog(id) on delete set null,
  name         text not null,
  size         text,
  hours        int  not null default 0,
  sort_order   int  not null default 0
);

-- ─── INDEXES ────────────────────────────────────────────────────────────────
create index if not exists idx_quotes_lead    on public.quotes(lead_id);
create index if not exists idx_quotes_status  on public.quotes(status);
create index if not exists idx_quotes_created on public.quotes(created_by);
create index if not exists idx_quote_items_quote on public.quote_items(quote_id);

-- ─── RLS ────────────────────────────────────────────────────────────────────
alter table public.pricing_settings  enable row level security;
alter table public.quote_size_map    enable row level security;
alter table public.quote_catalog     enable row level security;
alter table public.quote_templates   enable row level security;
alter table public.quotes            enable row level security;
alter table public.quote_items       enable row level security;

-- Staff (owner / supervisor / vendor) can read/write everything.
-- Applicants cannot access any of this (they go through /careers, not /admin).
do $$ begin
  -- pricing_settings
  if not exists (select 1 from pg_policies where tablename='pricing_settings' and policyname='staff_all') then
    create policy staff_all on public.pricing_settings
      for all using (auth.jwt() -> 'app_metadata' ->> 'role' in ('owner','supervisor','vendor'));
  end if;
  -- quote_size_map
  if not exists (select 1 from pg_policies where tablename='quote_size_map' and policyname='staff_all') then
    create policy staff_all on public.quote_size_map
      for all using (auth.jwt() -> 'app_metadata' ->> 'role' in ('owner','supervisor','vendor'));
  end if;
  -- quote_catalog
  if not exists (select 1 from pg_policies where tablename='quote_catalog' and policyname='staff_all') then
    create policy staff_all on public.quote_catalog
      for all using (auth.jwt() -> 'app_metadata' ->> 'role' in ('owner','supervisor','vendor'));
  end if;
  -- quote_templates
  if not exists (select 1 from pg_policies where tablename='quote_templates' and policyname='staff_all') then
    create policy staff_all on public.quote_templates
      for all using (auth.jwt() -> 'app_metadata' ->> 'role' in ('owner','supervisor','vendor'));
  end if;
  -- quotes
  if not exists (select 1 from pg_policies where tablename='quotes' and policyname='staff_all') then
    create policy staff_all on public.quotes
      for all using (auth.jwt() -> 'app_metadata' ->> 'role' in ('owner','supervisor','vendor'));
  end if;
  -- quote_items
  if not exists (select 1 from pg_policies where tablename='quote_items' and policyname='staff_all') then
    create policy staff_all on public.quote_items
      for all using (auth.jwt() -> 'app_metadata' ->> 'role' in ('owner','supervisor','vendor'));
  end if;
end $$;

-- Service role bypass (for server-side API routes)
grant all privileges on public.pricing_settings  to service_role;
grant all privileges on public.quote_size_map    to service_role;
grant all privileges on public.quote_catalog     to service_role;
grant all privileges on public.quote_templates   to service_role;
grant all privileges on public.quotes            to service_role;
grant all privileges on public.quote_items       to service_role;

-- ─── SEED: pricing_settings ─────────────────────────────────────────────────
insert into public.pricing_settings (region, currency, hourly_rate) values
  ('españa', 'EUR', 55.00),
  ('eeuu',   'USD', 90.00),
  ('latam',  'USD', 35.00)
on conflict (region) do nothing;

-- ─── SEED: quote_size_map ───────────────────────────────────────────────────
insert into public.quote_size_map (size, hours, description) values
  ('S',  8,  'Una pantalla / CRUD simple'),
  ('M',  20, 'Módulo con lógica'),
  ('L',  40, 'Módulo complejo / integración'),
  ('XL', 80, 'Subsistema completo')
on conflict (size) do nothing;

-- ─── SEED: quote_catalog ────────────────────────────────────────────────────
-- S items
insert into public.quote_catalog (category, size, name, sort_order) values
  ('desarrollo', 'S', 'Landing / página informativa',           10),
  ('desarrollo', 'S', 'Formulario de contacto + captura de lead', 20),
  ('desarrollo', 'S', 'Multi-idioma (i18n)',                    30),
  ('desarrollo', 'S', 'Notificaciones por email (transaccionales)', 40),
  ('desarrollo', 'S', 'CRUD de entidad simple',                 50),
  ('desarrollo', 'S', 'Listado / catálogo de productos',        60),
-- M items
  ('desarrollo', 'M', 'Login + registro + roles',               110),
  ('desarrollo', 'M', 'Setup de proyecto + deploy / CI',        120),
  ('desarrollo', 'M', 'Panel de usuario / perfil',              130),
  ('desarrollo', 'M', 'CRUD con relaciones y validaciones',     140),
  ('desarrollo', 'M', 'Búsqueda, filtros y paginación',         150),
  ('desarrollo', 'M', 'Carga y gestión de archivos',            160),
  ('desarrollo', 'M', 'Flujo de estados / aprobación',          170),
-- L items
  ('desarrollo', 'L', 'Dashboard con reportes y métricas',      210),
  ('desarrollo', 'L', 'Integración con API externa',            220),
  ('desarrollo', 'L', 'Pasarela de pago',                       230),
  ('desarrollo', 'L', 'PWA / funcionalidad offline-first',      240),
  ('desarrollo', 'L', 'Sincronización en tiempo real',          250),
  ('desarrollo', 'L', 'Integración WhatsApp Business API',      260),
  ('desarrollo', 'L', 'Motor de cálculo automático',            270),
-- XL items
  ('desarrollo', 'XL', 'Agente IA WhatsApp (contacta, califica, agenda)', 310),
  ('desarrollo', 'XL', 'CRM completo (pipeline + asignación de leads)',   320),
  ('desarrollo', 'XL', 'Panel de administración multi-módulo',            330),
  ('desarrollo', 'XL', 'Sistema multi-sede / multi-centro',               340),
  ('desarrollo', 'XL', 'MVP funcional completo (4–8 semanas)',            350),
  ('desarrollo', 'XL', 'Transformación digital (diagnóstico + roadmap)',  360)
on conflict do nothing;

-- ─── SEED: quote_templates ──────────────────────────────────────────────────
-- Each template pre-loads the most typical items for that tipo+product combo.
-- Vendors can always add/remove items after generation.

-- landing
insert into public.quote_templates (tipo, product, catalog_id, sort_order)
select 'marketing', 'landing', id, sort_order from public.quote_catalog
where name in (
  'Landing / página informativa',
  'Formulario de contacto + captura de lead',
  'Multi-idioma (i18n)',
  'Notificaciones por email (transaccionales)'
) on conflict do nothing;

-- web corporativa
insert into public.quote_templates (tipo, product, catalog_id, sort_order)
select 'marketing', 'web', id, sort_order from public.quote_catalog
where name in (
  'Landing / página informativa',
  'Formulario de contacto + captura de lead',
  'Multi-idioma (i18n)',
  'Login + registro + roles',
  'Panel de usuario / perfil'
) on conflict do nothing;

-- PWA
insert into public.quote_templates (tipo, product, catalog_id, sort_order)
select 'desarrollo', 'pwa', id, sort_order from public.quote_catalog
where name in (
  'Setup de proyecto + deploy / CI',
  'Login + registro + roles',
  'CRUD con relaciones y validaciones',
  'Búsqueda, filtros y paginación',
  'PWA / funcionalidad offline-first',
  'Notificaciones por email (transaccionales)'
) on conflict do nothing;

-- Software a medida
insert into public.quote_templates (tipo, product, catalog_id, sort_order)
select 'desarrollo', 'software', id, sort_order from public.quote_catalog
where name in (
  'Setup de proyecto + deploy / CI',
  'Login + registro + roles',
  'CRUD con relaciones y validaciones',
  'Búsqueda, filtros y paginación',
  'Carga y gestión de archivos',
  'Flujo de estados / aprobación',
  'Dashboard con reportes y métricas'
) on conflict do nothing;

-- E-commerce
insert into public.quote_templates (tipo, product, catalog_id, sort_order)
select 'desarrollo', 'ecommerce', id, sort_order from public.quote_catalog
where name in (
  'Setup de proyecto + deploy / CI',
  'Login + registro + roles',
  'Listado / catálogo de productos',
  'CRUD con relaciones y validaciones',
  'Pasarela de pago',
  'Búsqueda, filtros y paginación',
  'Notificaciones por email (transaccionales)'
) on conflict do nothing;

-- MVP
insert into public.quote_templates (tipo, product, catalog_id, sort_order)
select 'desarrollo', 'mvp', id, sort_order from public.quote_catalog
where name in (
  'Setup de proyecto + deploy / CI',
  'Landing / página informativa',
  'Login + registro + roles',
  'CRUD con relaciones y validaciones',
  'MVP funcional completo (4–8 semanas)'
) on conflict do nothing;

-- CRM
insert into public.quote_templates (tipo, product, catalog_id, sort_order)
select 'desarrollo', 'crm', id, sort_order from public.quote_catalog
where name in (
  'Setup de proyecto + deploy / CI',
  'Login + registro + roles',
  'CRUD con relaciones y validaciones',
  'Flujo de estados / aprobación',
  'Dashboard con reportes y métricas',
  'CRM completo (pipeline + asignación de leads)',
  'Notificaciones por email (transaccionales)'
) on conflict do nothing;

-- Agente IA WhatsApp
insert into public.quote_templates (tipo, product, catalog_id, sort_order)
select 'chatbot', 'agente-ia', id, sort_order from public.quote_catalog
where name in (
  'Setup de proyecto + deploy / CI',
  'Integración WhatsApp Business API',
  'Agente IA WhatsApp (contacta, califica, agenda)',
  'CRM completo (pipeline + asignación de leads)',
  'Notificaciones por email (transaccionales)'
) on conflict do nothing;

-- Transformación digital
insert into public.quote_templates (tipo, product, catalog_id, sort_order)
select 'desarrollo', 'transformacion', id, sort_order from public.quote_catalog
where name in (
  'Transformación digital (diagnóstico + roadmap)'
) on conflict do nothing;
