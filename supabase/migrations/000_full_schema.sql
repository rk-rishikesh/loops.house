-- ============================================================
-- LoopsFlow: Full Schema (merged from 001–005)
-- Extensions, Enums, Tables, Indexes, RLS, Functions, Storage
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

create extension if not exists "vector";

-- ============================================================
-- 2. ENUM TYPES
-- ============================================================

create type app_role as enum ('builder', 'host', 'viewer', 'admin', 'judge');
create type booster_type as enum ('idea', 'momentum', 'capital');
create type booster_status as enum ('draft', 'active', 'judging', 'completed', 'archived');
create type submission_status as enum ('draft', 'submitted', 'under_review', 'scored', 'withdrawn');
create type host_application_status as enum ('pending', 'approved', 'rejected');

-- ============================================================
-- 3. TABLES
-- ============================================================

-- USERS (extends auth.users)
create table public.users (
  id             uuid primary key references auth.users(id) on delete cascade,
  email          text not null,
  username       text unique,
  display_name   text,
  avatar_url     text,
  role           app_role not null default 'builder',
  oauth_provider text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_users_email on public.users(email);
create index idx_users_role on public.users(role);

-- TEAMS
create table public.teams (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  owner_id   uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_teams_owner on public.teams(owner_id);

-- TEAM_MEMBERS (join table)
create table public.team_members (
  team_id   uuid not null references public.teams(id) on delete cascade,
  user_id   uuid not null references public.users(id) on delete cascade,
  role      text not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create index idx_team_members_user on public.team_members(user_id);

-- LOOPS_PROFILES (Projects)
create table public.loops_profiles (
  id                    uuid primary key default gen_random_uuid(),
  team_id               uuid not null references public.teams(id) on delete cascade,
  name                  text not null,
  tagline               text,
  description           text,
  refined_description   text,
  category              text,
  tech_stack            text[] default '{}',
  colors                jsonb default '{}',
  key_features          text[] default '{}',
  logo_url              text,
  website_url           text,
  github_url            text,
  youtube_url           text,
  screenshot_urls       text[] default '{}',
  additional_links      jsonb default '[]',
  social_links          jsonb default '[]',
  flattened_codebase    text,
  knowledge_base_id     uuid,
  momentum_score        numeric default 0,
  ai_generated_fields   text[] default '{}',
  kb_sections           text[] default '{}',
  knowledge_base_chunks integer default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index idx_loops_profiles_team on public.loops_profiles(team_id);
create index idx_loops_profiles_category on public.loops_profiles(category);

-- KNOWLEDGE_BASES
create table public.knowledge_bases (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.loops_profiles(id) on delete cascade,
  sources    jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index idx_knowledge_bases_project on public.knowledge_bases(project_id);

-- FK from loops_profiles to knowledge_bases
alter table public.loops_profiles
  add constraint fk_knowledge_base
  foreign key (knowledge_base_id) references public.knowledge_bases(id)
  on delete set null;

-- KNOWLEDGE_BASE_CHUNKS (pgvector)
create table public.knowledge_base_chunks (
  id          uuid primary key default gen_random_uuid(),
  kb_id       uuid not null references public.knowledge_bases(id) on delete cascade,
  project_id  uuid not null references public.loops_profiles(id) on delete cascade,
  chunk_index integer not null,
  content     text not null,
  embedding   vector(768) not null,
  metadata    jsonb default '{}',
  created_at  timestamptz not null default now()
);

create index idx_kb_chunks_project on public.knowledge_base_chunks(project_id);
create index idx_kb_chunks_kb on public.knowledge_base_chunks(kb_id);
create index idx_kb_chunks_embedding on public.knowledge_base_chunks
  using hnsw (embedding vector_cosine_ops);

-- BOOSTERS
create table public.boosters (
  id                  uuid primary key default gen_random_uuid(),
  host_id             uuid not null references public.users(id) on delete cascade,
  booster_type        booster_type not null default 'idea',
  name                text not null,
  description         text,
  theme               text,
  problem_statements  text[] default '{}',
  website_url         text,
  technical_docs      text,
  technical_resources jsonb default '[]',
  bounty_pool_summary text,
  program_goal        text,
  timeline            text,
  organizer_notes     text,
  judging_criteria    jsonb default '{}',
  status              booster_status not null default 'draft',
  leaderboard_enabled boolean default false,
  start_date          timestamptz,
  end_date            timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_boosters_host on public.boosters(host_id);
create index idx_boosters_type on public.boosters(booster_type);
create index idx_boosters_status on public.boosters(status);

-- BOOSTER_TRACKS (sponsor tracks)
create table public.booster_tracks (
  id                uuid primary key default gen_random_uuid(),
  booster_id        uuid not null references public.boosters(id) on delete cascade,
  sponsor_name      text not null,
  track_name        text,
  track_description text,
  docs_text         text,
  cheatsheet_text   text,
  api_endpoints     text[] default '{}',
  sdk_examples      text[] default '{}',
  created_at        timestamptz not null default now()
);

create index idx_booster_tracks_booster on public.booster_tracks(booster_id);

-- BOOSTER_TRACK_CHUNKS (pgvector for Tech Buddy RAG)
create table public.booster_track_chunks (
  id         uuid primary key default gen_random_uuid(),
  booster_id uuid not null references public.boosters(id) on delete cascade,
  track_id   uuid references public.booster_tracks(id) on delete cascade,
  content    text not null,
  source     text not null,
  embedding  vector(768) not null,
  created_at timestamptz not null default now()
);

create index idx_btc_booster on public.booster_track_chunks(booster_id);
create index idx_btc_embedding on public.booster_track_chunks
  using hnsw (embedding vector_cosine_ops);

-- SUBMISSIONS
create table public.submissions (
  id              uuid primary key default gen_random_uuid(),
  booster_id      uuid not null references public.boosters(id) on delete cascade,
  team_id         uuid not null references public.teams(id) on delete cascade,
  project_id      uuid not null references public.loops_profiles(id) on delete cascade,
  ai_score        jsonb default '{}',
  human_score     jsonb default '{}',
  momentum_score  numeric default 0,
  status          submission_status not null default 'draft',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (booster_id, project_id)
);

create index idx_submissions_booster on public.submissions(booster_id);
create index idx_submissions_team on public.submissions(team_id);
create index idx_submissions_project on public.submissions(project_id);

-- HOST_APPLICATIONS
create table public.host_applications (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.users(id) on delete cascade,
  booster_type          booster_type not null,
  event_name            text not null,
  expected_participants integer,
  contact               text,
  description           text,
  status                host_application_status not null default 'pending',
  reviewed_by           uuid references public.users(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index idx_host_apps_user on public.host_applications(user_id);
create index idx_host_apps_status on public.host_applications(status);

-- JUDGE_INVITES
create table public.judge_invites (
  id              uuid primary key default gen_random_uuid(),
  booster_id      uuid not null references public.boosters(id) on delete cascade,
  judge_user_id   uuid not null references public.users(id) on delete cascade,
  assigned_tracks uuid[] default '{}',
  invited_by      uuid not null references public.users(id),
  accepted        boolean default false,
  created_at      timestamptz not null default now(),
  unique (booster_id, judge_user_id)
);

create index idx_judge_invites_booster on public.judge_invites(booster_id);
create index idx_judge_invites_judge on public.judge_invites(judge_user_id);

-- RATE_LIMITS (DB-backed rate limiter)
create table public.rate_limits (
  key        text primary key,
  count      integer not null default 0,
  reset_at   timestamptz not null,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.loops_profiles enable row level security;
alter table public.knowledge_bases enable row level security;
alter table public.knowledge_base_chunks enable row level security;
alter table public.boosters enable row level security;
alter table public.booster_tracks enable row level security;
alter table public.booster_track_chunks enable row level security;
alter table public.submissions enable row level security;
alter table public.host_applications enable row level security;
alter table public.judge_invites enable row level security;
alter table public.rate_limits enable row level security;

-- USERS
create policy "users_select_public"
  on public.users for select using (true);

create policy "users_update_self"
  on public.users for update using (auth.uid() = id);

-- TEAMS
create policy "teams_select_public"
  on public.teams for select using (true);

create policy "teams_insert_owner"
  on public.teams for insert with check (auth.uid() = owner_id);

create policy "teams_update_owner"
  on public.teams for update using (auth.uid() = owner_id);

create policy "teams_delete_owner"
  on public.teams for delete using (auth.uid() = owner_id);

-- TEAM_MEMBERS
create policy "team_members_select_public"
  on public.team_members for select using (true);

create policy "team_members_insert"
  on public.team_members for insert with check (
    auth.uid() in (select owner_id from public.teams where id = team_id)
    or auth.uid() = user_id
  );

create policy "team_members_delete"
  on public.team_members for delete using (
    auth.uid() = user_id
    or auth.uid() in (select owner_id from public.teams where id = team_id)
  );

-- LOOPS_PROFILES (Projects)
create policy "profiles_select_public"
  on public.loops_profiles for select using (true);

create policy "profiles_insert_team_member"
  on public.loops_profiles for insert with check (
    auth.uid() in (select user_id from public.team_members where team_id = loops_profiles.team_id)
  );

create policy "profiles_update_team_member"
  on public.loops_profiles for update using (
    auth.uid() in (select user_id from public.team_members where team_id = loops_profiles.team_id)
  );

create policy "profiles_delete_team_owner"
  on public.loops_profiles for delete using (
    auth.uid() in (select owner_id from public.teams where id = loops_profiles.team_id)
  );

-- KNOWLEDGE_BASES
create policy "kb_select_public"
  on public.knowledge_bases for select using (true);

create policy "kb_insert_team_member"
  on public.knowledge_bases for insert with check (
    auth.uid() in (
      select tm.user_id from public.team_members tm
      join public.loops_profiles lp on lp.team_id = tm.team_id
      where lp.id = knowledge_bases.project_id
    )
  );

create policy "kb_update_team_member"
  on public.knowledge_bases for update using (
    auth.uid() in (
      select tm.user_id from public.team_members tm
      join public.loops_profiles lp on lp.team_id = tm.team_id
      where lp.id = knowledge_bases.project_id
    )
  );

create policy "kb_delete_team_member"
  on public.knowledge_bases for delete using (
    auth.uid() in (
      select tm.user_id from public.team_members tm
      join public.loops_profiles lp on lp.team_id = tm.team_id
      where lp.id = knowledge_bases.project_id
    )
  );

-- KNOWLEDGE_BASE_CHUNKS
create policy "kb_chunks_select_public"
  on public.knowledge_base_chunks for select using (true);

create policy "kb_chunks_insert_team_member"
  on public.knowledge_base_chunks for insert with check (
    auth.uid() in (
      select tm.user_id from public.team_members tm
      join public.loops_profiles lp on lp.team_id = tm.team_id
      where lp.id = knowledge_base_chunks.project_id
    )
  );

create policy "kb_chunks_delete_team_member"
  on public.knowledge_base_chunks for delete using (
    auth.uid() in (
      select tm.user_id from public.team_members tm
      join public.loops_profiles lp on lp.team_id = tm.team_id
      where lp.id = knowledge_base_chunks.project_id
    )
  );

-- BOOSTERS
create policy "boosters_select_public"
  on public.boosters for select using (true);

create policy "boosters_insert_host"
  on public.boosters for insert with check (
    auth.uid() = host_id
    and (select role from public.users where id = auth.uid()) in ('host', 'admin')
  );

create policy "boosters_update_host"
  on public.boosters for update using (auth.uid() = host_id);

create policy "boosters_delete_host"
  on public.boosters for delete using (auth.uid() = host_id);

-- BOOSTER_TRACKS
create policy "booster_tracks_select_public"
  on public.booster_tracks for select using (true);

create policy "booster_tracks_insert_host"
  on public.booster_tracks for insert with check (
    auth.uid() in (select host_id from public.boosters where id = booster_tracks.booster_id)
  );

create policy "booster_tracks_update_host"
  on public.booster_tracks for update using (
    auth.uid() in (select host_id from public.boosters where id = booster_tracks.booster_id)
  );

create policy "booster_tracks_delete_host"
  on public.booster_tracks for delete using (
    auth.uid() in (select host_id from public.boosters where id = booster_tracks.booster_id)
  );

-- BOOSTER_TRACK_CHUNKS
create policy "btc_select_public"
  on public.booster_track_chunks for select using (true);

create policy "btc_insert_host"
  on public.booster_track_chunks for insert with check (
    auth.uid() in (select host_id from public.boosters where id = booster_track_chunks.booster_id)
  );

create policy "btc_delete_host"
  on public.booster_track_chunks for delete using (
    auth.uid() in (select host_id from public.boosters where id = booster_track_chunks.booster_id)
  );

-- SUBMISSIONS
create policy "submissions_select_public"
  on public.submissions for select using (true);

create policy "submissions_insert_team_member"
  on public.submissions for insert with check (
    auth.uid() in (select user_id from public.team_members where team_id = submissions.team_id)
  );

create policy "submissions_update_team_or_host"
  on public.submissions for update using (
    auth.uid() in (select user_id from public.team_members where team_id = submissions.team_id)
    or auth.uid() in (select host_id from public.boosters where id = submissions.booster_id)
  );

-- HOST_APPLICATIONS
create policy "host_apps_select_self_or_admin"
  on public.host_applications for select using (
    auth.uid() = user_id
    or (select role from public.users where id = auth.uid()) = 'admin'
  );

create policy "host_apps_insert_self"
  on public.host_applications for insert with check (auth.uid() = user_id);

create policy "host_apps_update_admin"
  on public.host_applications for update using (
    (select role from public.users where id = auth.uid()) = 'admin'
  );

-- JUDGE_INVITES
create policy "judge_invites_select_relevant"
  on public.judge_invites for select using (
    auth.uid() = judge_user_id
    or auth.uid() in (select host_id from public.boosters where id = judge_invites.booster_id)
  );

create policy "judge_invites_insert_host"
  on public.judge_invites for insert with check (
    auth.uid() in (select host_id from public.boosters where id = judge_invites.booster_id)
  );

create policy "judge_invites_update_judge"
  on public.judge_invites for update using (auth.uid() = judge_user_id);

-- RATE_LIMITS (service role only)
create policy "rate_limits_service_role"
  on public.rate_limits for all using (auth.role() = 'service_role');

-- ============================================================
-- 5. FUNCTIONS, TRIGGERS, AND RPC
-- ============================================================

-- Auto-create public.users row when auth.users is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, display_name, avatar_url, oauth_provider, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_app_meta_data->>'provider',
    'builder'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at columns
create or replace function update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated_at before update on public.users for each row execute function update_updated_at();
create trigger trg_teams_updated_at before update on public.teams for each row execute function update_updated_at();
create trigger trg_loops_profiles_updated_at before update on public.loops_profiles for each row execute function update_updated_at();
create trigger trg_knowledge_bases_updated_at before update on public.knowledge_bases for each row execute function update_updated_at();
create trigger trg_boosters_updated_at before update on public.boosters for each row execute function update_updated_at();
create trigger trg_submissions_updated_at before update on public.submissions for each row execute function update_updated_at();
create trigger trg_host_applications_updated_at before update on public.host_applications for each row execute function update_updated_at();

-- Vector similarity search: Knowledge Base chunks
create or replace function match_kb_chunks(
  query_embedding vector(768),
  match_project_id uuid,
  match_count int default 5,
  match_threshold float default 0.0
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    kbc.id,
    kbc.content,
    kbc.metadata,
    1 - (kbc.embedding <=> query_embedding) as similarity
  from public.knowledge_base_chunks kbc
  where kbc.project_id = match_project_id
    and 1 - (kbc.embedding <=> query_embedding) > match_threshold
  order by kbc.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Vector similarity search: Booster Track chunks (Tech Buddy)
create or replace function match_booster_chunks(
  query_embedding vector(768),
  match_booster_id uuid,
  match_count int default 5,
  match_threshold float default 0.75
)
returns table (
  id uuid,
  content text,
  source text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    btc.id,
    btc.content,
    btc.source,
    1 - (btc.embedding <=> query_embedding) as similarity
  from public.booster_track_chunks btc
  where btc.booster_id = match_booster_id
    and 1 - (btc.embedding <=> query_embedding) > match_threshold
  order by btc.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Rate limiter RPC
create or replace function check_rate_limit(
  p_key text,
  p_max_requests int,
  p_window_ms bigint default 3600000
)
returns table (
  allowed boolean,
  remaining int,
  reset_at timestamptz
)
language plpgsql
security definer
as $$
declare
  v_now timestamptz := now();
  v_entry record;
  v_reset timestamptz;
begin
  select * into v_entry from public.rate_limits where key = p_key;

  if v_entry is null or v_now >= v_entry.reset_at then
    v_reset := v_now + (p_window_ms || ' milliseconds')::interval;
    insert into public.rate_limits (key, count, reset_at, updated_at)
    values (p_key, 1, v_reset, v_now)
    on conflict (key) do update set count = 1, reset_at = v_reset, updated_at = v_now;
    return query select true, p_max_requests - 1, v_reset;
    return;
  end if;

  if v_entry.count >= p_max_requests then
    return query select false, 0, v_entry.reset_at;
    return;
  end if;

  update public.rate_limits set count = count + 1, updated_at = v_now where key = p_key;
  return query select true, p_max_requests - (v_entry.count + 1), v_entry.reset_at;
end;
$$;

-- ============================================================
-- 6. STORAGE BUCKETS
-- ============================================================

insert into storage.buckets (id, name, public)
values ('project-assets', 'project-assets', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('booster-assets', 'booster-assets', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('user-avatars', 'user-avatars', true)
on conflict (id) do nothing;

-- Storage Policies
create policy "project_assets_select"
  on storage.objects for select
  using (bucket_id = 'project-assets');

create policy "project_assets_insert"
  on storage.objects for insert
  with check (bucket_id = 'project-assets' and auth.role() = 'authenticated');

create policy "project_assets_delete"
  on storage.objects for delete
  using (bucket_id = 'project-assets' and auth.role() = 'authenticated');

create policy "booster_assets_select"
  on storage.objects for select
  using (bucket_id = 'booster-assets');

create policy "booster_assets_insert"
  on storage.objects for insert
  with check (bucket_id = 'booster-assets' and auth.role() = 'authenticated');

create policy "user_avatars_select"
  on storage.objects for select
  using (bucket_id = 'user-avatars');

create policy "user_avatars_insert"
  on storage.objects for insert
  with check (bucket_id = 'user-avatars' and auth.role() = 'authenticated');

-- ============================================================
-- 7. PERFORMANCE INDEXES (composite indexes for common queries)
-- ============================================================

-- Submissions: filter by booster + status (analytics, host dashboard)
create index if not exists idx_submissions_booster_status
  on submissions (booster_id, status);

-- Submissions: filter by project (builder project detail)
create index if not exists idx_submissions_project
  on submissions (project_id, created_at desc);

-- Profiles: filter by team + order (project listing)
create index if not exists idx_profiles_team_created
  on loops_profiles (team_id, created_at desc);

-- Knowledge base chunks: sequential reads by project
create index if not exists idx_kb_chunks_project_index
  on knowledge_base_chunks (project_id, chunk_index);

-- Team members: lookup by user (team listing)
-- Already created above, using IF NOT EXISTS for safety
create index if not exists idx_team_members_user
  on team_members (user_id);

-- Boosters: filter by type (booster listing)
create index if not exists idx_boosters_type_created
  on boosters (booster_type, created_at desc);
