/**
 * Re-export the Database type from the monorepo.
 * At build time, Bun resolves and bundles this — the relative path
 * only matters during development within the monorepo.
 */
export type { Database } from "../../lib/supabase/database.types.js";
