-- Add logo and banner image columns to hackathons
ALTER TABLE hackathons
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS banner_url TEXT;
