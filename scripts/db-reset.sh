#!/bin/bash
# Reset the remote Supabase database and re-run all migrations.
# WARNING: This drops all data! Only use in development.
#
# Prerequisites:
#   npx supabase login
#   npx supabase link --project-ref flfxbhlmqjvquisqewjw
#
# Usage: ./scripts/db-reset.sh

set -e

echo "WARNING: This will drop all tables and data in your Supabase database!"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read -r

echo "Resetting database..."
npx supabase db reset --linked

echo ""
echo "Regenerating types..."
./scripts/gen-types.sh

echo ""
echo "Verifying database state..."
node scripts/db-status.mjs
