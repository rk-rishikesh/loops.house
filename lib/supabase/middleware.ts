import { createServerSupabase } from "./server";
import {
  getBasicCapabilities,
  type BasicCapabilities,
} from "@/lib/capabilities";

export type AuthUser = {
  id: string;
  email: string;
  is_admin: boolean;
  is_event_creator: boolean;
};

export type AuthResult = {
  user: AuthUser;
  supabase: Awaited<ReturnType<typeof createServerSupabase>>;
};

/**
 * Validate session and optionally check capabilities.
 *
 * @param check — optional predicate on BasicCapabilities.
 *   Example: `requireAuth((caps) => caps.isAdmin)`
 *   If omitted, any authenticated user passes.
 */
export async function requireAuth(
  check?: (caps: BasicCapabilities) => boolean,
): Promise<AuthResult | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const caps = await getBasicCapabilities(supabase, user.id);
  if (!caps) return null;
  if (check && !check(caps)) return null;

  return {
    user: {
      id: user.id,
      email: user.email!,
      is_admin: caps.isAdmin,
      is_event_creator: caps.isEventCreator,
    },
    supabase,
  };
}

export function unauthorized(message = "Unauthorized") {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

export function forbidden(message = "Forbidden") {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}
