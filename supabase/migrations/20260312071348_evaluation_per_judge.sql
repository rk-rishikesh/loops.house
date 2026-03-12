-- ============================================================
-- Migration: Per-Judge Human Evaluations
-- - Creates human_evaluations table (one row per judge × submission)
-- - Adds ai_evaluated_at to submissions (locks AI eval after first run)
-- - Drops human_score from submissions (replaced by human_evaluations)
-- ============================================================

-- 1. Create human_evaluations table
create table public.human_evaluations (
  id              uuid primary key default gen_random_uuid(),
  submission_id   uuid not null references public.submissions(id) on delete cascade,
  judge_id        uuid not null references public.users(id) on delete cascade,
  hackathon_id    uuid not null references public.hackathons(id) on delete cascade,
  scores          jsonb not null default '{}',
  remarks         jsonb not null default '{}',
  overall_notes   text,
  overall_score   integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (submission_id, judge_id)
);

create index idx_human_evaluations_submission on public.human_evaluations(submission_id);
create index idx_human_evaluations_judge on public.human_evaluations(judge_id);
create index idx_human_evaluations_hackathon on public.human_evaluations(hackathon_id);

-- 2. Add ai_evaluated_at to submissions (null = not yet evaluated)
alter table public.submissions add column ai_evaluated_at timestamptz;

-- 3. Backfill ai_evaluated_at for submissions that already have ai_score
update public.submissions
  set ai_evaluated_at = updated_at
  where ai_score is not null and ai_score::text != '{}';

-- 4. Drop human_score from submissions
alter table public.submissions drop column if exists human_score;

-- 5. Enable RLS
alter table public.human_evaluations enable row level security;

-- 6. RLS policies
create policy "human_evaluations_select"
  on public.human_evaluations for select using (
    judge_id = auth.uid()
    or auth.uid() in (select host_id from public.hackathons where id = hackathon_id)
    or auth.uid() in (select user_id from public.hackathon_cohosts where hackathon_id = human_evaluations.hackathon_id)
    or (select is_admin from public.users where id = auth.uid()) = true
  );

create policy "human_evaluations_insert_judge"
  on public.human_evaluations for insert with check (
    judge_id = auth.uid()
    and auth.uid() in (
      select user_id from public.hackathon_judges
      where hackathon_id = human_evaluations.hackathon_id
    )
  );

create policy "human_evaluations_update_own"
  on public.human_evaluations for update using (
    judge_id = auth.uid()
  );

create policy "human_evaluations_delete_own"
  on public.human_evaluations for delete using (
    judge_id = auth.uid()
  );

-- 7. Auto-update updated_at trigger
create trigger trg_human_evaluations_updated_at
  before update on public.human_evaluations
  for each row execute function update_updated_at();
