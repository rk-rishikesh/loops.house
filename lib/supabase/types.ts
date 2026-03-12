/**
 * Supabase Database types — barrel re-exports.
 *
 * `database.types.ts` is auto-generated from the live schema:
 *   npm run db:gen-types
 *
 * This file re-exports the generated types and adds convenience aliases
 * so the rest of the codebase can import named enums directly.
 */

export type { Database, Json, Tables, TablesInsert, TablesUpdate, Enums } from "./database.types";

import type { Database } from "./database.types";

// ---------------------------------------------------------------------------
// Convenience enum aliases
// ---------------------------------------------------------------------------
export type HackathonStatus = Database["public"]["Enums"]["hackathon_status"];
export type SubmissionStatus = Database["public"]["Enums"]["submission_status"];
export type InvitationType = Database["public"]["Enums"]["invitation_type"];
export type InvitationStatus = Database["public"]["Enums"]["invitation_status"];
