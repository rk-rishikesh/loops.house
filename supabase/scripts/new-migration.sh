#!/bin/bash
# Create a new timestamped migration file.
#
# Usage: ./supabase/scripts/new-migration.sh "add_user_bio_column"
#
# This creates: supabase/migrations/<timestamp>_<name>.sql
# Edit the file, then run: ./supabase/scripts/db-push.sh

set -e

if [ -z "$1" ]; then
  echo "Usage: ./supabase/scripts/new-migration.sh <migration_name>"
  echo "Example: ./supabase/scripts/new-migration.sh add_user_bio_column"
  exit 1
fi

TIMESTAMP=$(date +%Y%m%d%H%M%S)
FILENAME="supabase/migrations/${TIMESTAMP}_${1}.sql"

cat > "$FILENAME" << 'EOF'
-- Migration: $1
-- Created: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

-- Write your SQL here:

EOF

echo "Created migration: $FILENAME"
echo "Edit the file, then run: ./supabase/scripts/db-push.sh"
