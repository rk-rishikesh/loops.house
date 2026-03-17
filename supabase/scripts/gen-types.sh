#!/bin/bash
# Auto-generate TypeScript types from your live Supabase schema.
#
# Prerequisites:
#   npx supabase login          (one-time, opens browser)
#   npx supabase link --project-ref flfxbhlmqjvquisqewjw
#
# Usage: ./supabase/scripts/gen-types.sh

set -e

PROJECT_REF="xhcflmioqsoncfeoxpiy"
OUTPUT_FILE="lib/supabase/database.types.ts"

echo "Generating TypeScript types from live Supabase schema..."
echo "Project: $PROJECT_REF"
echo "Output:  $OUTPUT_FILE"
echo ""

npx supabase gen types typescript --project-id "$PROJECT_REF" > "$OUTPUT_FILE"

echo "Types generated successfully at $OUTPUT_FILE"
echo ""
echo "Tip: Run this after every migration to keep types in sync."
