/**
 * Server-side auth helper for server components.
 *
 * Returns UserCapabilities instead of a single role.
 * Uses cookie for fast path, falls back to DB.
 */

import { getFullCapabilities, type UserCapabilities } from "@/lib/capabilities";
import { createServerSupabase } from "@/lib/supabase/server";

export type { UserCapabilities };

export interface ServerAuth {
  userId: string;
  email: string;
  capabilities: UserCapabilities;
}

export async function getServerAuth(): Promise<ServerAuth | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  // Always fetch full capabilities for server components (includes per-hackathon roles)
  const caps = await getFullCapabilities(supabase, user.id);
  if (!caps) return null;

  return { userId: user.id, email: user.email ?? "", capabilities: caps };
}
