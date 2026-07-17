-- nexdevp — Proyectos (Project delivery module) setup
-- Run once in the Supabase SQL Editor.
-- Safe to re-run: every statement is idempotent.

-- ─── 1) projects ─────────────────────────────────────────────────────────────
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads(id) on delete restrict,
  quote_id    uuid references public.quotes(id) on delete set null,
  name        text not null,
  status      text not null default 'activo'
                check (status in ('activo','pausado','entregado','cerrado')),
  vercel_url  text,
  client_user_id uuid references auth.users(id) on delete set null,
  client_email text,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── 2) project_deliverables ─────────────────────────────────────────────────
create table if not exists public.project_deliverables (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  name        text not null,
  hours       integer not null default 0,
  status      text not null default 'pendiente'
                check (status in ('pendiente','en_curso','en_revision','aprobado','cambios_solicitados')),
  assigned_to uuid references auth.users(id) on delete set null,
  seeded_from_quote_item_id uuid references public.quote_items(id) on delete set null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
create index if not exists idx_projects_lead on public.projects(lead_id);
create index if not exists idx_projects_client on public.projects(client_user_id);
create index if not exists idx_project_deliverables_project on public.project_deliverables(project_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.projects              enable row level security;
alter table public.project_deliverables  enable row level security;

do $$ begin
  -- projects: owner/supervisor full access
  if not exists (select 1 from pg_policies where tablename='projects' and policyname='owner_supervisor_all') then
    create policy owner_supervisor_all on public.projects
      for all using (auth.jwt() -> 'app_metadata' ->> 'role' in ('owner','supervisor'));
  end if;

  -- projects: vendor select (scoped to assigned leads)
  if not exists (select 1 from pg_policies where tablename='projects' and policyname='vendor_select') then
    create policy vendor_select on public.projects
      for select using (
        auth.jwt() -> 'app_metadata' ->> 'role' = 'vendor'
        and exists (
          select 1 from public.leads
          where leads.id = projects.lead_id
          and leads.assigned_to = auth.uid()
        )
      );
  end if;

  -- projects: client select (own project only; Slice 2+)
  if not exists (select 1 from pg_policies where tablename='projects' and policyname='client_select') then
    create policy client_select on public.projects
      for select using (
        auth.jwt() -> 'app_metadata' ->> 'role' = 'client'
        and projects.client_user_id = auth.uid()
      );
  end if;

  -- project_deliverables: staff select (owner/supervisor all; vendor scoped to assigned leads)
  if not exists (select 1 from pg_policies where tablename='project_deliverables' and policyname='staff_select') then
    create policy staff_select on public.project_deliverables
      for select using (
        auth.jwt() -> 'app_metadata' ->> 'role' in ('owner','supervisor')
        or (
          auth.jwt() -> 'app_metadata' ->> 'role' = 'vendor'
          and exists (
            select 1 from public.projects p
            join public.leads l on l.id = p.lead_id
            where p.id = project_deliverables.project_id
            and l.assigned_to = auth.uid()
          )
        )
      );
  end if;

  -- project_deliverables: client select (own project only; Slice 2+)
  if not exists (select 1 from pg_policies where tablename='project_deliverables' and policyname='client_select') then
    create policy client_select on public.project_deliverables
      for select using (
        auth.jwt() -> 'app_metadata' ->> 'role' = 'client'
        and exists (
          select 1 from public.projects
          where projects.id = project_deliverables.project_id
          and projects.client_user_id = auth.uid()
        )
      );
  end if;

  -- project_deliverables: owner/supervisor modify (insert/update/delete)
  if not exists (select 1 from pg_policies where tablename='project_deliverables' and policyname='owner_supervisor_modify') then
    create policy owner_supervisor_modify on public.project_deliverables
      for insert with check (auth.jwt() -> 'app_metadata' ->> 'role' in ('owner','supervisor'));
  end if;

  if not exists (select 1 from pg_policies where tablename='project_deliverables' and policyname='owner_supervisor_update') then
    create policy owner_supervisor_update on public.project_deliverables
      for update using (auth.jwt() -> 'app_metadata' ->> 'role' in ('owner','supervisor'))
      with check (auth.jwt() -> 'app_metadata' ->> 'role' in ('owner','supervisor'));
  end if;

  if not exists (select 1 from pg_policies where tablename='project_deliverables' and policyname='owner_supervisor_delete') then
    create policy owner_supervisor_delete on public.project_deliverables
      for delete using (auth.jwt() -> 'app_metadata' ->> 'role' in ('owner','supervisor'));
  end if;
end $$;

-- Service role bypass (for server-side API routes)
grant all privileges on public.projects             to service_role;
grant all privileges on public.project_deliverables  to service_role;
