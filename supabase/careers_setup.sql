-- nexdevp — Careers & Applicants setup
-- Run this once in the Supabase SQL Editor (project shtpzihvdlskwfqikatw).
-- Safe to re-run: every statement is idempotent.

-- 1) Positions ---------------------------------------------------------------
create table if not exists public.careers (
  id uuid primary key default gen_random_uuid(),
  title_es text not null,
  title_en text not null,
  department_es text not null,
  department_en text not null,
  location_es text not null,
  location_en text not null,
  type_es text not null,
  type_en text not null,
  description_es text not null,
  description_en text not null,
  requirements_es text,
  requirements_en text,
  responsibilities_es text,
  responsibilities_en text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2) Applications ------------------------------------------------------------
create table if not exists public.career_applications (
  id uuid primary key default gen_random_uuid(),
  career_id uuid not null references public.careers(id) on delete cascade,
  nombre text not null,
  email text not null,
  telefono text,
  mensaje text,
  cv_url text not null, -- storage object path inside the "cvs" bucket
  estado text not null default 'nuevo'
    check (estado in ('nuevo', 'revisado', 'aceptado', 'rechazado')),
  created_at timestamptz not null default now()
);

create index if not exists career_applications_career_id_idx
  on public.career_applications (career_id);
create index if not exists career_applications_created_at_idx
  on public.career_applications (created_at desc);

-- 3) RLS ---------------------------------------------------------------------
-- The app touches these tables ONLY through the service-role key (server API
-- routes + Server Components), which bypasses RLS. Enable RLS with no policies
-- so the public anon key cannot read or write these tables directly.
alter table public.careers enable row level security;
alter table public.career_applications enable row level security;

-- The app reads/writes these tables with the service-role key (which bypasses
-- RLS). Grant it the table privileges explicitly so server routes and Server
-- Components are not blocked by "permission denied" (error 42501).
grant all privileges on public.careers to service_role;
grant all privileges on public.career_applications to service_role;

-- 4) Private storage bucket for CVs -----------------------------------------
-- Private on purpose: the app serves CVs via short-lived signed URLs.
insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', false)
on conflict (id) do update set public = excluded.public;

-- 5) Seed sample position (Vendedor) ----------------------------------------
insert into public.careers (
  title_es, title_en,
  department_es, department_en,
  location_es, location_en,
  type_es, type_en,
  description_es, description_en,
  requirements_es, requirements_en,
  responsibilities_es, responsibilities_en,
  active
)
select
  'Representante de Ventas', 'Sales Representative',
  'Ventas / Comercial', 'Sales',
  'Remoto (Latam)', 'Remote (Latam)',
  'Comisión 15% / Full-time', '15% Commission / Full-time',
  'Buscamos un vendedor con hambre de cierre para conectar nexdevp con empresas que necesitan automatizar sus ventas con IA.',
  'We are looking for a closer-minded sales rep to connect nexdevp with companies that need to automate their sales with AI.',
  E'Experiencia previa de 2 años en ventas B2B\nExcelentes habilidades comunicativas\nManejo de CRM',
  E'2 years of previous B2B sales experience\nExcellent communication skills\nCRM proficiency',
  E'Cierre de prospectos comerciales\nMantener al día el CRM\nReportar métricas semanales',
  E'Close sales opportunities\nKeep the CRM updated\nReport weekly metrics',
  true
where not exists (
  select 1 from public.careers where title_es = 'Representante de Ventas'
);
