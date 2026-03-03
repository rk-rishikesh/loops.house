/**
 * Server-side auth helper for server components.
 *
 * Reads the current user and role without hooks.
 * Uses the role cookie set by middleware for fast access,
 * falls back to DB query.
 */

import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/supabase/types";

export type { AppRole };

export interface ServerAuth {
  userId: string;
  role: AppRole;
}

export async function getServerAuth(): Promise<ServerAuth | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  // Try the HTTP-only role cookie set by middleware first (fast path)
  const cookieStore = await cookies();
  const roleCookie = cookieStore.get("x-user-role")?.value;
  if (roleCookie) {
    const sep = roleCookie.indexOf(":");
    if (sep !== -1 && roleCookie.slice(0, sep) === user.id) {
      const role = roleCookie.slice(sep + 1) as AppRole;
      return { userId: user.id, role };
    }
  }

  // Fallback: query the DB
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return { userId: user.id, role: profile.role as AppRole };
}
