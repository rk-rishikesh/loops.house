#!/bin/bash
# Push local migrations to your remote Supabase database.
#
# Prerequisites:
#   npx supabase login          (one-time, opens browser)
#   npx supabase link --project-ref flfxbhlmqjvquisqewjw
#
# Usage: ./supabase/scripts/db-push.sh

set -e

echo "Pushing migrations to Supabase..."
npx supabase db push

echo ""
echo "Verifying database state..."
node supabase/scripts/db-status.mjs
