-- Remove stale knowledge base columns from loops_profiles (keep kb_sections — still used for profile build progress)
ALTER TABLE loops_profiles
  DROP COLUMN IF EXISTS knowledge_base_id,
  DROP COLUMN IF EXISTS knowledge_base_chunks;

-- Drop knowledge_bases table
DROP TABLE IF EXISTS knowledge_bases CASCADE;
