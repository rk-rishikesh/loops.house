-- Revert: restore knowledge_bases table and loops_profiles columns dropped in previous migration

-- Recreate knowledge_bases table
CREATE TABLE IF NOT EXISTS public.knowledge_bases (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.loops_profiles(id) on delete cascade,
  sources    jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_knowledge_bases_project ON public.knowledge_bases(project_id);

ALTER TABLE public.knowledge_bases ENABLE ROW LEVEL SECURITY;

-- Restore columns on loops_profiles
ALTER TABLE public.loops_profiles
  ADD COLUMN IF NOT EXISTS knowledge_base_id uuid,
  ADD COLUMN IF NOT EXISTS knowledge_base_chunks integer default 0;

-- Restore FK constraint
ALTER TABLE public.loops_profiles
  DROP CONSTRAINT IF EXISTS fk_knowledge_base;
ALTER TABLE public.loops_profiles
  ADD CONSTRAINT fk_knowledge_base
  FOREIGN KEY (knowledge_base_id) REFERENCES public.knowledge_bases(id)
  ON DELETE SET NULL;
