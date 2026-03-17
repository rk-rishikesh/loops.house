-- Add logo and banner image columns to hackathons
ALTER TABLE hackathons
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Remove technical_docs column (resources are sufficient)
ALTER TABLE hackathons
  DROP COLUMN IF EXISTS technical_docs;

-- Drop hackathon_track_chunks (depends on hackathon_tracks)
DROP TABLE IF EXISTS hackathon_track_chunks CASCADE;

-- Drop hackathon_tracks
DROP TABLE IF EXISTS hackathon_tracks CASCADE;

-- Drop knowledge_base_chunks
DROP TABLE IF EXISTS knowledge_base_chunks CASCADE;

-- Drop hackathon_track_chunks
DROP TABLE IF EXISTS hackathon_track_chunks CASCADE;

-- Drop knowledge_base_chunks
DROP TABLE IF EXISTS knowledge_base_chunks CASCADE;

-- Drop related RPC functions
DROP FUNCTION IF EXISTS match_kb_chunks(vector(768), int, float, uuid);
DROP FUNCTION IF EXISTS match_hackathon_track_chunks(vector(768), int, float, uuid);
