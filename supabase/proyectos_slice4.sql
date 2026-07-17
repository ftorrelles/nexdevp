-- NOTE: After running this migration, create a private Storage bucket named 'project-assets'
-- in the Supabase dashboard (Storage > New bucket > private). Service role handles all access.

-- ============================================================
-- Slice 4: Project Brief System
-- Tables: brief_templates, brief_template_questions,
--         project_briefs, project_brief_questions,
--         project_brief_answers
-- Also extends: project_deliverables RLS, deliverable_comments
-- ============================================================

-- ------------------------------------------------------------
-- 1. brief_templates
-- ------------------------------------------------------------
create table if not exists public.brief_templates (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  description text,
  created_by  uuid        references auth.users(id),
  created_at  timestamptz default now()
);

alter table public.brief_templates enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'brief_templates'
      and policyname = 'owner_supervisor_all'
  ) then
    create policy owner_supervisor_all on public.brief_templates
      for all using (
        auth.jwt()->'app_metadata'->>'role' in ('owner', 'supervisor')
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'brief_templates'
      and policyname = 'developer_select'
  ) then
    create policy developer_select on public.brief_templates
      for select using (
        auth.jwt()->'app_metadata'->>'role' = 'developer'
      );
  end if;
end $$;

-- ------------------------------------------------------------
-- 2. brief_template_questions
-- ------------------------------------------------------------
create table if not exists public.brief_template_questions (
  id          uuid        primary key default gen_random_uuid(),
  template_id uuid        not null references public.brief_templates(id) on delete cascade,
  label       text        not null,
  description text,
  field_type  text        not null check (field_type in ('text', 'textarea', 'url', 'image', 'boolean')),
  sort_order  int         not null default 0,
  required    boolean     not null default false,
  created_at  timestamptz default now()
);

create index if not exists idx_brief_template_questions_template
  on public.brief_template_questions(template_id);

alter table public.brief_template_questions enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'brief_template_questions'
      and policyname = 'owner_supervisor_all'
  ) then
    create policy owner_supervisor_all on public.brief_template_questions
      for all using (
        auth.jwt()->'app_metadata'->>'role' in ('owner', 'supervisor')
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'brief_template_questions'
      and policyname = 'developer_select'
  ) then
    create policy developer_select on public.brief_template_questions
      for select using (
        auth.jwt()->'app_metadata'->>'role' = 'developer'
      );
  end if;
end $$;

-- ------------------------------------------------------------
-- 3. project_briefs
-- ------------------------------------------------------------
create table if not exists public.project_briefs (
  id           uuid        primary key default gen_random_uuid(),
  project_id   uuid        not null unique references public.projects(id) on delete cascade,
  template_id  uuid        references public.brief_templates(id) on delete set null,
  status       text        not null default 'draft'
                           check (status in ('draft', 'sent', 'completed')),
  sent_at      timestamptz,
  completed_at timestamptz,
  created_at   timestamptz default now()
);

alter table public.project_briefs enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'project_briefs'
      and policyname = 'staff_select'
  ) then
    create policy staff_select on public.project_briefs
      for select using (
        auth.jwt()->'app_metadata'->>'role' in ('owner', 'supervisor')
        or (
          auth.jwt()->'app_metadata'->>'role' = 'developer'
          and exists (
            select 1 from public.project_deliverables pd
            where pd.project_id = project_briefs.project_id
              and pd.assigned_to = auth.uid()
          )
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'project_briefs'
      and policyname = 'client_select'
  ) then
    create policy client_select on public.project_briefs
      for select using (
        auth.jwt()->'app_metadata'->>'role' = 'client'
        and exists (
          select 1 from public.projects p
          where p.id = project_briefs.project_id
            and p.client_user_id = auth.uid()
        )
      );
  end if;
end $$;

-- ------------------------------------------------------------
-- 4. project_brief_questions
-- ------------------------------------------------------------
create table if not exists public.project_brief_questions (
  id                       uuid    primary key default gen_random_uuid(),
  brief_id                 uuid    not null references public.project_briefs(id) on delete cascade,
  label                    text    not null,
  description              text,
  field_type               text    not null check (field_type in ('text', 'textarea', 'url', 'image', 'boolean')),
  sort_order               int     not null default 0,
  required                 boolean not null default false,
  from_template_question_id uuid   references public.brief_template_questions(id) on delete set null
);

create index if not exists idx_project_brief_questions_brief
  on public.project_brief_questions(brief_id);

alter table public.project_brief_questions enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'project_brief_questions'
      and policyname = 'staff_select'
  ) then
    create policy staff_select on public.project_brief_questions
      for select using (
        auth.jwt()->'app_metadata'->>'role' in ('owner', 'supervisor')
        or (
          auth.jwt()->'app_metadata'->>'role' = 'developer'
          and exists (
            select 1 from public.project_briefs pb
            join public.project_deliverables pd on pd.project_id = pb.project_id
            where pb.id = project_brief_questions.brief_id
              and pd.assigned_to = auth.uid()
          )
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'project_brief_questions'
      and policyname = 'staff_update'
  ) then
    create policy staff_update on public.project_brief_questions
      for update using (
        auth.jwt()->'app_metadata'->>'role' in ('owner', 'supervisor')
        or (
          auth.jwt()->'app_metadata'->>'role' = 'developer'
          and exists (
            select 1 from public.project_briefs pb
            join public.project_deliverables pd on pd.project_id = pb.project_id
            where pb.id = project_brief_questions.brief_id
              and pd.assigned_to = auth.uid()
          )
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'project_brief_questions'
      and policyname = 'client_select'
  ) then
    create policy client_select on public.project_brief_questions
      for select using (
        auth.jwt()->'app_metadata'->>'role' = 'client'
        and exists (
          select 1 from public.project_briefs pb
          join public.projects p on p.id = pb.project_id
          where pb.id = project_brief_questions.brief_id
            and p.client_user_id = auth.uid()
        )
      );
  end if;
end $$;

-- ------------------------------------------------------------
-- 5. project_brief_answers
-- ------------------------------------------------------------
create table if not exists public.project_brief_answers (
  id                uuid        primary key default gen_random_uuid(),
  brief_question_id uuid        not null unique references public.project_brief_questions(id) on delete cascade,
  value             text,
  file_path         text,
  answered_at       timestamptz default now()
);

alter table public.project_brief_answers enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'project_brief_answers'
      and policyname = 'staff_select'
  ) then
    create policy staff_select on public.project_brief_answers
      for select using (
        auth.jwt()->'app_metadata'->>'role' in ('owner', 'supervisor')
        or (
          auth.jwt()->'app_metadata'->>'role' = 'developer'
          and exists (
            select 1 from public.project_brief_questions pbq
            join public.project_briefs pb on pb.id = pbq.brief_id
            join public.project_deliverables pd on pd.project_id = pb.project_id
            where pbq.id = project_brief_answers.brief_question_id
              and pd.assigned_to = auth.uid()
          )
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'project_brief_answers'
      and policyname = 'client_all'
  ) then
    create policy client_all on public.project_brief_answers
      for all using (
        auth.jwt()->'app_metadata'->>'role' = 'client'
        and exists (
          select 1 from public.project_brief_questions pbq
          join public.project_briefs pb on pb.id = pbq.brief_id
          join public.projects p on p.id = pb.project_id
          where pbq.id = project_brief_answers.brief_question_id
            and p.client_user_id = auth.uid()
        )
      );
  end if;
end $$;

-- ------------------------------------------------------------
-- 6. Grants to service_role
-- ------------------------------------------------------------
grant all privileges on public.brief_templates           to service_role;
grant all privileges on public.brief_template_questions  to service_role;
grant all privileges on public.project_briefs            to service_role;
grant all privileges on public.project_brief_questions   to service_role;
grant all privileges on public.project_brief_answers     to service_role;

-- ------------------------------------------------------------
-- 7. Extend project_deliverables — replace staff_select policy
--    to include developer scope (assigned_to via lead assignment)
-- ------------------------------------------------------------
drop policy if exists staff_select on public.project_deliverables;

create policy staff_select on public.project_deliverables
  for select using (
    auth.jwt()->'app_metadata'->>'role' in ('owner', 'supervisor')
    or (
      auth.jwt()->'app_metadata'->>'role' = 'vendor'
      and exists (
        select 1 from public.projects p
        join public.leads l on l.id = p.lead_id
        where p.id = project_deliverables.project_id
          and l.assigned_to = auth.uid()
      )
    )
    or (
      auth.jwt()->'app_metadata'->>'role' = 'developer'
      and project_deliverables.assigned_to = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 8. Extend deliverable_comments
--    a) Broaden author_role CHECK to include 'developer'
--    b) Replace staff_select to add developer scope
-- ------------------------------------------------------------
alter table public.deliverable_comments
  drop constraint if exists deliverable_comments_author_role_check;

alter table public.deliverable_comments
  add constraint deliverable_comments_author_role_check
  check (author_role in ('owner', 'supervisor', 'developer', 'client'));

drop policy if exists staff_select on public.deliverable_comments;

create policy staff_select on public.deliverable_comments
  for select using (
    auth.jwt()->'app_metadata'->>'role' in ('owner', 'supervisor')
    or (
      auth.jwt()->'app_metadata'->>'role' = 'developer'
      and exists (
        select 1 from public.project_deliverables pd
        where pd.id = deliverable_comments.deliverable_id
          and pd.assigned_to = auth.uid()
      )
    )
  );
