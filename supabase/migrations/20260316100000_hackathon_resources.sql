-- Drop technical_docs column from hackathons
ALTER TABLE hackathons DROP COLUMN IF EXISTS technical_docs;

-- Create hackathon_resources table (AI-generated context for builder agents)
CREATE TABLE IF NOT EXISTS hackathon_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  content JSONB NOT NULL DEFAULT '{}',
  source_urls TEXT[] NOT NULL DEFAULT '{}',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hackathon_id)
);

ALTER TABLE hackathon_resources ENABLE ROW LEVEL SECURITY;

-- Public can read resources for any active hackathon
CREATE POLICY "hr_select_public" ON hackathon_resources
  FOR SELECT USING (true);

-- Host or cohost can insert/update resources
CREATE POLICY "hr_insert_host" ON hackathon_resources
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM hackathons h
      WHERE h.id = hackathon_id
        AND (h.host_id = auth.uid()
          OR EXISTS (SELECT 1 FROM hackathon_cohosts c WHERE c.hackathon_id = h.id AND c.user_id = auth.uid()))
    )
  );

CREATE POLICY "hr_update_host" ON hackathon_resources
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM hackathons h
      WHERE h.id = hackathon_id
        AND (h.host_id = auth.uid()
          OR EXISTS (SELECT 1 FROM hackathon_cohosts c WHERE c.hackathon_id = h.id AND c.user_id = auth.uid()))
    )
  );
