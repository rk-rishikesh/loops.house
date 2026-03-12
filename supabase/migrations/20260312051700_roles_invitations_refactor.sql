-- ============================================================
-- Migration: Roles & Invitations Refactor
-- Replaces single app_role with is_admin/is_event_creator booleans,
-- unified invitations table, hackathon_cohosts, and hackathon_judges.
-- ============================================================

-- 1. New enums
create type invitation_type as enum ('event_host', 'cohost', 'judge', 'project_member');
create type invitation_status as enum ('pending', 'accepted', 'rejected');

-- 2. New columns on users
alter table public.users add column is_admin boolean not null default false;
alter table public.users add column is_event_creator boolean not null default false;

-- 3. Migrate existing role data
update public.users set is_admin = true where role = 'admin';
update public.users set is_event_creator = true where role = 'host';

-- 4. New tables
create table public.invitations (
  id              uuid primary key default gen_random_uuid(),
  type            invitation_type not null,
  email           text not null,
  invited_by      uuid not null references public.users(id) on delete cascade,
  hackathon_id    uuid references public.hackathons(id) on delete cascade,
  project_id      uuid references public.loops_profiles(id) on delete cascade,
  status          invitation_status not null default 'pending',
  created_at      timestamptz not null default now(),
  resolved_at     timestamptz,
  check (
    (type = 'event_host' and hackathon_id is null and project_id is null) or
    (type in ('cohost', 'judge') and hackathon_id is not null and project_id is null) or
    (type = 'project_member' and project_id is not null)
  )
);

create index idx_invitations_email on public.invitations(email);
create index idx_invitations_hackathon on public.invitations(hackathon_id) where hackathon_id is not null;
create index idx_invitations_project on public.invitations(project_id) where project_id is not null;
create index idx_invitations_status on public.invitations(status);
create unique index idx_invitations_unique_pending
  on public.invitations(type, email,
    coalesce(hackathon_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(project_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where status = 'pending';

create table public.hackathon_cohosts (
  hackathon_id  uuid not null references public.hackathons(id) on delete cascade,
  user_id       uuid not null references public.users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (hackathon_id, user_id)
);
create index idx_hackathon_cohosts_user on public.hackathon_cohosts(user_id);

create table public.hackathon_judges (
  hackathon_id    uuid not null references public.hackathons(id) on delete cascade,
  user_id         uuid not null references public.users(id) on delete cascade,
  assigned_tracks uuid[] default '{}',
  created_at      timestamptz not null default now(),
  primary key (hackathon_id, user_id)
);
create index idx_hackathon_judges_user on public.hackathon_judges(user_id);

-- 5. Enable RLS on new tables
alter table public.invitations enable row level security;
alter table public.hackathon_cohosts enable row level security;
alter table public.hackathon_judges enable row level security;

-- 6. RLS policies for invitations
create policy "invitations_select_own"
  on public.invitations for select using (
    email = (select email from public.users where id = auth.uid())
    or invited_by = auth.uid()
  );

create policy "invitations_insert_authorized"
  on public.invitations for insert with check (
    auth.uid() = invited_by
  );

create policy "invitations_update_own"
  on public.invitations for update using (
    email = (select email from public.users where id = auth.uid())
  );

create policy "invitations_delete_inviter"
  on public.invitations for delete using (
    invited_by = auth.uid()
  );

-- 7. RLS policies for hackathon_cohosts
create policy "hackathon_cohosts_select_public"
  on public.hackathon_cohosts for select using (true);

create policy "hackathon_cohosts_insert_host"
  on public.hackathon_cohosts for insert with check (
    auth.uid() in (select host_id from public.hackathons where id = hackathon_cohosts.hackathon_id)
    or (select is_admin from public.users where id = auth.uid()) = true
  );

create policy "hackathon_cohosts_delete_host"
  on public.hackathon_cohosts for delete using (
    auth.uid() in (select host_id from public.hackathons where id = hackathon_cohosts.hackathon_id)
    or (select is_admin from public.users where id = auth.uid()) = true
  );

-- 8. RLS policies for hackathon_judges
create policy "hackathon_judges_select_public"
  on public.hackathon_judges for select using (true);

create policy "hackathon_judges_insert_host_or_cohost"
  on public.hackathon_judges for insert with check (
    auth.uid() in (select host_id from public.hackathons where id = hackathon_judges.hackathon_id)
    or auth.uid() in (select user_id from public.hackathon_cohosts where hackathon_id = hackathon_judges.hackathon_id)
    or (select is_admin from public.users where id = auth.uid()) = true
  );

create policy "hackathon_judges_delete_host_or_cohost"
  on public.hackathon_judges for delete using (
    auth.uid() in (select host_id from public.hackathons where id = hackathon_judges.hackathon_id)
    or auth.uid() in (select user_id from public.hackathon_cohosts where hackathon_id = hackathon_judges.hackathon_id)
    or (select is_admin from public.users where id = auth.uid()) = true
  );

-- 9. Migrate judge_invites data to hackathon_judges (accepted ones)
insert into public.hackathon_judges (hackathon_id, user_id, assigned_tracks, created_at)
select hackathon_id, judge_user_id, assigned_tracks, created_at
from public.judge_invites
where accepted = true
on conflict do nothing;

-- 10. Auto-add event creators (current hosts) as cohosts of their own hackathons
insert into public.hackathon_cohosts (hackathon_id, user_id, created_at)
select h.id, h.host_id, h.created_at
from public.hackathons h
on conflict do nothing;

-- 11. Update hackathon RLS policies
drop policy if exists "hackathons_insert_host" on public.hackathons;
create policy "hackathons_insert_event_creator"
  on public.hackathons for insert with check (
    auth.uid() = host_id
    and (
      (select is_event_creator from public.users where id = auth.uid()) = true
      or (select is_admin from public.users where id = auth.uid()) = true
    )
  );

drop policy if exists "hackathons_update_host" on public.hackathons;
create policy "hackathons_update_host_or_cohost"
  on public.hackathons for update using (
    auth.uid() = host_id
    or auth.uid() in (select user_id from public.hackathon_cohosts where hackathon_id = hackathons.id)
  );

-- Update track policies to allow cohosts
drop policy if exists "hackathon_tracks_insert_host" on public.hackathon_tracks;
create policy "hackathon_tracks_insert_host_or_cohost"
  on public.hackathon_tracks for insert with check (
    auth.uid() in (select host_id from public.hackathons where id = hackathon_tracks.hackathon_id)
    or auth.uid() in (select user_id from public.hackathon_cohosts where hackathon_id = hackathon_tracks.hackathon_id)
  );

drop policy if exists "hackathon_tracks_update_host" on public.hackathon_tracks;
create policy "hackathon_tracks_update_host_or_cohost"
  on public.hackathon_tracks for update using (
    auth.uid() in (select host_id from public.hackathons where id = hackathon_tracks.hackathon_id)
    or auth.uid() in (select user_id from public.hackathon_cohosts where hackathon_id = hackathon_tracks.hackathon_id)
  );

drop policy if exists "hackathon_tracks_delete_host" on public.hackathon_tracks;
create policy "hackathon_tracks_delete_host_or_cohost"
  on public.hackathon_tracks for delete using (
    auth.uid() in (select host_id from public.hackathons where id = hackathon_tracks.hackathon_id)
    or auth.uid() in (select user_id from public.hackathon_cohosts where hackathon_id = hackathon_tracks.hackathon_id)
  );

-- Update submission policies to allow judges and cohosts
drop policy if exists "submissions_update_team_or_host" on public.submissions;
create policy "submissions_update_team_host_judge"
  on public.submissions for update using (
    auth.uid() in (select user_id from public.team_members where team_id = submissions.team_id)
    or auth.uid() in (select host_id from public.hackathons where id = submissions.hackathon_id)
    or auth.uid() in (select user_id from public.hackathon_cohosts where hackathon_id = submissions.hackathon_id)
    or auth.uid() in (select user_id from public.hackathon_judges where hackathon_id = submissions.hackathon_id)
  );

-- 12. Update handle_new_user trigger — remove role assignment
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, display_name, avatar_url, oauth_provider)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_app_meta_data->>'provider'
  );
  return new;
end;
$$;

-- 13. Drop old tables, columns, and enums (after data migration)
-- Drop tables first (CASCADE removes dependent triggers, indexes, policies)
drop table if exists public.judge_invites cascade;
drop table if exists public.host_applications cascade;

-- Drop the role column (must come before dropping the enum)
alter table public.users drop column if exists role;

-- Drop old enums
drop type if exists app_role;
drop type if exists host_application_status;

-- Drop the now-unused index on users
drop index if exists idx_users_role;
