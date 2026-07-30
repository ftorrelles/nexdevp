-- Drop the FK that prevents lead deletion and re-create it with CASCADE.
-- This way deleting a lead also deletes its linked project(s).
alter table public.projects
  drop constraint if exists projects_lead_id_fkey,
  add constraint projects_lead_id_fkey
    foreign key (lead_id) references public.leads(id)
    on delete cascade;
