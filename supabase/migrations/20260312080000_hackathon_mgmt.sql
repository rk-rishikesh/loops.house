-- Hackathon Management & Finalization Migration
-- Adds: finalization columns, speakers table, results table

-- 1. Add finalization columns to hackathons
ALTER TABLE hackathons
  ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_weight NUMERIC DEFAULT 0.5;

-- 2. Create hackathon_speakers table
CREATE TABLE IF NOT EXISTS hackathon_speakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hackathon_speakers_hackathon
  ON hackathon_speakers(hackathon_id);

-- 3. Create hackathon_results table (frozen leaderboard)
CREATE TABLE IF NOT EXISTS hackathon_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES loops_profiles(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  final_score NUMERIC NOT NULL DEFAULT 0,
  ai_score_weighted NUMERIC NOT NULL DEFAULT 0,
  judge_score_weighted NUMERIC NOT NULL DEFAULT 0,
  raw_ai_score NUMERIC DEFAULT 0,
  raw_judge_avg_score NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hackathon_id, submission_id)
);
CREATE INDEX IF NOT EXISTS idx_hackathon_results_hackathon
  ON hackathon_results(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_hackathon_results_rank
  ON hackathon_results(hackathon_id, rank);

-- 4. RLS policies
ALTER TABLE hackathon_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_results ENABLE ROW LEVEL SECURITY;

-- Speakers: public read, service-role write (via admin client)
DROP POLICY IF EXISTS "Anyone can read speakers" ON hackathon_speakers;
CREATE POLICY "Anyone can read speakers"
  ON hackathon_speakers FOR SELECT USING (true);

-- Results: public read, service-role write
DROP POLICY IF EXISTS "Anyone can read results" ON hackathon_results;
CREATE POLICY "Anyone can read results"
  ON hackathon_results FOR SELECT USING (true);
