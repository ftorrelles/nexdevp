-- Slice 3: Collaboration — deliverable_comments table, RLS, and grant
create table if not exists public.deliverable_comments (
  id              uuid primary key default gen_random_uuid(),
  deliverable_id  uuid not null references public.project_deliverables(id) on delete cascade,
  author_user_id  uuid not null references auth.users(id) on delete cascade,
  author_role     text not null check (author_role in ('owner','supervisor','client')),
  body            text not null,
  kind            text not null default 'comentario'
                    check (kind in ('comentario','aprobacion','cambios')),
  created_at      timestamptz not null default now()
);

create index if not exists idx_deliverable_comments_deliverable
  on public.deliverable_comments(deliverable_id);

alter table public.deliverable_comments enable row level security;

create policy client_select on public.deliverable_comments
  for select using (
    auth.jwt()->'app_metadata'->>'role' = 'client'
    and exists (
      select 1 from public.project_deliverables pd
      join public.projects p on p.id = pd.project_id
      where pd.id = deliverable_comments.deliverable_id
      and p.client_user_id = auth.uid()
    )
  );

create policy staff_select on public.deliverable_comments
  for select using (
    auth.jwt()->'app_metadata'->>'role' in ('owner','supervisor')
  );

grant all privileges on public.deliverable_comments to service_role;
